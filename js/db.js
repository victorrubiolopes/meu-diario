const PhotoDB = (() => {
  const DB_NAME = 'diario_fotos_db';
  const STORE = 'fotos';
  let dbPromise = null;

  function open() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        req.result.createObjectStore(STORE, { keyPath: 'id' });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbPromise;
  }

  async function addPhoto(record) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(record);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async function getPhoto(id) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function deletePhoto(id) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // Todas as imagens guardadas — fotos de progresso E arquivos de exame, que dividem o
  // mesmo store. Existe só pro backup: nenhuma tela precisa de todas as fotos de uma vez,
  // e carregar isso à toa enche a memória (cada dataURL tem megabytes).
  async function allPhotos() {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  // Quanto o backup com fotos vai pesar, sem montar o arquivo. O dataURL já é base64, e
  // base64 é ASCII, então o comprimento da string é o tamanho em bytes no JSON final.
  async function totalBytes() {
    const fotos = await allPhotos();
    return fotos.reduce((n, f) => n + ((f && f.dataURL && f.dataURL.length) || 0), 0);
  }

  // Restauração: grava tudo numa transação só. Usa put, então reimportar o mesmo backup
  // duas vezes não duplica nada — a foto com o mesmo id é sobrescrita por ela mesma.
  async function putMany(records) {
    const lista = (records || []).filter(r => r && r.id);
    if (!lista.length) return 0;
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      lista.forEach(r => store.put(r));
      tx.oncomplete = () => resolve(lista.length);
      tx.onerror = () => reject(tx.error);
    });
  }

  return { addPhoto, getPhoto, deletePhoto, allPhotos, totalBytes, putMany };
})();
