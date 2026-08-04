// Camada opcional de nuvem: login (Google / e-mail) e sincronização dos dados no Firestore.
// Design "local-first": o app continua usando localStorage normalmente; quando há login,
// os dados são baixados na entrada e enviados (debounce) a cada alteração.
// Se o Firebase não estiver configurado ou o SDK não carregar, tudo vira no-op e o app roda local.
const Cloud = (() => {
  // Chaves do Storage que sincronizam. Fotos (IndexedDB) ficam de fora nesta fase.
  const SYNC_KEYS = [
    'treino', 'corridas', 'alimentacao', 'medidas', 'tarefas', 'tarefas_conclusoes',
    'alimentos_biblioteca', 'exercicios_biblioteca', 'dietas_custom', 'treino_planos',
    'combos', 'agua', 'gastos', 'refeicao_fotos',
  ];

  let enabled = false;
  let auth = null;
  let db = null;
  let user = null;
  let dirtyTimer = null;
  let status = 'local'; // 'local' | 'syncing' | 'synced' | 'error'
  let isAdminFlag = false;
  const listeners = [];

  // Coleções compartilhadas entre TODOS os usuários (alimentos e exercícios).
  // O estado de cada uma vive dentro do gerenciador criado por criarCompartilhado().

  function isEnabled() { return enabled; }
  function currentUser() { return user; }
  function getStatus() { return status; }
  function onChange(fn) { listeners.push(fn); }
  function emit() { listeners.forEach(fn => { try { fn(); } catch (e) { console.error(e); } }); }

  // Envolve o Storage para disparar sincronização a cada escrita local.
  function wrapStorage() {
    if (typeof Storage === 'undefined') return;
    const _saveAll = Storage.saveAll;
    Storage.saveAll = function (k, items) { _saveAll(k, items); markDirty(); };
    const _savePerfil = Storage.savePerfil;
    Storage.savePerfil = function (d) { _savePerfil(d); markDirty(); };
    // Ao adicionar um item custom na biblioteca, compartilha com todos os usuários.
    const _add = Storage.add;
    Storage.add = function (k, entry) {
      const r = _add(k, entry);
      if (r && r.custom) {
        if (k === 'alimentos_biblioteca') compAlimentos.push(r);
        else if (k === 'exercicios_biblioteca') compExercicios.push(r);
      }
      return r;
    };
  }

  // ---- Coleções compartilhadas (globais) ----
  function nomeChave(f) { return (f && f.name ? f.name : '').trim().toLowerCase(); }

  // Gerencia uma coleção compartilhada: envia itens custom locais e mescla os de outros
  // usuários na biblioteca local (em tempo real), sem duplicar por nome.
  // stripFields: campos NÃO compartilhados ao enviar (ex: 'videoUrl' — vídeo passa por aprovação).
  // applyFields: campos que, quando presentes no doc compartilhado, atualizam o item local já
  //   existente (ex: 'videoUrl' aprovado passa a valer para todos).
  function criarCompartilhado(colName, storageKey, stripFields, defaults, applyFields) {
    const vistos = new Set();
    let unsub = null;

    function push(item) {
      if (!enabled || !user || !db || !item) return;
      const nome = nomeChave(item);
      if (!nome || vistos.has(nome)) return;
      vistos.add(nome);
      const dados = { ...item };
      ['id', 'custom'].concat(stripFields || []).forEach(f => delete dados[f]);
      db.collection(colName).add({ ...dados, addedBy: user.uid })
        .catch(e => { console.error('Compartilhar falhou', colName, e); vistos.delete(nome); });
    }

    function start() {
      if (!enabled || !user || !db || unsub) return;
      unsub = db.collection(colName).onSnapshot(snap => {
        const locais = Storage.getAll(storageKey);
        const porNome = new Map(locais.map(l => [nomeChave(l), l]));
        let mudou = false;
        snap.forEach(doc => {
          const it = doc.data();
          const nome = nomeChave(it);
          if (!nome) return;
          vistos.add(nome);
          const local = porNome.get(nome);
          if (!local) {
            const novo = { ...(defaults || {}), ...it, id: Storage.uid(), custom: true };
            locais.push(novo); porNome.set(nome, novo); mudou = true;
          } else if (applyFields && applyFields.length) {
            applyFields.forEach(f => {
              if (it[f] && local[f] !== it[f]) { local[f] = it[f]; mudou = true; }
            });
          }
        });
        if (mudou) {
          localStorage.setItem(Storage.KEYS[storageKey], JSON.stringify(locais));
          emit();
        }
        Storage.getAll(storageKey)
          .filter(f => f.custom === true && !vistos.has(nomeChave(f)))
          .forEach(push);
      }, err => console.error('Listener compartilhado falhou', colName, err));
    }

    function stop() { if (unsub) { unsub(); unsub = null; } vistos.clear(); }

    return { push, start, stop };
  }

  const compAlimentos = criarCompartilhado('sharedFoods', 'alimentos_biblioteca', [], {}, []);
  const compExercicios = criarCompartilhado('sharedExercises', 'exercicios_biblioteca', ['videoUrl'], { videoUrl: '' }, ['videoUrl']);

  function init() {
    if (typeof FIREBASE_CONFIG === 'undefined' || !FIREBASE_CONFIG) return;
    if (typeof firebase === 'undefined' || !firebase.initializeApp) return;
    try {
      firebase.initializeApp(FIREBASE_CONFIG);
      auth = firebase.auth();
      db = firebase.firestore();
      try { auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL); } catch (e) { /* ignore */ }
      enabled = true;
      auth.onAuthStateChanged(async u => {
        user = u || null;
        if (u) {
          status = 'syncing'; emit();
          try { await onLogin(); status = 'synced'; }
          catch (e) { console.error('Sincronização falhou', e); status = 'error'; }
          await escreverPerfilPublico();
          await verificarAdmin();
          await aplicarPrescricao();
          compAlimentos.start();
          compExercicios.start();
        } else {
          compAlimentos.stop();
          compExercicios.stop();
          isAdminFlag = false;
          status = 'local';
        }
        emit();
      });
    } catch (e) {
      console.error('Cloud init falhou — seguindo local', e);
      enabled = false;
    }
  }

  function localSnapshot() {
    const data = {};
    SYNC_KEYS.forEach(k => { data[k] = Storage.getAll(k); });
    data.perfil = Storage.getPerfil();
    data._updatedAt = Date.now();
    return data;
  }

  function localHasData() {
    const anyStore = SYNC_KEYS.some(k => (Storage.getAll(k) || []).length > 0);
    const perfil = Storage.getPerfil() || {};
    return anyStore || Object.keys(perfil).length > 0;
  }

  // Escreve direto no localStorage (sem passar pelo Storage.saveAll envolvido,
  // pra não disparar um push logo após o download).
  function writeLocalRaw(data) {
    SYNC_KEYS.forEach(k => {
      if (Array.isArray(data[k])) localStorage.setItem(Storage.KEYS[k], JSON.stringify(data[k]));
    });
    if (data.perfil) localStorage.setItem('perfil', JSON.stringify(data.perfil));
  }

  // Guarda quando (timestamp da nuvem) este aparelho ficou sincronizado pela última vez,
  // pra saber se um dado da nuvem é realmente mais novo antes de sobrescrever o local.
  function chaveUltimoSync(u) { return 'cloud_last_synced_' + u; }
  function marcarSincronizado(ts) {
    if (user) localStorage.setItem(chaveUltimoSync(user.uid), String(ts || Date.now()));
  }

  async function onLogin() {
    const ref = db.collection('users').doc(user.uid);
    const snap = await ref.get();
    const cloudData = snap.exists ? snap.data() : null;
    const cloudHas = !!cloudData && SYNC_KEYS.some(k => Array.isArray(cloudData[k]) && cloudData[k].length > 0);
    const localHas = localHasData();
    // Marca por conta (uid) se esse aparelho já passou pela reconciliação inicial,
    // pra não perguntar de novo a cada login — depois da primeira vez a nuvem já é a fonte de verdade.
    const chaveReconciliado = 'cloud_reconciliado_' + user.uid;
    const jaReconciliado = localStorage.getItem(chaveReconciliado) === '1';

    if (cloudHas && !localHas) {
      writeLocalRaw(cloudData);
      marcarSincronizado(cloudData._updatedAt);
    } else if (!cloudHas && localHas) {
      await push();
    } else if (cloudHas && localHas) {
      if (jaReconciliado) {
        // Escrever local (com debounce de 1.5s) pode não ter chegado à nuvem ainda —
        // só puxa a nuvem se ela for realmente mais nova que a última sincronização
        // deste aparelho; senão empurra o local (que pode ter mudanças recentes não enviadas).
        const ultimoSync = Number(localStorage.getItem(chaveUltimoSync(user.uid)) || 0);
        if ((cloudData._updatedAt || 0) > ultimoSync) {
          writeLocalRaw(cloudData);
          marcarSincronizado(cloudData._updatedAt);
        } else {
          await push();
        }
      } else {
        const usarNuvem = window.confirm(
          'Encontramos dados na sua conta na nuvem e também neste aparelho.\n\n' +
          'OK = usar os dados da NUVEM (substitui os deste aparelho).\n' +
          'Cancelar = enviar os dados deste APARELHO para a nuvem (substitui os da nuvem).'
        );
        if (usarNuvem) { writeLocalRaw(cloudData); marcarSincronizado(cloudData._updatedAt); }
        else await push();
      }
    }
    localStorage.setItem(chaveReconciliado, '1');
    // se nenhum lado tem dados, nada a fazer
  }

  function markDirty() {
    if (!enabled || !user) return;
    status = 'syncing'; emit();
    clearTimeout(dirtyTimer);
    dirtyTimer = setTimeout(push, 1500);
  }

  async function push() {
    if (!enabled || !user) return;
    try {
      const snapshot = localSnapshot();
      await db.collection('users').doc(user.uid).set(snapshot, { merge: true });
      marcarSincronizado(snapshot._updatedAt);
      status = 'synced';
    } catch (e) {
      console.error('Envio pra nuvem falhou', e);
      status = 'error';
    }
    emit();
  }

  function loginGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    return auth.signInWithPopup(provider);
  }
  function loginEmail(email, senha) { return auth.signInWithEmailAndPassword(email, senha); }
  function signupEmail(email, senha) { return auth.createUserWithEmailAndPassword(email, senha); }
  function logout() { return auth.signOut(); }

  // ---- Perfil público (para o admin listar usuários) ----
  async function escreverPerfilPublico() {
    try {
      await db.collection('profiles').doc(user.uid).set({
        email: user.email || '', displayName: user.displayName || '', updatedAt: Date.now(),
      }, { merge: true });
    } catch (e) { console.error('Perfil público falhou', e); }
  }

  // ---- Papel de admin (nutricionista/mestre) ----
  async function verificarAdmin() {
    try { const s = await db.collection('admins').doc(user.uid).get(); isAdminFlag = !!(s && s.exists); }
    catch (e) { isAdminFlag = false; }
  }
  function isAdmin() { return isAdminFlag; }
  function uid() { return user ? user.uid : null; }

  // ---- Prescrição de dieta (lado do paciente) ----
  async function aplicarPrescricao() {
    try {
      const s = await db.collection('prescricoes').doc(user.uid).get();
      if (!s || !s.exists) return;
      const d = s.data();
      if (!d || !d.nome) return;
      const dietas = Storage.getAll('dietas_custom');
      const dieta = {
        nome: d.nome, kcal: d.kcal || null, protein: d.protein || null,
        carb: d.carb || null, fat: d.fat || null, fiber: d.fiber || null, fonte: 'nutri',
      };
      const idx = dietas.findIndex(x => (x.nome || '').trim().toLowerCase() === d.nome.trim().toLowerCase());
      if (idx >= 0) { dieta.id = dietas[idx].id; dietas[idx] = dieta; }
      else { dieta.id = Storage.uid(); dietas.push(dieta); }
      localStorage.setItem(Storage.KEYS.dietas_custom, JSON.stringify(dietas));
      // Ativa a dieta prescrita como objetivo atual (o paciente ainda pode trocar depois).
      const perfil = Storage.getPerfil();
      localStorage.setItem('perfil', JSON.stringify({ ...perfil, dietaTemplate: null, metaCustom: null, dietaCustomId: dieta.id }));

      // Plano alimentar (refeições) prescrito → vira combos prontos do paciente.
      if (Array.isArray(d.refeicoes) && d.refeicoes.length) {
        const combos = Storage.getAll('combos');
        d.refeicoes.forEach(ref => {
          if (!ref || !ref.nome) return;
          const combo = { nome: ref.nome, horario: ref.horario || null, itens: ref.itens || [], fonte: 'nutri' };
          const j = combos.findIndex(c => (c.nome || '').trim().toLowerCase() === ref.nome.trim().toLowerCase());
          if (j >= 0) { combo.id = combos[j].id; combos[j] = combo; }
          else { combo.id = Storage.uid(); combos.push(combo); }
        });
        localStorage.setItem(Storage.KEYS.combos, JSON.stringify(combos));
      }
      emit();
    } catch (e) { console.error('Aplicar prescrição falhou', e); }
  }

  // ---- Operações do admin ----
  async function listarUsuarios() {
    const snap = await db.collection('profiles').get();
    const arr = [];
    snap.forEach(doc => arr.push({ uid: doc.id, ...doc.data() }));
    return arr;
  }
  async function dadosUsuario(uidAlvo) {
    const s = await db.collection('users').doc(uidAlvo).get();
    return s && s.exists ? s.data() : null;
  }
  async function prescricaoDe(uidAlvo) {
    const s = await db.collection('prescricoes').doc(uidAlvo).get();
    return s && s.exists ? s.data() : null;
  }
  async function enviarDieta(uidAlvo, dieta) {
    await db.collection('prescricoes').doc(uidAlvo).set(
      { ...dieta, updatedAt: Date.now(), byUid: user.uid }, { merge: true }
    );
  }

  async function enviarPlano(uidAlvo, refeicoes) {
    await db.collection('prescricoes').doc(uidAlvo).set(
      { refeicoes, updatedAt: Date.now(), byUid: user.uid }, { merge: true }
    );
  }

  // ---- Vídeos de exercício: sugestão (usuário) e aprovação (admin) ----
  // Aplica o vídeo no exercício compartilhado (cria/atualiza), tornando-o global.
  async function aplicarVideoCompartilhado(nome, videoUrl) {
    const q = await db.collection('sharedExercises').where('name', '==', nome).limit(1).get();
    if (!q.empty) await q.docs[0].ref.set({ videoUrl }, { merge: true });
    else await db.collection('sharedExercises').add({ name: nome, videoUrl, addedBy: user.uid });
  }

  // Chamado quando um usuário define/edita o vídeo de um exercício.
  // Admin: aplica direto (vale pra todos). Usuário comum: cria uma sugestão para aprovação.
  async function sugerirVideo(nome, videoUrl) {
    if (!enabled || !user || !db || !nome || !videoUrl) return;
    try {
      if (isAdminFlag) await aplicarVideoCompartilhado(nome, videoUrl);
      else await db.collection('pendingVideos').add({
        exercicio: nome, videoUrl, byUid: user.uid, byEmail: user.email || '', createdAt: Date.now(),
      });
    } catch (e) { console.error('Sugerir vídeo falhou', e); }
  }

  async function listarVideosPendentes() {
    const snap = await db.collection('pendingVideos').get();
    const arr = [];
    snap.forEach(doc => arr.push({ id: doc.id, ...doc.data() }));
    return arr;
  }
  async function aprovarVideoPendente(pendingId, nome, videoUrl) {
    await aplicarVideoCompartilhado(nome, videoUrl);
    await db.collection('pendingVideos').doc(pendingId).delete();
  }
  async function rejeitarVideoPendente(pendingId) {
    await db.collection('pendingVideos').doc(pendingId).delete();
  }

  return {
    init, wrapStorage, isEnabled, currentUser, getStatus, onChange,
    loginGoogle, loginEmail, signupEmail, logout, push,
    isAdmin, uid, listarUsuarios, dadosUsuario, prescricaoDe, enviarDieta, enviarPlano,
    sugerirVideo, listarVideosPendentes, aprovarVideoPendente, rejeitarVideoPendente,
  };
})();
