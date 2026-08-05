// Cálculos baseados em evidência: Mifflin-St Jeor (BMR) + multiplicador de atividade (TDEE).
// Referência geral, não substitui avaliação de nutricionista/médico.

const NIVEIS_ATIVIDADE = [
  { id: 'sedentario', label: 'Sedentário (pouco ou nenhum exercício)', mult: 1.2 },
  { id: 'leve', label: 'Leve (1-3x/semana)', mult: 1.375 },
  { id: 'moderado', label: 'Moderado (3-5x/semana)', mult: 1.55 },
  { id: 'intenso', label: 'Intenso (6-7x/semana)', mult: 1.725 },
  { id: 'muito_intenso', label: 'Muito intenso (2x/dia ou trabalho físico)', mult: 1.9 },
];

// Objetivo: define o ajuste calórico sobre o TDEE. Déficit em % do gasto (não kcal fixo) escala
// certo pra cada pessoa — 500kcal fixos é um corte muito maior pra quem tem TDEE baixo do que
// pra quem tem TDEE alto. Emagrecimento vem em 3 níveis de agressividade (pedido de usuária real
// que achou o déficit único "muito alto logo de cara").
const DIETA_TEMPLATES = [
  { id: 'emagrecimento_adaptacao', nome: 'Emagrecimento — Adaptação (recomendado)', descricao: 'Déficit leve (~10% do seu gasto), ritmo suave — bom ponto de partida pra quem tá começando', ajustePercent: -0.10 },
  { id: 'emagrecimento_moderado', nome: 'Emagrecimento — Moderado', descricao: 'Déficit equilibrado (~20% do seu gasto)', ajustePercent: -0.20 },
  { id: 'emagrecimento_agressivo', nome: 'Emagrecimento — Agressivo (experientes)', descricao: 'Déficit mais acentuado (~25% do seu gasto) — recomendado só pra quem já tem experiência com dieta', ajustePercent: -0.25 },
  { id: 'manutencao', nome: 'Manutenção', descricao: 'Calorias na média do seu gasto (TDEE)', ajusteKcal: 0 },
  { id: 'ganho', nome: 'Ganho de massa', descricao: 'Superávit leve (~300 kcal/dia) para minimizar ganho de gordura', ajusteKcal: 300 },
];

// Os 3 níveis de emagrecimento, derivados de DIETA_TEMPLATES — usado pra montar o select
// secundário "Nível" que só aparece quando o Objetivo escolhido é "Emagrecimento".
const EMAGRECIMENTO_NIVEIS = DIETA_TEMPLATES.filter(d => d.id.startsWith('emagrecimento_'));
const EMAGRECIMENTO_PADRAO = 'emagrecimento_adaptacao';

// Estilo de macros: independente do objetivo, define como as calorias se dividem
const MACRO_STYLES = [
  { id: 'balanceada', nome: 'Balanceada', descricao: 'Distribuição clássica, boa para a maioria das pessoas', proteinPerKg: 1.8, fatPercent: 0.30 },
  { id: 'low_carb', nome: 'Low-carb', descricao: 'Menos carboidrato, mais gordura e proteína', proteinPerKg: 2.0, fatPercent: 0.40 },
  { id: 'alta_proteina', nome: 'Alta proteína', descricao: 'Prioriza proteína, útil para preservar massa magra em déficit', proteinPerKg: 2.4, fatPercent: 0.25 },
];

// Estratégia alimentar: não muda a conta, só a orientação de como distribuir as refeições
const MEAL_STRATEGIES = [
  { id: 'tradicional', nome: 'Tradicional (5-6 refeições)', dica: 'Distribua suas calorias em 5-6 refeições ao longo do dia.' },
  { id: 'jejum', nome: 'Jejum intermitente (janela ~8h)', dica: 'Concentre suas refeições em uma janela de cerca de 8 horas (ex: 12h-20h), com 2-3 refeições maiores.' },
];

function calcularBMR({ peso, altura, idade, sexo }) {
  if (!peso || !altura || !idade || !sexo) return null;
  const base = 10 * peso + 6.25 * altura - 5 * idade;
  return sexo === 'masculino' ? base + 5 : base - 161;
}

function calcularTDEE(bmr, nivelAtividadeId) {
  const nivel = NIVEIS_ATIVIDADE.find(n => n.id === nivelAtividadeId) || NIVEIS_ATIVIDADE[0];
  return bmr * nivel.mult;
}

// Referência geral de hidratação: ~35ml por kg de peso corporal/dia.
function calcularMetaAgua(perfil) {
  if (perfil.aguaMetaCustom) return perfil.aguaMetaCustom;
  const peso = perfil.peso || Util.getPesoAtual();
  return peso ? Math.round(peso * 35) : null;
}

function calcularMetas(perfil) {
  const bmr = calcularBMR(perfil);

  const dietaCustom = perfil.dietaCustomId && Storage.getAll('dietas_custom').find(d => d.id === perfil.dietaCustomId);
  const metaFixa = dietaCustom || (perfil.metaCustom && perfil.metaCustom.kcal ? perfil.metaCustom : null);

  if (metaFixa) {
    const { kcal, protein, fat, carb, fiber } = metaFixa;
    const tdee = bmr ? calcularTDEE(bmr, perfil.nivelAtividade) : null;
    return {
      bmr: bmr ? Math.round(bmr) : null,
      tdee: tdee ? Math.round(tdee) : null,
      kcal, protein, fat, carb, fiber,
    };
  }

  if (!bmr) return null;
  const tdee = calcularTDEE(bmr, perfil.nivelAtividade);

  const template = DIETA_TEMPLATES.find(t => t.id === perfil.dietaTemplate) || DIETA_TEMPLATES.find(t => t.id === 'manutencao');
  const macroStyle = MACRO_STYLES.find(m => m.id === perfil.macroStyle) || MACRO_STYLES[0];

  const ajuste = template.ajustePercent != null ? tdee * template.ajustePercent : template.ajusteKcal;
  const kcal = Math.round(tdee + ajuste);
  const protein = Math.round((perfil.peso || 0) * macroStyle.proteinPerKg);
  const fat = Math.round((kcal * macroStyle.fatPercent) / 9);
  const carbKcal = kcal - protein * 4 - fat * 9;
  const carb = Math.max(0, Math.round(carbKcal / 4));

  return { bmr: Math.round(bmr), tdee: Math.round(tdee), kcal, protein, fat, carb };
}

// ~7700 kcal equivalem a ~1kg de gordura corporal (referência geral usada em nutrição esportiva).
const KCAL_POR_KG = 7700;

function calcularTendenciaPeso() {
  const perfil = Storage.getPerfil();
  const meta = calcularMetas(perfil);
  if (!meta || meta.tdee == null) return null;

  const medidas = Storage.getAll('medidas').filter(m => m.weight != null).sort((a, b) => a.date.localeCompare(b.date));
  if (medidas.length < 2) return null;

  const primeiro = medidas[0];
  const ultimo = medidas[medidas.length - 1];
  const dias = Util.daysBetween(primeiro.date, ultimo.date);
  if (dias < 3) return null;

  const semanas = dias / 7;
  const taxaReal = (ultimo.weight - primeiro.weight) / semanas;

  const ajusteDiario = meta.kcal - meta.tdee;
  const taxaEsperada = (ajusteDiario * 7) / KCAL_POR_KG;

  let status;
  if (Math.abs(taxaEsperada) < 0.05) {
    status = Math.abs(taxaReal) < 0.15 ? 'estavel' : (taxaReal < 0 ? 'perdendo' : 'ganhando');
  } else if (Math.sign(taxaReal) !== Math.sign(taxaEsperada) && Math.abs(taxaReal) > 0.1) {
    status = 'oposto';
  } else {
    const razao = taxaReal / taxaEsperada;
    if (razao < 0.7) status = 'abaixo';
    else if (razao > 1.3) status = 'acima';
    else status = 'esperado';
  }

  return { taxaReal, taxaEsperada, status, dias, pesoInicial: primeiro.weight, pesoAtual: ultimo.weight };
}

// Projeção futura: com base no déficit/superávit da dieta selecionada (meta.kcal vs TDEE),
// estima o peso em algumas semanas à frente. É uma extrapolação simples (regra dos 7700kcal/kg),
// não considera adaptação metabólica.
function calcularProjecaoPeso() {
  const perfil = Storage.getPerfil();
  const meta = calcularMetas(perfil);
  if (!meta || meta.tdee == null) return null;

  const pesoAtual = Util.getPesoAtual();
  if (!pesoAtual) return null;

  const ajusteDiario = meta.kcal - meta.tdee;
  const kgPorSemana = (ajusteDiario * 7) / KCAL_POR_KG;
  if (Math.abs(kgPorSemana) < 0.01) return { pesoAtual, kgPorSemana: 0, horizontes: [] };

  const semanasHorizontes = [2, 4, 8, 12];
  const horizontes = semanasHorizontes.map(semanas => ({
    semanas,
    data: Util.daysFromNow(semanas * 7),
    peso: Math.round((pesoAtual + kgPorSemana * semanas) * 10) / 10,
  }));

  return { pesoAtual, kgPorSemana: Math.round(kgPorSemana * 100) / 100, horizontes };
}

// Recomendação de próxima refeição com base no horário e nos combos com horário definido.
// Só faz sentido para uma dieta específica nomeada (ex: plano de nutricionista), não para
// objetivos calculados automaticamente — por isso exige perfil.dietaCustomId.
function calcularProximaRefeicao() {
  const perfil = Storage.getPerfil();
  if (!perfil.dietaCustomId) return null;

  const combos = Storage.getAll('combos').filter(c => c.horario);
  if (combos.length === 0) return null;

  const toMin = (hhmm) => {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
  };

  const agora = new Date();
  const nowMin = agora.getHours() * 60 + agora.getMinutes();
  const ordenados = [...combos].sort((a, b) => toMin(a.horario) - toMin(b.horario));

  let proximo = ordenados.find(c => toMin(c.horario) >= nowMin);
  let amanha = false;
  if (!proximo) {
    proximo = ordenados[0];
    amanha = true;
  }

  return { combo: proximo, amanha };
}

// Heurística simples para mapear o horário de um combo a um dos tipos de refeição do app.
function inferMealTypeFromHorario(horario) {
  const [h] = horario.split(':').map(Number);
  if (h < 10) return 'Café da manhã';
  if (h < 15) return 'Almoço';
  if (h < 18) return 'Lanche';
  return 'Jantar';
}

// "Método do prato": quando não há dieta customizada (perfil.dietaCustomId), sugere um
// alimento de cada categoria por refeição, puxando da biblioteca do próprio usuário.
const ESTRUTURA_REFEICAO_PADRAO = {
  'Café da manhã': ['proteina', 'carboidrato', 'fruta'],
  'Almoço': ['proteina', 'carboidrato', 'legume'],
  'Lanche': ['proteina', 'carboidrato'],
  'Jantar': ['proteina', 'carboidrato', 'legume'],
};

function _hashSeed(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

// Escolha determinística (não Math.random): mesma data+seed sempre resulta na mesma
// sugestão, então ela não muda sozinha a cada re-render — só quando o usuário pede
// "Ver outras opções" (que incrementa o shuffleSeed).
function sugerirRefeicoesDoDia(date, shuffleSeed = 0) {
  const lib = Storage.getAll('alimentos_biblioteca');
  const porCategoria = {};
  Object.values(ESTRUTURA_REFEICAO_PADRAO).flat().forEach(cat => {
    if (!porCategoria[cat]) porCategoria[cat] = lib.filter(f => getCategoriaAlimento(f.name) === cat);
  });

  const resultado = {};
  Object.entries(ESTRUTURA_REFEICAO_PADRAO).forEach(([mealType, categorias]) => {
    resultado[mealType] = categorias.map(cat => {
      const candidatos = porCategoria[cat];
      if (!candidatos || candidatos.length === 0) return null;
      const idx = _hashSeed(`${date}|${shuffleSeed}|${mealType}|${cat}`) % candidatos.length;
      return { categoria: cat, food: candidatos[idx] };
    }).filter(Boolean);
  });
  return resultado;
}

// Estimativa de calorias gastas em atividades do dia (corrida + musculação),
// usada para preencher automaticamente o campo de gasto extra em Início.
function calcularGastoEstimado(date) {
  const peso = Util.getPesoAtual();
  if (!peso) return 0;
  let total = 0;

  Storage.getByDate('corridas', date).forEach(c => {
    // Regra geral: ~1 kcal por kg de peso corporal por km percorrido (corrida).
    if (c.distanceKm) total += peso * c.distanceKm * 1.036;
  });

  Storage.getByDate('treino', date).forEach(t => {
    // MET ~5 (musculação moderada) — só entra na conta se a duração foi informada.
    if (t.duracaoMin) total += 5 * peso * (t.duracaoMin / 60);
  });

  return Math.round(total);
}

// Cria/atualiza o registro de gasto extra do dia com a estimativa automática,
// sem sobrescrever um valor que o usuário tenha ajustado manualmente.
function atualizarGastoAuto(date) {
  const estimado = calcularGastoEstimado(date);
  const existente = Storage.getByDate('gastos', date)[0];
  if (existente) {
    if (existente.source !== 'manual') {
      Storage.update('gastos', existente.id, { kcal: estimado, source: 'auto' });
    }
  } else if (estimado > 0) {
    Storage.add('gastos', { date, kcal: estimado, source: 'auto' });
  }
}
