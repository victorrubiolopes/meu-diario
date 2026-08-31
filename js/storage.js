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
    corrida_planos: 'corrida_planos',
    notificacoes: 'notificacoes',
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

  // Carimba `_upd` em quem mudou de conteúdo desde o que está gravado.
  //
  // Existe porque nem toda escrita passa por add/update: várias telas montam a lista nova
  // na mão e chamam saveAll direto (marcar notificação como lida, concluir tarefa, lançar
  // exame, recarregar os combos da meta). Sem carimbo, esses registros empatam em `_upd`
  // entre dois aparelhos, a mesclagem devolve o empate pro lado local, e a edição feita no
  // outro aparelho é desfeita silenciosamente na sincronização seguinte — a mesma perda
  // que a mesclagem foi feita pra impedir, só que mais estreita.
  //
  // Carimbar aqui, e não em cada chamada, é o que faz valer também pra tela que ainda não
  // foi escrita.
  function carimbarAlterados(key, items) {
    if (!Array.isArray(items)) return items;
    let anteriores;
    try {
      anteriores = new Map(
        (JSON.parse(localStorage.getItem(KEYS[key]) || '[]') || [])
          .filter(i => i && i.id)
          .map(i => [i.id, semCarimbo(i)])
      );
    } catch {
      anteriores = new Map();
    }
    const agora = Date.now();
    return items.map(i => {
      if (!i || typeof i !== 'object') return i;
      const antes = i.id ? anteriores.get(i.id) : undefined;
      if (antes !== undefined && antes === semCarimbo(i) && i._upd) return i;
      return { ...i, _upd: agora };
    });
  }

  function semCarimbo(item) {
    const { _upd, ...resto } = item;
    return JSON.stringify(resto);
  }

  function saveAll(key, items) {
    localStorage.setItem(KEYS[key], JSON.stringify(carimbarAlterados(key, items)));
  }

  function getByDate(key, date) {
    return getAll(key).filter(item => item.date === date);
  }

  // `_upd` é o carimbo de quando este registro mudou pela última vez. Existe pra
  // sincronização conseguir mesclar dois aparelhos registro a registro: sem ele, o
  // desempate entre a cópia local e a da nuvem só podia ser "um sobrescreve o outro
  // por inteiro" — que foi o que apagou um café da manhã em 31/08/2026.
  function add(key, entry) {
    const items = getAll(key);
    entry.id = uid();
    entry._upd = Date.now();
    items.push(entry);
    saveAll(key, items);
    return entry;
  }

  function update(key, id, changes) {
    const items = getAll(key);
    const idx = items.findIndex(i => i.id === id);
    if (idx > -1) {
      items[idx] = { ...items[idx], ...changes, _upd: Date.now() };
      saveAll(key, items);
    }
  }

  function remove(key, id) {
    // A lápide entra ANTES do saveAll: o saveAll é quem dispara a sincronização
    // (Cloud.wrapStorage), e ela precisa encontrar a exclusão já registrada. Sem isso o
    // item apagado num aparelho voltaria à vida na próxima mesclagem vinda do outro.
    registrarApagado(key, id);
    saveAll(key, getAll(key).filter(i => i.id !== id));
  }

  // ---- Lápides de exclusão ----
  // Guardadas por 90 dias: tempo de sobra pra qualquer aparelho parado voltar e aprender
  // que o registro morreu, sem deixar a lista crescer pra sempre.
  const APAGADOS_KEY = 'registros_apagados';
  const APAGADOS_TTL_MS = 90 * 24 * 60 * 60 * 1000;

  function apagados() {
    try {
      const lista = JSON.parse(localStorage.getItem(APAGADOS_KEY) || '[]');
      return Array.isArray(lista) ? lista : [];
    } catch {
      return [];
    }
  }

  function salvarApagados(lista) {
    const limite = Date.now() - APAGADOS_TTL_MS;
    localStorage.setItem(APAGADOS_KEY, JSON.stringify(lista.filter(t => t && t.ts > limite)));
  }

  function registrarApagado(key, id) {
    if (!id) return;
    const lista = apagados();
    if (!lista.some(t => t.id === id)) lista.push({ key, id, ts: Date.now() });
    salvarApagados(lista);
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
    localStorage.setItem('perfil', JSON.stringify({ ...data, _upd: Date.now() }));
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

  // ---- lista de compras (objeto único {texto, updatedAt}, escrita pela nutri via Cloud) ----
  function getListaCompras() {
    try {
      return JSON.parse(localStorage.getItem('lista_compras') || 'null');
    } catch {
      return null;
    }
  }

  function saveListaCompras(data) {
    localStorage.setItem('lista_compras', JSON.stringify(data));
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
    // Filtra contra o MESMO Set que vai crescendo: se o próprio catálogo semente tiver dois
    // itens com o mesmo nome (já aconteceu com "Tilápia grelhada"), sem isso os dois entravam,
    // porque o Set era montado só com o que já existia antes.
    const toAdd = seedData.filter(item => {
      const nome = item[nameField].toLowerCase();
      if (existingNames.has(nome)) return false;
      existingNames.add(nome);
      return true;
    });
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
    data.lista_compras = getListaCompras();
    data._exportedAt = new Date().toISOString();
    return data;
  }

  function importAll(data) {
    salvarCopiaSeguranca('antes de importar um backup');
    Object.keys(KEYS).forEach(k => {
      if (Array.isArray(data[k])) saveAll(k, data[k]);
    });
    if (data.perfil) savePerfil(data.perfil);
    if (data.refeicaoLivre_config) saveConfigRefeicaoLivre(data.refeicaoLivre_config);
    if (data.lista_compras) saveListaCompras(data.lista_compras);
  }

  // ---- Cópias de segurança locais ----
  // Rede contra perda de dados: antes de QUALQUER escrita que substitua o diário inteiro
  // (sincronização trazendo a nuvem, importação de backup), o estado anterior é guardado
  // aqui. Existe porque em 31/08/2026 abrir o app no computador sobrescreveu a nuvem com
  // uma cópia velha e apagou o café da manhã registrado no celular — e não havia de onde
  // voltar. Ficam as 3 últimas; a mais velha sai quando entra uma nova.
  const SEG_KEY = 'copias_seguranca';
  const SEG_MAX = 3;

  function copiasSeguranca() {
    try {
      const lista = JSON.parse(localStorage.getItem(SEG_KEY) || '[]');
      return Array.isArray(lista) ? lista : [];
    } catch {
      return [];
    }
  }

  function resumoCopia(dados) {
    return Object.keys(KEYS).reduce((n, k) => n + (Array.isArray(dados[k]) ? dados[k].length : 0), 0);
  }

  function salvarCopiaSeguranca(motivo) {
    try {
      const dados = exportAll();
      // Não guarda cópia de um diário vazio: sobrescreveria uma cópia boa por uma inútil
      // justamente no cenário que mais importa (aparelho novo ou dados já perdidos).
      if (resumoCopia(dados) === 0) return null;
      const copia = { id: uid(), em: Date.now(), motivo: motivo || 'automática', registros: resumoCopia(dados), dados };
      let lista = [copia, ...copiasSeguranca()].slice(0, SEG_MAX);
      // localStorage tem cota: se não couber, vai jogando a mais velha fora até caber.
      for (;;) {
        try {
          localStorage.setItem(SEG_KEY, JSON.stringify(lista));
          return copia;
        } catch (e) {
          if (lista.length <= 1) { console.warn('Sem espaço pra cópia de segurança', e); return null; }
          lista = lista.slice(0, lista.length - 1);
        }
      }
    } catch (e) {
      // Uma cópia de segurança que falha nunca pode derrubar a operação que ela protege.
      console.warn('Cópia de segurança falhou', e);
      return null;
    }
  }

  function restaurarCopiaSeguranca(id) {
    const copia = copiasSeguranca().find(c => c.id === id);
    if (!copia) return false;
    // Guarda o estado atual antes de restaurar — restaurar a cópia errada também é perda.
    salvarCopiaSeguranca('antes de restaurar uma cópia');
    Object.keys(KEYS).forEach(k => {
      if (Array.isArray(copia.dados[k])) saveAll(k, copia.dados[k]);
    });
    if (copia.dados.perfil) savePerfil(copia.dados.perfil);
    if (copia.dados.refeicaoLivre_config) saveConfigRefeicaoLivre(copia.dados.refeicaoLivre_config);
    if (copia.dados.lista_compras) saveListaCompras(copia.dados.lista_compras);
    return true;
  }

  return {
    KEYS, uid, getAll, saveAll, getByDate, add, update, remove,
    getPerfil, savePerfil, getConfigRefeicaoLivre, saveConfigRefeicaoLivre, getListaCompras, saveListaCompras,
    seedIfEmpty, mergeSeeds, exportAll, importAll,
    apagados, registrarApagado, salvarApagados,
    copiasSeguranca, salvarCopiaSeguranca, restaurarCopiaSeguranca,
  };
})();
