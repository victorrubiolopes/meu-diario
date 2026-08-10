// Refeição livre com proteção de ofensiva: libera até 2 refeições livres por semana
// (sábado e domingo) se a semana de trabalho (segunda a sexta) bateu as regras.
// Regras da semana (seg-sex), cada dia conta só se tiver sido preenchido:
//   - calorias dentro de ±10% da meta
//   - treino ou corrida registrada
// Regra da semana inteira (seg-dom): água batida em pelo menos 80% dos dias já passados.
// Usar a refeição livre num dia protege esse dia inteiro na ofensiva ("Dias em foco"),
// mesmo que as calorias/treino/água daquele dia não tenham sido batidos.
const RefeicaoLivre = (() => {
  const CAMPO = 'refeicoes_livres';
  const TOLERANCIA = 0.10;

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
    const { dias, diasUteis, sab, dom } = semanaDe(dateISO);
    const hojeISO = Util.todayISO();

    const treinoDatas = new Set(Storage.getAll('treino').map(t => t.date));
    const corridaDatas = new Set(Storage.getAll('corridas').map(c => c.date));
    const kcalPorData = {};
    Storage.getAll('alimentacao').forEach(e => { kcalPorData[e.date] = (kcalPorData[e.date] || 0) + (e.kcal || 0); });
    const aguaPorData = {};
    Storage.getAll('agua').forEach(a => { aguaPorData[a.date] = (aguaPorData[a.date] || 0) + (a.ml || 0); });

    const detalheDias = diasUteis.map(d => {
      if (d > hojeISO) return { date: d, futuro: true, preenchido: false, exercicioOk: false, caloriasOk: false, ok: false };
      const kcalDia = kcalPorData[d] || 0;
      const preenchido = kcalDia > 0;
      const min = meta ? meta.kcal * (1 - TOLERANCIA) : null;
      const max = meta ? meta.kcal * (1 + TOLERANCIA) : null;
      const caloriasOk = !!meta && preenchido && kcalDia >= min && kcalDia <= max;
      const exercicioOk = treinoDatas.has(d) || corridaDatas.has(d);
      return { date: d, futuro: false, preenchido, exercicioOk, caloriasOk, ok: exercicioOk && caloriasOk };
    });
    const diasUteisOk = detalheDias.every(d => d.ok);

    const diasPassados7 = dias.filter(d => d <= hojeISO);
    const diasAguaOk = diasPassados7.filter(d => !!aguaMeta && (aguaPorData[d] || 0) >= aguaMeta).length;
    const necessarios = Math.ceil(diasPassados7.length * 0.8);
    const aguaOk = diasPassados7.length > 0 && diasAguaOk >= necessarios;

    const elegivel = diasUteisOk && aguaOk;
    const ehFimDeSemana = dateISO === sab || dateISO === dom;
    const usos = usadasNaSemana(dateISO);
    const podeUsarHoje = elegivel && ehFimDeSemana && !protegida(dateISO) && usos.length < 2;

    return {
      elegivel, ehFimDeSemana, podeUsarHoje,
      usosNaSemana: usos.length, restantes: Math.max(0, 2 - usos.length),
      detalheDias, aguaOk, diasAguaOk, diasAguaNecessarios: necessarios, diasAguaContados: diasPassados7.length,
    };
  }

  function usar(dateISO) {
    if (protegida(dateISO)) return false;
    Storage.add(CAMPO, { date: dateISO });
    return true;
  }

  return { semanaDe, elegibilidade, usar, protegida, usadasNaSemana };
})();
