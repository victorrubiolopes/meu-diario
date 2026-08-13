const Storage = (() => {
  const KEYS = {
    treino: 'treino_entries',
    corridas: 'corridas_entries',
    alimentacao: 'alimentacao_entries',
    medidas: 'medidas_entries',
    tarefas: 'tarefas_entries',
    tarefas_conclusoes: 'tarefas_conclusoes',
    fotos_meta: 'fotos_meta',
    alimentos_biblioteca: 'alimentos_biblioteca',
    exercicios_biblioteca: 'exercicios_biblioteca',
    dietas_custom: 'dietas_custom',
    treino_planos: 'treino_planos',
    combos: 'combos_alimentos',
    agua: 'agua_entries',
    gastos: 'gastos_entries',
    exames_meta: 'exames_meta',
    refeicao_fotos: 'refeicao_fotos',
    refeicoes_livres: 'refeicoes_livres',
  };

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function getAll(key) {
    try {
      return JSON.parse(localStorage.getItem(KEYS[key]) || '[]');
    } catch {
      return [];
    }
  }

  function saveAll(key, items) {
    localStorage.setItem(KEYS[key], JSON.stringify(items));
  }

  function getByDate(key, date) {
    return getAll(key).filter(item => item.date === date);
  }

  function add(key, entry) {
    const items = getAll(key);
    entry.id = uid();
    items.push(entry);
    saveAll(key, items);
    return entry;
  }

  function update(key, id, changes) {
    const items = getAll(key);
    const idx = items.findIndex(i => i.id === id);
    if (idx > -1) {
      items[idx] = { ...items[idx], ...changes };
      saveAll(key, items);
    }
  }

  function remove(key, id) {
    saveAll(key, getAll(key).filter(i => i.id !== id));
  }

  // ---- perfil (objeto único) ----
  function getPerfil() {
    try {
      return JSON.parse(localStorage.getItem('perfil') || 'null') || {};
    } catch {
      return {};
    }
  }

  function savePerfil(data) {
    localStorage.setItem('perfil', JSON.stringify(data));
  }

  // ---- config da refeição livre (objeto único, null se nunca configurado) ----
  function getConfigRefeicaoLivre() {
    try {
      return JSON.parse(localStorage.getItem('refeicaoLivre_config') || 'null');
    } catch {
      return null;
    }
  }

  function saveConfigRefeicaoLivre(data) {
    localStorage.setItem('refeicaoLivre_config', JSON.stringify(data));
  }

  // ---- bibliotecas: seed padrão + itens do usuário, mesclados e cacheados ----
  function seedIfEmpty(key, seedData) {
    const current = getAll(key);
    if (current.length === 0) {
      const seeded = seedData.map(item => ({ ...item, id: uid(), custom: false }));
      saveAll(key, seeded);
      return seeded;
    }
    return current;
  }

  // Adiciona itens novos do catálogo padrão que ainda não existem (por nome),
  // sem duplicar nem mexer em itens já salvos/editados pelo usuário.
  function mergeSeeds(key, seedData, nameField = 'name') {
    const current = getAll(key);
    const existingNames = new Set(current.map(i => i[nameField].toLowerCase()));
    const toAdd = seedData.filter(item => !existingNames.has(item[nameField].toLowerCase()));
    if (toAdd.length > 0) {
      const seeded = toAdd.map(item => ({ ...item, id: uid(), custom: false }));
      saveAll(key, [...current, ...seeded]);
    }
    return getAll(key);
  }

  function exportAll() {
    const data = {};
    Object.keys(KEYS).forEach(k => { data[k] = getAll(k); });
    data.perfil = getPerfil();
    data.refeicaoLivre_config = getConfigRefeicaoLivre();
    data._exportedAt = new Date().toISOString();
    return data;
  }

  function importAll(data) {
    Object.keys(KEYS).forEach(k => {
      if (Array.isArray(data[k])) saveAll(k, data[k]);
    });
    if (data.perfil) savePerfil(data.perfil);
    if (data.refeicaoLivre_config) saveConfigRefeicaoLivre(data.refeicaoLivre_config);
  }

  return {
    KEYS, uid, getAll, saveAll, getByDate, add, update, remove,
    getPerfil, savePerfil, getConfigRefeicaoLivre, saveConfigRefeicaoLivre,
    seedIfEmpty, mergeSeeds, exportAll, importAll,
  };
})();
