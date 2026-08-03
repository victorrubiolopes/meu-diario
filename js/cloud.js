// Camada opcional de nuvem: login (Google / e-mail) e sincronização dos dados no Firestore.
// Design "local-first": o app continua usando localStorage normalmente; quando há login,
// os dados são baixados na entrada e enviados (debounce) a cada alteração.
// Se o Firebase não estiver configurado ou o SDK não carregar, tudo vira no-op e o app roda local.
const Cloud = (() => {
  // Chaves do Storage que sincronizam. Fotos (IndexedDB) ficam de fora nesta fase.
  const SYNC_KEYS = [
    'treino', 'corridas', 'alimentacao', 'medidas', 'tarefas', 'tarefas_conclusoes',
    'alimentos_biblioteca', 'exercicios_biblioteca', 'dietas_custom', 'treino_planos',
    'combos', 'agua', 'gastos',
  ];

  let enabled = false;
  let auth = null;
  let db = null;
  let user = null;
  let dirtyTimer = null;
  let status = 'local'; // 'local' | 'syncing' | 'synced' | 'error'
  const listeners = [];

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
  }

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
        } else {
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

  async function onLogin() {
    const ref = db.collection('users').doc(user.uid);
    const snap = await ref.get();
    const cloudData = snap.exists ? snap.data() : null;
    const cloudHas = !!cloudData && SYNC_KEYS.some(k => Array.isArray(cloudData[k]) && cloudData[k].length > 0);
    const localHas = localHasData();

    if (cloudHas && !localHas) {
      writeLocalRaw(cloudData);
    } else if (!cloudHas && localHas) {
      await push();
    } else if (cloudHas && localHas) {
      const usarNuvem = window.confirm(
        'Encontramos dados na sua conta na nuvem e também neste aparelho.\n\n' +
        'OK = usar os dados da NUVEM (substitui os deste aparelho).\n' +
        'Cancelar = enviar os dados deste APARELHO para a nuvem (substitui os da nuvem).'
      );
      if (usarNuvem) writeLocalRaw(cloudData);
      else await push();
    }
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
      await db.collection('users').doc(user.uid).set(localSnapshot(), { merge: true });
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

  return {
    init, wrapStorage, isEnabled, currentUser, getStatus, onChange,
    loginGoogle, loginEmail, signupEmail, logout, push,
  };
})();
