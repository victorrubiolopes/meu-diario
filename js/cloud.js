// Camada opcional de nuvem: login (Google / e-mail) e sincronização dos dados no Firestore.
// Design "local-first": o app continua usando localStorage normalmente; quando há login,
// os dados são baixados na entrada e enviados (debounce) a cada alteração.
// Se o Firebase não estiver configurado ou o SDK não carregar, tudo vira no-op e o app roda local.
const Cloud = (() => {
  // Chaves do Storage que sincronizam no doc pessoal. Fotos (IndexedDB) ficam de fora nesta fase.
  // alimentos_biblioteca e exercicios_biblioteca NÃO entram aqui: itens padrão vêm do
  // mergeSeeds (código, não precisa de rede) e itens custom já sincronizam item-a-item via
  // criarCompartilhado (compAlimentos/compExercicios) mais abaixo. Incluir essas duas listas
  // aqui mandava a biblioteca inteira (centenas de itens) de novo a cada push — é o que
  // deixava a sincronização lenta, principalmente depois que a biblioteca de alimentos cresceu.
  const SYNC_KEYS = [
    'treino', 'corridas', 'alimentacao', 'medidas', 'tarefas', 'tarefas_conclusoes',
    'dietas_custom', 'treino_planos', 'corrida_planos', 'combos', 'agua', 'gastos', 'refeicao_fotos', 'refeicoes_livres',
    'notificacoes',
  ];

  let enabled = false;
  let auth = null;
  let db = null;
  let user = null;
  let dirtyTimer = null;
  let status = 'local'; // 'local' | 'syncing' | 'synced' | 'error'
  let isAdminFlag = false;
  let isSuperFlag = false; // dono do app: vê pacientes de todas as nutris
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
          isSuperFlag = false;
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
  // Escreve email/nome em todo login. Na CRIAÇÃO do doc (primeiro login de verdade),
  // resolve um eventual código de convite (?convite=CODE na URL, guardado pelo app.js
  // antes do login) e grava nutriId — depois disso o campo fica imutável pro paciente
  // (travado nas regras do Firestore).
  async function escreverPerfilPublico() {
    try {
      const ref = db.collection('profiles').doc(user.uid);
      const payload = { email: user.email || '', displayName: user.displayName || '', updatedAt: Date.now() };
      const snap = await ref.get();
      if (!snap.exists) {
        // Código guardado em localStorage (sobrevive ao redirect do login Google no celular).
        const code = localStorage.getItem('pendingInviteCode') || sessionStorage.getItem('pendingInviteCode');
        if (code) {
          try {
            const inv = await db.collection('inviteCodes').doc(code).get();
            if (inv.exists && inv.data().ativo) payload.nutriId = inv.data().nutriUid;
          } catch (e) { /* código inválido ou sem permissão — segue sem nutriId */ }
        }
        localStorage.removeItem('pendingInviteCode');
        sessionStorage.removeItem('pendingInviteCode');
      }
      await ref.set(payload, { merge: true });
    } catch (e) { console.error('Perfil público falhou', e); }
  }

  // ---- Papel de admin (nutricionista/mestre) ----
  // super = true é o dono do app (vê todos os pacientes de todas as nutris);
  // nutri comum só vê quem convidou (via nutriId em profiles/{uid}).
  async function verificarAdmin() {
    try {
      const s = await db.collection('admins').doc(user.uid).get();
      isAdminFlag = !!(s && s.exists);
      isSuperFlag = isAdminFlag && !!(s.data() || {}).super;
    } catch (e) { isAdminFlag = false; isSuperFlag = false; }
  }
  function isAdmin() { return isAdminFlag; }
  function isSuperAdmin() { return isSuperFlag; }
  function uid() { return user ? user.uid : null; }

  // ---- Convite de nutri: gera (ou reaproveita) um link que vincula o paciente a ela ----
  async function gerarConviteLink() {
    const existente = await db.collection('inviteCodes')
      .where('nutriUid', '==', user.uid).where('ativo', '==', true).limit(1).get();
    let code;
    if (!existente.empty) {
      code = existente.docs[0].id;
    } else {
      code = Storage.uid();
      await db.collection('inviteCodes').doc(code).set({ nutriUid: user.uid, criadoEm: Date.now(), ativo: true });
    }
    return `${location.origin}${location.pathname}?convite=${code}`;
  }

  // ---- Prescrição de dieta (lado do paciente) ----
  // Cada bloco (dieta/refeições/treino/lista de compras) é aplicado de forma independente —
  // a nutri pode mandar só uma lista de compras, por exemplo, sem nunca ter enviado dieta.
  const TITULOS_SOLICITACAO = {
    medidas: 'Seu profissional pediu novas medidas',
    peso: 'Seu profissional pediu uma pesagem',
    fotos: 'Seu profissional pediu fotos de progresso',
    exames: 'Seu profissional pediu seus exames',
    outro: 'Recado do seu profissional',
  };
  function tituloSolicitacao(tipo) {
    return TITULOS_SOLICITACAO[tipo] || TITULOS_SOLICITACAO.outro;
  }

  async function aplicarPrescricao() {
    try {
      const s = await db.collection('prescricoes').doc(user.uid).get();
      if (!s || !s.exists) return;
      const d = s.data();
      if (!d) return;
      let mudou = false;

      // Notificações: aplicarPrescricao roda a cada login, e o upsert por nome é idempotente —
      // então "aplicou" não significa "é novo". Pra não renotificar a mesma dieta toda vez que
      // o app abre, cada bloco tem seu próprio carimbo no documento e a gente guarda o último
      // já visto. Só vira notificação quando o carimbo do servidor é mais recente que o local.
      const vistos = JSON.parse(localStorage.getItem('prescricao_vistos') || '{}');
      const novosVistos = { ...vistos };
      const primeiraSync = Object.keys(vistos).length === 0;
      // Aparelho novo (ou navegador limpo) não tem histórico do que já foi visto. Silenciar
      // tudo nesse caso é fácil e errado: um login novo perderia uma dieta enviada minutos
      // atrás. O critério é a idade do conteúdo — avisa do que é recente, e do que é antigo
      // só marca como visto, porque o paciente já conhece.
      const JANELA_AVISO_MS = 3 * 24 * 60 * 60 * 1000;
      function avisar(chave, carimbo, tipo, titulo, texto, extra) {
        if (!carimbo || carimbo <= (vistos[chave] || 0)) return false;
        novosVistos[chave] = carimbo;
        if (primeiraSync && (Date.now() - carimbo) > JANELA_AVISO_MS) return false;
        Storage.add('notificacoes', { tipo, titulo, texto: texto || '', criadoEm: carimbo, lida: false, ...(extra || {}) });
        return true;
      }

      if (d.nome) {
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
        mudou = true;
      }

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
        mudou = true;
      }

      // Planos de treino prescritos (A/B/C) → viram planos locais do paciente, mesmo
      // padrão de upsert-por-nome usado acima pras refeições/combos.
      if (Array.isArray(d.planosTreino) && d.planosTreino.length) {
        const planosLocais = Storage.getAll('treino_planos');
        const maxOrdem = planosLocais.reduce((m, p) => Math.max(m, p.ordem || 0), 0);
        d.planosTreino.forEach((tp, i) => {
          if (!tp || !tp.nome) return;
          const plano = { nome: tp.nome, exercises: (tp.exercises || []).map(e => ({ ...e })), fonte: 'nutri' };
          const j = planosLocais.findIndex(x => (x.nome || '').trim().toLowerCase() === tp.nome.trim().toLowerCase());
          if (j >= 0) { plano.id = planosLocais[j].id; plano.ordem = planosLocais[j].ordem; planosLocais[j] = plano; }
          else { plano.id = Storage.uid(); plano.ordem = maxOrdem + i + 1; planosLocais.push(plano); }
          // Sem isso, os exercícios do plano prescrito ficam sem grupo/ilustração pro paciente,
          // já que só existiam dentro do plano enviado, nunca na biblioteca dele.
          if (typeof garantirExercicioNaBiblioteca === 'function') {
            plano.exercises.forEach(e => garantirExercicioNaBiblioteca(e.name));
          }
        });
        localStorage.setItem(Storage.KEYS.treino_planos, JSON.stringify(planosLocais));
        mudou = true;
      }

      // Planos de corrida prescritos — mesmo upsert-por-nome dos planos de musculação, mas
      // em chave própria: corrida não tem série/carga, e sim distância/tempo/protocolo.
      if (Array.isArray(d.planosCorrida) && d.planosCorrida.length) {
        const corridaLocais = Storage.getAll('corrida_planos');
        const maxOrdem = corridaLocais.reduce((m, p) => Math.max(m, p.ordem || 0), 0);
        d.planosCorrida.forEach((cp, i) => {
          if (!cp || !cp.nome) return;
          const plano = {
            nome: cp.nome,
            tipo: cp.tipo || '',
            distanceKm: cp.distanceKm != null ? cp.distanceKm : null,
            timeMin: cp.timeMin != null ? cp.timeMin : null,
            descricao: cp.descricao || '',
            fonte: 'nutri',
          };
          const j = corridaLocais.findIndex(x => (x.nome || '').trim().toLowerCase() === cp.nome.trim().toLowerCase());
          if (j >= 0) { plano.id = corridaLocais[j].id; plano.ordem = corridaLocais[j].ordem; corridaLocais[j] = plano; }
          else { plano.id = Storage.uid(); plano.ordem = maxOrdem + i + 1; corridaLocais.push(plano); }
        });
        localStorage.setItem(Storage.KEYS.corrida_planos, JSON.stringify(corridaLocais));
        mudou = true;
      }

      // Lista de compras (texto livre escrito pela nutri) → fica salva pro paciente ver.
      if (d.listaCompras) {
        localStorage.setItem('lista_compras', JSON.stringify({ texto: d.listaCompras, updatedAt: d.listaComprasUpdatedAt || d.updatedAt || Date.now() }));
        mudou = true;
      }

      // Regras de refeição livre prescritas pela nutri → substituem a config local do
      // paciente (ele ainda pode ajustar depois em Mais → Refeição Livre).
      if (d.refeicaoLivreConfig) {
        localStorage.setItem('refeicaoLivre_config', JSON.stringify(d.refeicaoLivreConfig));
        mudou = true;
      }

      // Um aviso por tipo de conteúdo, só quando o carimbo daquele bloco avançou.
      const avisos = [
        ['dieta', d.dietaUpdatedAt, 'dieta', 'Nova dieta recebida', d.nome ? `Meta: ${d.nome}` : ''],
        ['refeicoes', d.refeicoesUpdatedAt, 'plano', 'Novo plano alimentar recebido',
          Array.isArray(d.refeicoes) ? `${d.refeicoes.length} refeição(ões) — veja em Comida → Combos salvos` : ''],
        ['planosTreino', d.planosTreinoUpdatedAt, 'treino', 'Novo plano de treino recebido',
          Array.isArray(d.planosTreino) ? `${d.planosTreino.length} treino(s) — veja em Treino` : ''],
        ['planosCorrida', d.planosCorridaUpdatedAt, 'corrida', 'Novos treinos de corrida recebidos',
          Array.isArray(d.planosCorrida) ? `${d.planosCorrida.length} treino(s) — veja em Treino → Corrida` : ''],
        ['listaCompras', d.listaComprasUpdatedAt, 'lista', 'Nova lista de compras', 'Veja na aba Comida'],
        ['refeicaoLivre', d.refeicaoLivreUpdatedAt, 'refeicaoLivre', 'Regras da refeição livre atualizadas', 'Veja em Mais → Refeição Livre'],
      ];
      avisos.forEach(([chave, carimbo, tipo, titulo, texto]) => {
        if (avisar(chave, carimbo, tipo, titulo, texto)) mudou = true;
      });

      // Pedidos do profissional (atualizar medidas, mandar foto...). Cada um vira uma
      // notificação própria, identificada pelo id — assim vários pedidos convivem e um
      // pedido antigo não reaparece quando chega um novo.
      if (Array.isArray(d.solicitacoes)) {
        d.solicitacoes.forEach(sol => {
          if (!sol || !sol.id) return;
          if (avisar(`solicitacao:${sol.id}`, sol.criadoEm, 'solicitacao', tituloSolicitacao(sol.tipo), sol.texto, { tipoSolicitacao: sol.tipo })) mudou = true;
        });
      }
      localStorage.setItem('prescricao_vistos', JSON.stringify(novosVistos));

      if (mudou) emit();
    } catch (e) { console.error('Aplicar prescrição falhou', e); }
  }

  // ---- Operações do admin ----
  // Super-admin (dono do app) vê todo mundo; nutri comum só vê quem ela convidou.
  async function listarUsuarios() {
    const query = isSuperFlag ? db.collection('profiles') : db.collection('profiles').where('nutriId', '==', user.uid);
    const snap = await query.get();
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
      { ...dieta, dietaUpdatedAt: Date.now(), updatedAt: Date.now(), byUid: user.uid }, { merge: true }
    );
  }

  async function enviarPlano(uidAlvo, refeicoes) {
    await db.collection('prescricoes').doc(uidAlvo).set(
      { refeicoes, refeicoesUpdatedAt: Date.now(), updatedAt: Date.now(), byUid: user.uid }, { merge: true }
    );
  }

  async function enviarListaCompras(uidAlvo, texto) {
    await db.collection('prescricoes').doc(uidAlvo).set(
      { listaCompras: texto, listaComprasUpdatedAt: Date.now(), updatedAt: Date.now(), byUid: user.uid }, { merge: true }
    );
  }

  async function enviarTreino(uidAlvo, planosTreino) {
    await db.collection('prescricoes').doc(uidAlvo).set(
      { planosTreino, planosTreinoUpdatedAt: Date.now(), updatedAt: Date.now(), byUid: user.uid }, { merge: true }
    );
  }

  async function enviarCorrida(uidAlvo, planosCorrida) {
    await db.collection('prescricoes').doc(uidAlvo).set(
      { planosCorrida, planosCorridaUpdatedAt: Date.now(), updatedAt: Date.now(), byUid: user.uid }, { merge: true }
    );
  }

  async function enviarRegrasRefeicaoLivre(uidAlvo, config) {
    await db.collection('prescricoes').doc(uidAlvo).set(
      { refeicaoLivreConfig: config, refeicaoLivreUpdatedAt: Date.now(), updatedAt: Date.now(), byUid: user.uid }, { merge: true }
    );
  }

  // ---- Pedido do profissional ao paciente ----
  // Até aqui o painel só empurrava conteúdo (dieta, treino, lista). Isto é o inverso: pedir
  // algo de volta — atualizar medidas, mandar fotos, marcar o peso. Vai como lista pra o
  // paciente poder ter mais de um pedido em aberto; o app dele vira cada um em notificação.
  async function enviarSolicitacao(uidAlvo, tipo, texto) {
    const doc = db.collection('prescricoes').doc(uidAlvo);
    const s = await doc.get();
    const atuais = (s.exists && Array.isArray(s.data().solicitacoes)) ? s.data().solicitacoes : [];
    const nova = { id: Storage.uid(), tipo, texto: texto || '', criadoEm: Date.now(), byUid: user.uid };
    await doc.set(
      { solicitacoes: atuais.concat([nova]), solicitacoesUpdatedAt: Date.now(), updatedAt: Date.now(), byUid: user.uid },
      { merge: true }
    );
    return nova;
  }

  // ---- Reatribuição de paciente a uma nutri (só super-admin, permitido nas regras) ----
  async function listarNutris() {
    const snap = await db.collection('admins').get();
    const nutris = [];
    snap.forEach(d => nutris.push({ uid: d.id, ...d.data() }));
    // Enriquece com email/nome do perfil, quando existir.
    for (const n of nutris) {
      try {
        const p = await db.collection('profiles').doc(n.uid).get();
        if (p && p.exists) { n.email = p.data().email || n.email; n.displayName = p.data().displayName || n.nome || n.displayName; }
      } catch (e) { /* segue sem enriquecer */ }
    }
    return nutris;
  }
  async function reatribuirPaciente(uidAlvo, nutriUid) {
    await db.collection('profiles').doc(uidAlvo).set(
      { nutriId: nutriUid, updatedAt: Date.now() }, { merge: true }
    );
  }

  // ---- Promover / remover profissional (só super-admin) ----
  // O papel de nutri é a EXISTÊNCIA do documento admins/{uid}: não há campo de papel,
  // quem tem documento é profissional. Até aqui esse documento só nascia pelo Console do
  // Firebase, então cadastrar uma nutri exigia sair do app. As regras (firestore.rules)
  // é que barram de verdade — o super não mexe no próprio documento, não cria outro
  // super e não altera quem já é super. A UI esconde os mesmos casos, mas por educação:
  // quem manda é a regra.
  async function papelDe(uidAlvo) {
    const s = await db.collection('admins').doc(uidAlvo).get();
    if (!s || !s.exists) return { nutri: false, super: false };
    return { nutri: true, super: !!(s.data() || {}).super };
  }
  // Sem 'super' no payload de propósito: a regra recusa a escrita se o campo vier true,
  // e omitir deixa explícito que este caminho nunca cria dono de app.
  async function promoverNutri(uidAlvo, perfil) {
    const p = perfil || {};
    await db.collection('admins').doc(uidAlvo).set({
      nome: p.displayName || '',
      email: p.email || '',
      criadoEm: Date.now(),
      criadoPor: user.uid,
    });
  }
  async function removerNutri(uidAlvo) {
    await db.collection('admins').doc(uidAlvo).delete();
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

  // ---- Receitas: o paciente só escreve nome + ingredientes em texto livre (não calcula
  // nada). Vai sempre pra uma fila de revisão — quem monta a conta de verdade (ingrediente
  // por ingrediente + peso final) e decide o que entra na biblioteca é o admin/nutri.
  async function aplicarAlimentoCompartilhado(entry) {
    const q = await db.collection('sharedFoods').where('name', '==', entry.name).limit(1).get();
    if (!q.empty) await q.docs[0].ref.set(entry, { merge: true });
    else await db.collection('sharedFoods').add({ ...entry, addedBy: user.uid });
  }

  async function sugerirReceita(nomeReceita, ingredientesTexto) {
    if (!enabled || !user || !db || !nomeReceita) return;
    try {
      await db.collection('pendingRecipes').add({
        nomeReceita, ingredientesTexto: ingredientesTexto || '', byUid: user.uid, byEmail: user.email || '', createdAt: Date.now(),
      });
    } catch (e) { console.error('Sugerir receita falhou', e); }
  }

  async function listarReceitasPendentes() {
    const snap = await db.collection('pendingRecipes').get();
    const arr = [];
    snap.forEach(doc => arr.push({ id: doc.id, ...doc.data() }));
    return arr;
  }
  async function aprovarReceitaPendente(pendingId, entry) {
    await aplicarAlimentoCompartilhado(entry);
    await db.collection('pendingRecipes').doc(pendingId).delete();
  }
  async function rejeitarReceitaPendente(pendingId) {
    await db.collection('pendingRecipes').doc(pendingId).delete();
  }

  return {
    init, wrapStorage, isEnabled, currentUser, getStatus, onChange,
    loginGoogle, loginEmail, signupEmail, logout, push,
    isAdmin, isSuperAdmin, uid, listarUsuarios, dadosUsuario, prescricaoDe, enviarDieta, enviarPlano, enviarTreino, enviarCorrida, enviarListaCompras, enviarSolicitacao, enviarRegrasRefeicaoLivre,
    gerarConviteLink, listarNutris, reatribuirPaciente, papelDe, promoverNutri, removerNutri,
    sugerirVideo, listarVideosPendentes, aprovarVideoPendente, rejeitarVideoPendente,
    sugerirReceita, listarReceitasPendentes, aprovarReceitaPendente, rejeitarReceitaPendente,
  };
})();
