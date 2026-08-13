// Refeição livre com proteção de ofensiva: libera até N refeições livres por semana
// (sábado e domingo) se a semana de trabalho (segunda a sexta) bateu as regras.
// Regras da semana (seg-sex), cada dia conta só se tiver sido preenchido:
//   - calorias no máximo X% acima da meta (pode ficar abaixo à vontade, sem limite)
//   - refeições obrigatórias registradas (por padrão café da manhã, almoço e jantar)
//   - treino ou corrida registrada
// Regra da semana inteira (seg-dom): água batida em pelo menos Y% dos dias já passados.
// Usar a refeição livre num dia protege esse dia inteiro na ofensiva ("Dias em foco"),
// mesmo que as calorias/treino/água daquele dia não tenham sido batidos.
// Todos os X/Y/N acima (e quais refeições são obrigatórias) são editáveis pelo usuário
// em Mais → Refeição Livre — getConfig() sempre mescla o que foi salvo com os padrões.
const RefeicaoLivre = (() => {
  const CAMPO = 'refeicoes_livres';

  // Mesmas 5 opções de MEAL_TYPES em views/alimentacao.js (duplicado aqui de propósito:
  // esse módulo carrega antes de alimentacao.js e não depende dele).
  const TODAS_REFEICOES = ['Café da manhã', 'Almoço', 'Lanche', 'Jantar', 'Outro'];

  const CONFIG_PADRAO = {
    toleranciaMaxPct: 5,
    refeicoesObrigatorias: ['Café da manhã', 'Almoço', 'Jantar'],
    aguaPercentMin: 80,
    maxUsosSemana: 2,
  };

  function getConfig() {
    const salvo = Storage.getConfigRefeicaoLivre();
    return { ...CONFIG_PADRAO, ...salvo };
  }

  function saveConfig(cfg) {
    Storage.saveConfigRefeicaoLivre(cfg);
  }

  function semanaDe(dateISO) {
    const seg = Util.mondayOf(dateISO);
    const dias = Array.from({ length: 7 }, (_, i) => Util.addDaysISO(seg, i));
    return { seg, dias, diasUteis: dias.slice(0, 5), sab: dias[5], dom: dias[6] };
  }

  function usadasNaSemana(dateISO) {
    const { dias } = semanaDe(dateISO);
    return Storage.getAll(CAMPO).filter(u => dias.includes(u.date));
  }

  function protegida(dateISO) {
    return Storage.getAll(CAMPO).some(u => u.date === dateISO);
  }

  function elegibilidade(dateISO, meta, aguaMeta) {
    const cfg = getConfig();
    const { dias, diasUteis, sab, dom } = semanaDe(dateISO);
    const hojeISO = Util.todayISO();

    const treinoDatas = new Set(Storage.getAll('treino').map(t => t.date));
    const corridaDatas = new Set(Storage.getAll('corridas').map(c => c.date));
    const kcalPorData = {};
    const refeicoesPorData = {};
    Storage.getAll('alimentacao').forEach(e => {
      kcalPorData[e.date] = (kcalPorData[e.date] || 0) + (e.kcal || 0);
      if (!refeicoesPorData[e.date]) refeicoesPorData[e.date] = new Set();
      refeicoesPorData[e.date].add(e.mealType);
    });
    const aguaPorData = {};
    Storage.getAll('agua').forEach(a => { aguaPorData[a.date] = (aguaPorData[a.date] || 0) + (a.ml || 0); });

    const detalheDias = diasUteis.map(d => {
      if (d > hojeISO) return { date: d, futuro: true, preenchido: false, exercicioOk: false, caloriasOk: false, refeicoesOk: false, ok: false };
      const kcalDia = kcalPorData[d] || 0;
      const preenchido = kcalDia > 0;
      const max = meta ? meta.kcal * (1 + cfg.toleranciaMaxPct / 100) : null;
      const caloriasOk = !!meta && preenchido && kcalDia <= max;
      const exercicioOk = treinoDatas.has(d) || corridaDatas.has(d);
      const refeicoesDoDia = refeicoesPorData[d] || new Set();
      const refeicoesOk = cfg.refeicoesObrigatorias.every(r => refeicoesDoDia.has(r));
      return { date: d, futuro: false, preenchido, exercicioOk, caloriasOk, refeicoesOk, ok: exercicioOk && caloriasOk && refeicoesOk };
    });
    const diasUteisOk = detalheDias.every(d => d.ok);

    const diasPassados7 = dias.filter(d => d <= hojeISO);
    const diasAguaOk = diasPassados7.filter(d => !!aguaMeta && (aguaPorData[d] || 0) >= aguaMeta).length;
    const necessarios = Math.ceil(diasPassados7.length * (cfg.aguaPercentMin / 100));
    const aguaOk = diasPassados7.length > 0 && diasAguaOk >= necessarios;

    const elegivel = diasUteisOk && aguaOk;
    const ehFimDeSemana = dateISO === sab || dateISO === dom;
    const usos = usadasNaSemana(dateISO);
    const podeUsarHoje = elegivel && ehFimDeSemana && !protegida(dateISO) && usos.length < cfg.maxUsosSemana;

    return {
      elegivel, ehFimDeSemana, podeUsarHoje,
      usosNaSemana: usos.length, restantes: Math.max(0, cfg.maxUsosSemana - usos.length),
      detalheDias, aguaOk, diasAguaOk, diasAguaNecessarios: necessarios, diasAguaContados: diasPassados7.length,
    };
  }

  function usar(dateISO) {
    if (protegida(dateISO)) return false;
    Storage.add(CAMPO, { date: dateISO });
    return true;
  }

  return {
    semanaDe, elegibilidade, usar, protegida, usadasNaSemana,
    getConfig, saveConfig, CONFIG_PADRAO, TODAS_REFEICOES,
  };
})();
