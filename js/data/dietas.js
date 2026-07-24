// Cálculos baseados em evidência: Mifflin-St Jeor (BMR) + multiplicador de atividade (TDEE).
// Referência geral, não substitui avaliação de nutricionista/médico.

const NIVEIS_ATIVIDADE = [
  { id: 'sedentario', label: 'Sedentário (pouco ou nenhum exercício)', mult: 1.2 },
  { id: 'leve', label: 'Leve (1-3x/semana)', mult: 1.375 },
  { id: 'moderado', label: 'Moderado (3-5x/semana)', mult: 1.55 },
  { id: 'intenso', label: 'Intenso (6-7x/semana)', mult: 1.725 },
  { id: 'muito_intenso', label: 'Muito intenso (2x/dia ou trabalho físico)', mult: 1.9 },
];

// Objetivo: define o ajuste calórico sobre o TDEE
const DIETA_TEMPLATES = [
  { id: 'emagrecimento', nome: 'Emagrecimento', descricao: 'Déficit moderado (~500 kcal/dia), ritmo seguro de ~0,5kg/semana', ajusteKcal: -500 },
  { id: 'manutencao', nome: 'Manutenção', descricao: 'Calorias na média do seu gasto (TDEE)', ajusteKcal: 0 },
  { id: 'ganho', nome: 'Ganho de massa', descricao: 'Superávit leve (~300 kcal/dia) para minimizar ganho de gordura', ajusteKcal: 300 },
];

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
  if (!bmr) return null;
  const tdee = calcularTDEE(bmr, perfil.nivelAtividade);

  if (perfil.metaCustom && perfil.metaCustom.kcal) {
    const { kcal, protein, fat, carb } = perfil.metaCustom;
    return { bmr: Math.round(bmr), tdee: Math.round(tdee), kcal, protein, fat, carb };
  }

  const template = DIETA_TEMPLATES.find(t => t.id === perfil.dietaTemplate) || DIETA_TEMPLATES[1];
  const macroStyle = MACRO_STYLES.find(m => m.id === perfil.macroStyle) || MACRO_STYLES[0];

  const kcal = Math.round(tdee + template.ajusteKcal);
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
  if (!meta) return null;

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
