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

// dietasCustomList é opcional — default lê a lista do usuário logado. O painel profissional
// passa a lista do PACIENTE (vinda do snapshot sincronizado), senão calcularMetas resolveria
// perfil.dietaCustomId contra as dietas salvas do profissional, não do paciente.
function calcularMetas(perfil, dietasCustomList) {
  const bmr = calcularBMR(perfil);

  const listaDietas = dietasCustomList || Storage.getAll('dietas_custom');
  const dietaCustom = perfil.dietaCustomId && listaDietas.find(d => d.id === perfil.dietaCustomId);
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

// Janela usada pra calcular a taxa REAL de variação de peso — só as medições dos últimos N dias,
// não o histórico inteiro desde a primeira pesagem. Assim a tendência reage ao que você fez
// recentemente (fica "ao viva" conforme registra peso), em vez de ficar diluída por meses de dados.
const JANELA_TENDENCIA_DIAS = 21;

// overrides é opcional — { perfil, medidas, dietasCustomList }. Sem isso, lê do usuário
// logado (comportamento de sempre). O painel profissional passa os dados do PACIENTE.
function calcularTendenciaPeso(overrides) {
  const perfil = (overrides && overrides.perfil) || Storage.getPerfil();
  const meta = calcularMetas(perfil, overrides && overrides.dietasCustomList);
  if (!meta || meta.tdee == null) return null;

  const todas = ((overrides && overrides.medidas) || Storage.getAll('medidas')).filter(m => m.weight != null).sort((a, b) => a.date.localeCompare(b.date));
  if (todas.length < 2) return null;

  const hojeISO = Util.todayISO();
  const limiteISO = Util.addDaysISO(hojeISO, -JANELA_TENDENCIA_DIAS);
  const recentes = todas.filter(m => m.date >= limiteISO);

  // Usa a janela recente se tiver pelo menos 2 medições com um intervalo mínimo (senão uma
  // pesagem de ontem pra hoje ia gerar uma taxa maluca por ruído normal de balança/água/comida).
  // Sem dado recente suficiente, cai pro histórico completo — mesmo comportamento de antes.
  const usarRecente = recentes.length >= 2 && Util.daysBetween(recentes[0].date, recentes[recentes.length - 1].date) >= 5;
  const janela = usarRecente ? recentes : todas;

  const primeiro = janela[0];
  const ultimo = janela[janela.length - 1];
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

  return { taxaReal, taxaEsperada, status, dias, pesoInicial: primeiro.weight, pesoAtual: ultimo.weight, janelaRecente: usarRecente };
}

// Projeção futura: 2 caminhos, dependendo do que temos de dado.
// 1) Com pesagens recentes suficientes (janela de calcularTendenciaPeso): usa a taxa REAL
//    observada, extrapolada só por algumas semanas — fica "ao vivo", muda conforme você
//    registra peso/refeições, e não finge que sabe o que vai acontecer daqui 3 meses.
// 2) Sem dado recente: cai pra uma estimativa teórica (déficit/superávit da meta vs TDEE),
//    mas recalculando o TDEE semana a semana com o peso projetado — uma aproximação simples
//    de adaptação metabólica (corpo mais leve gasta menos), em vez de assumir o mesmo ritmo
//    pra sempre.
function calcularProjecaoPeso() {
  const perfil = Storage.getPerfil();
  const meta = calcularMetas(perfil);
  if (!meta || meta.tdee == null) return null;

  const pesoAtual = Util.getPesoAtual();
  if (!pesoAtual) return null;

  const semanasHorizontes = [2, 4, 6];
  const tendencia = calcularTendenciaPeso();
  const usarReal = !!(tendencia && tendencia.janelaRecente && tendencia.dias >= 10);

  if (usarReal) {
    const kgPorSemana = tendencia.taxaReal;
    if (Math.abs(kgPorSemana) < 0.01) return { pesoAtual, kgPorSemana: 0, horizontes: [], baseadoEm: 'real' };
    const horizontes = semanasHorizontes.map(semanas => ({
      semanas,
      data: Util.daysFromNow(semanas * 7),
      peso: Math.round((pesoAtual + kgPorSemana * semanas) * 10) / 10,
    }));
    return { pesoAtual, kgPorSemana: Math.round(kgPorSemana * 100) / 100, horizontes, baseadoEm: 'real' };
  }

  let pesoSimulado = pesoAtual;
  const porSemana = [];
  for (let s = 1; s <= Math.max(...semanasHorizontes); s++) {
    const bmrProjetado = calcularBMR({ peso: pesoSimulado, altura: perfil.altura, idade: perfil.idade, sexo: perfil.sexo });
    const tdeeProjetado = bmrProjetado ? calcularTDEE(bmrProjetado, perfil.nivelAtividade) : meta.tdee;
    const kgSemana = ((meta.kcal - tdeeProjetado) * 7) / KCAL_POR_KG;
    pesoSimulado = Math.round((pesoSimulado + kgSemana) * 100) / 100;
    porSemana.push(pesoSimulado);
  }
  const kgPorSemanaInicial = Math.round((porSemana[0] - pesoAtual) * 100) / 100;
  if (Math.abs(kgPorSemanaInicial) < 0.01) return { pesoAtual, kgPorSemana: 0, horizontes: [], baseadoEm: 'estimativa' };

  const horizontes = semanasHorizontes.map(semanas => ({
    semanas,
    data: Util.daysFromNow(semanas * 7),
    peso: porSemana[semanas - 1],
  }));

  return { pesoAtual, kgPorSemana: kgPorSemanaInicial, horizontes, baseadoEm: 'estimativa' };
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

// "Método do prato": quando não há dieta customizada (perfil.dietaCustomId), sugere
// alimentos por refeição puxando da biblioteca do próprio usuário. Os pools abaixo
// curam a sugestão pelo hábito real do brasileiro (pesquisa IBGE/POF + Kantar 2023) —
// café da manhã não sorteia feijão, almoço não sorteia tapioca. Categorias 'proteina'
// e 'legume' seguem livres (qualquer item da biblioteca serve nessas refeições).
const POOL_CAFE_CARB = ['Pão francês', 'Pão de forma integral', 'Pão de forma branco', 'Tapioca (goma hidratada)', 'Cuscuz de milho cozido', 'Aveia em flocos'];
// Ovo cozido sozinho é pobre em gordura — intercala com preparo que leva óleo/manteiga
// (mexido, omelete) e queijo, senão o café da manhã fica sem fonte de gordura nenhuma.
const POOL_CAFE_PROTEINA = ['Ovo cozido', 'Ovo mexido (2 ovos)', 'Omelete simples (2 ovos)', 'Queijo minas frescal', 'Requeijão', 'Iogurte natural integral'];
// Arroz e batata revezam como o carboidrato do prato, mas o feijão entra sempre junto
// — é a dupla mais consumida do país, não faz sentido sortear só um dos dois.
const POOL_ALMOCO_CARB = ['Arroz branco cozido', 'Arroz integral cozido', 'Batata inglesa cozida', 'Batata inglesa assada'];
const POOL_FEIJAO = ['Feijão carioca cozido', 'Feijão preto cozido'];
const POOL_LANCHE_CARB = ['Pão francês', 'Pão de forma integral'];
const POOL_LANCHE_PROTEINA = ['Queijo minas frescal', 'Requeijão', 'Iogurte natural integral', 'Whey protein (pó)'];
// Jantar revezado: metade das vezes repete o padrão do almoço (arroz+feijão), a outra
// metade vira hambúrguer caseiro — variação pedida sem virar uma lista enorme de opções.
const COMBO_HAMBURGUER_CASEIRO = [
  { name: 'Pão de hambúrguer', categoria: 'carboidrato' },
  { name: 'Hambúrguer bovino frito', categoria: 'proteina' },
  { name: 'Queijo mussarela', categoria: 'outro' },
  { name: 'Alface', categoria: 'legume' },
  { name: 'Tomate', categoria: 'legume' },
];

function _hashSeed(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

function _pickDet(list, seedStr) {
  if (!list || list.length === 0) return null;
  return list[_hashSeed(seedStr) % list.length];
}

// Prioriza um item da biblioteca cujo nome esteja no pool curado (hábito real); se o
// usuário não tiver nenhum desses itens específicos, cai pro sorteio livre da categoria
// inteira — a sugestão nunca fica vazia só porque um nome exato não bate.
function _pickPoolOuCategoria(lib, pool, categoria, porCategoria, seedStr) {
  const doPool = lib.filter(f => pool.includes(f.name));
  const food = doPool.length > 0 ? _pickDet(doPool, seedStr) : _pickDet(porCategoria[categoria], seedStr);
  return food ? { categoria, food } : null;
}

function _pickCategoria(porCategoria, categoria, seedStr) {
  const food = _pickDet(porCategoria[categoria], seedStr);
  return food ? { categoria, food } : null;
}

// Salada é pra ser crua mesmo — só esses ficam de fora do filtro "sem cru" abaixo.
const LEGUMES_CRUS_OK = ['Alface', 'Tomate', 'Pepino', 'Cenoura crua', 'Salada crua (mix de folhas e legumes)', 'Rúcula', 'Agrião'];

// Exclui "cru/crua" da lista antes de sortear — ninguém serve frango cru, beterraba
// crua ou alho cru como prato pronto; essas entradas só existem na biblioteca como
// referência nutricional pra quem pesa o alimento antes de cozinhar. Salada (que é
// mesmo pra comer crua) fica de fora dessa exclusão via LEGUMES_CRUS_OK.
function _semCru(lista) {
  const semCru = lista.filter(f => LEGUMES_CRUS_OK.includes(f.name) || !/\bcrus?\b|\bcrua?s?\b/i.test(f.name));
  return semCru.length > 0 ? semCru : lista;
}

function _sugerirPratoFeito(lib, porCategoria, seedPrefix) {
  const proteinaCozida = _semCru(porCategoria.proteina || []);
  const legumeCozido = _semCru((porCategoria.legume || []).filter(f => f.name !== 'Alho cru'));
  return [
    _pickPoolOuCategoria(lib, POOL_ALMOCO_CARB, 'carboidrato', porCategoria, `${seedPrefix}|carb`),
    _pickPoolOuCategoria(lib, POOL_FEIJAO, 'carboidrato', porCategoria, `${seedPrefix}|feijao`),
    _pickDet(proteinaCozida, `${seedPrefix}|prot`) ? { categoria: 'proteina', food: _pickDet(proteinaCozida, `${seedPrefix}|prot`) } : null,
    _pickDet(legumeCozido, `${seedPrefix}|legume`) ? { categoria: 'legume', food: _pickDet(legumeCozido, `${seedPrefix}|legume`) } : null,
  ].filter(Boolean);
}

// Ajusta a quantidade de cada item pra o dia inteiro bater perto da meta de calorias —
// sem isso a sugestão dava sempre 1 porção fixa de cada alimento, então quem tem meta de
// 1600kcal e quem tem meta de 3000kcal recebiam exatamente a mesma comida. Escala uniforme
// (mesmo fator em tudo) preserva a proporção de macros que a escolha de alimentos já tinha,
// só ajusta o tamanho do dia inteiro. Limitada a 0.6x–1.8x pra não sugerir porção absurda —
// fora dessa faixa, o problema não é quantidade, é a mistura de alimentos escolhida.
function _escalarParaMeta(resultado, meta) {
  if (!meta || !meta.kcal) {
    Object.values(resultado).forEach(itens => itens.forEach(it => { it.qty = 1; }));
    return resultado;
  }
  const kcalBase = Object.values(resultado).flat().reduce((s, it) => s + it.food.kcal, 0);
  if (kcalBase <= 0) return resultado;
  const scaleBruto = meta.kcal / kcalBase;
  const scale = Math.min(1.8, Math.max(0.6, Math.round(scaleBruto * 4) / 4));
  Object.values(resultado).forEach(itens => itens.forEach(it => { it.qty = scale; }));
  return resultado;
}

// Escolha determinística (não Math.random): mesma data+seed sempre resulta na mesma
// sugestão, então ela não muda sozinha a cada re-render — só quando o usuário pede
// "Ver outras opções" (que incrementa o shuffleSeed).
function sugerirRefeicoesDoDia(date, shuffleSeed = 0, meta = null) {
  const lib = Storage.getAll('alimentos_biblioteca');
  const porCategoria = {};
  ['proteina', 'carboidrato', 'fruta', 'legume', 'outro'].forEach(cat => {
    porCategoria[cat] = lib.filter(f => getCategoriaAlimento(f.name) === cat);
  });

  const resultado = {};

  resultado['Café da manhã'] = [
    _pickPoolOuCategoria(lib, POOL_CAFE_CARB, 'carboidrato', porCategoria, `${date}|${shuffleSeed}|cafe|carb`),
    _pickPoolOuCategoria(lib, POOL_CAFE_PROTEINA, 'proteina', porCategoria, `${date}|${shuffleSeed}|cafe|prot`),
    _pickCategoria(porCategoria, 'fruta', `${date}|${shuffleSeed}|cafe|fruta`),
  ].filter(Boolean);

  resultado['Almoço'] = _sugerirPratoFeito(lib, porCategoria, `${date}|${shuffleSeed}|almoco`);

  resultado['Lanche'] = [
    _pickPoolOuCategoria(lib, POOL_LANCHE_CARB, 'carboidrato', porCategoria, `${date}|${shuffleSeed}|lanche|carb`),
    _pickPoolOuCategoria(lib, POOL_LANCHE_PROTEINA, 'proteina', porCategoria, `${date}|${shuffleSeed}|lanche|prot`),
  ].filter(Boolean);

  const jantarHamburguer = _hashSeed(`${date}|${shuffleSeed}|jantar-estilo`) % 2 === 1;
  const hamburguerMontado = jantarHamburguer
    ? COMBO_HAMBURGUER_CASEIRO.map(item => {
        const food = lib.find(f => f.name === item.name);
        return food ? { categoria: item.categoria, food } : null;
      }).filter(Boolean)
    : [];
  resultado['Jantar'] = hamburguerMontado.length === COMBO_HAMBURGUER_CASEIRO.length
    ? hamburguerMontado
    : _sugerirPratoFeito(lib, porCategoria, `${date}|${shuffleSeed}|jantar`);

  return _escalarParaMeta(resultado, meta);
}

// ======================= GASTO ESTIMADO DE ATIVIDADE =======================
//
// ONDE ESTE NÚMERO É LIDO: no campo "Calorias extras gastas" do Início e, sobretudo, no
// relatório que vai pra nutricionista. Ele NÃO entra no orçamento de calorias do dia — o
// restante continua sendo 'meta − consumido'. Isso é deliberado: a meta prescrita já
// pressupõe os treinos, e somar gasto de exercício por cima transformaria a prescrição em
// outra coisa, usando um número que erra fácil 30% em musculação.
//
// TUDO AQUI É LÍQUIDO (acima do repouso). A versão anterior somava o gasto BRUTO, que
// inclui o metabolismo basal que a pessoa teria gastado parada: numa sessão de 1 hora a
// 83 kg isso são ~87 kcal que não são do exercício. Como o relatório põe esse número ao
// lado do TDEE (que já contém o basal), o bruto convidava à dupla contagem.
const KCAL_POR_LITRO_O2 = 5;      // equivalente calórico do oxigênio, aproximação usual
const VO2_REPOUSO = 3.5;          // mL/kg/min = 1 MET, o que se gasta parado

// Equação metabólica do ACSM pra corrida em terreno plano (sem inclinação):
//   VO₂ = 0,2 × velocidade + 3,5
// O termo 3,5 é o repouso e sai fora porque queremos o líquido. O termo da velocidade
// cancela com a distância, então o custo líquido dá 1,0 kcal/kg/km em qualquer ritmo.
//
// ATENÇÃO — AQUI JÁ HOUVE UM BUG. Esta função escolhia entre a equação de caminhada
// (0,1 × velocidade) e a de corrida pela velocidade MÉDIA, com corte em 134 m/min. A ideia
// era pegar quem registrasse caminhada na tela de corrida. O efeito real foi subestimar pela
// metade os treinos intervalados, que é justamente o que a ficha de corrida prescreve.
//
// O que mostrou o erro: exportação do relógio, 4 corridas de rua.
//
//   data     km    min   m/min   kcal/km   lado do corte antigo
//   17/11   5,20   35,6   146      91,3    corrida
//   10/11   5,88   43,1   136      93,7    corrida
//   07/11   3,15   22,7   139      85,7    corrida
//   12/11   3,93   31,2   126      91,9    CAIA EM CAMINHADA -> metade
//
// O custo por km é praticamente o mesmo nas quatro (86-94 kcal/km), e a de 12/11 — a única
// abaixo do corte — custou o MESMO por km que as outras. A velocidade média é baixa porque o
// descanso da ficha é PARADO: tempo parado soma minuto e não soma distância, então o custo
// POR KM continua sendo o de corrida. Era a média que enganava, não o gasto.
//
// Por isso não há mais ramo de caminhada: `corridas` só guarda date/distanceKm/timeMin/notes,
// não existe tipo "caminhada" no app, e velocidade média não distingue corrida intervalada de
// caminhada. Se algum dia entrar registro de caminhada, ela ganha a equação dela (0,1), que
// não é essa. A regra de bolso antiga (peso × km × 1,036) acertava a corrida por acidente:
// é quase exatamente o 1,0 kcal/kg/km que o ACSM dá.
function kcalCorridaLiquido(distanceKm, timeMin, peso) {
  if (!distanceKm || !timeMin || !peso) return 0;
  const velocidade = (distanceKm * 1000) / timeMin;   // m/min
  return (0.2 * velocidade * peso / 1000) * KCAL_POR_LITRO_O2 * timeMin;
}

// Musculação continua em MET, porque não existe jeito melhor com o que o app guarda: séries
// e cargas dizem o trabalho mecânico, mas converter isso em caloria depende de eficiência
// muscular, que varia demais entre pessoas e exercícios.
//
// MET 3,5 é o código do Compêndio de Atividades Físicas pra "múltiplos exercícios, 8-15
// repetições, esforço moderado". O -1 é o repouso, que sai pra dar o líquido.
//
// Aqui também havia erro: era 5, escolhido entre o 3,5 e o 6,0 ("vigorosa, body building")
// com o argumento de que 35s de descanso deixa a sessão densa. Argumento plausível e errado.
//
// A exportação do relógio tem 8 sessões de força medidas, com FC média e caloria:
//
//   data     min   kcal   kcal/min   FC média   séries   tempo em movimento
//   01/11   43,3   257      5,93       100        24        15,6 min
//   11/11   46,5   264      5,68        99        22        16,4 min
//   03/11   38,3   213      5,56        97        18        14,3 min
//   30/10   50,9   278      5,47        97        30        20,6 min
//   05/11   40,0   212      5,30        95        22        13,0 min
//   08/11   47,1   248      5,26        96        25        19,2 min
//   15/11   38,9   167      4,30        87        23        14,6 min
//   13/11   69,6   286      4,11        86        27        22,6 min
//
// Média 5,2 kcal/min BRUTO. A 80-86 kg isso é MET bruto de 3,6-3,9 — ou seja, o Compêndio
// moderado, não o vigoroso. Fica em 3,5 (e não no 3,8 medido) porque o app atende outras
// pessoas além do Victor e o valor do Compêndio é o defensável pra todas; a diferença é de
// 10%, dentro do erro do método.
//
// Duas coisas explicam por que o 5 era alto. A FC média é de 86 a 100 bpm — com repouso de
// 47, isso é 30 a 41% da reserva, que é esforço moderado e não vigoroso. E o tempo em
// MOVIMENTO é um terço da sessão (22,6 de 69,6 min em 13/11): o resto é descanso entre
// séries, parado. Densidade de descanso curto não transforma a sessão em vigorosa.
//
// NÃO usar %FC da reserva pra musculação: comparado com estas 8 medições, ela erra ~60% pra
// cima. A FC sobe no treino de força fora de proporção com o consumo de oxigênio (contração
// estática, massa muscular menor, resposta pressórica). Pra corrida ela funciona — fica 9%
// acima do medido —, mas pra força não.
const MET_MUSCULACAO = 3.5;
function kcalMusculacaoLiquido(duracaoMin, peso) {
  if (!duracaoMin || !peso) return 0;
  return (MET_MUSCULACAO - 1) * peso * (duracaoMin / 60);
}

// Devolve o gasto do dia separado por modalidade. O relatório usa a separação; quem só
// precisa do total chama calcularGastoEstimado.
function detalharGastoEstimado(date, dados) {
  const peso = dados ? dados.peso : Util.getPesoAtual();
  if (!peso) return { corrida: 0, musculacao: 0, total: 0 };
  const corridas = dados ? (dados.corridas || []).filter(c => c.date === date) : Storage.getByDate('corridas', date);
  const treinos = dados ? (dados.treino || []).filter(t => t.date === date) : Storage.getByDate('treino', date);

  let corrida = 0;
  corridas.forEach(c => { corrida += kcalCorridaLiquido(c.distanceKm, c.timeMin, peso); });
  let musculacao = 0;
  // Sem duração informada não dá pra estimar nada: um treino de 20 min e um de 90 min
  // gastam coisas muito diferentes, e chutar um valor fixo seria inventar.
  treinos.forEach(t => { musculacao += kcalMusculacaoLiquido(t.duracaoMin, peso); });

  return {
    corrida: Math.round(corrida),
    musculacao: Math.round(musculacao),
    total: Math.round(corrida + musculacao),
  };
}

function calcularGastoEstimado(date) {
  return detalharGastoEstimado(date).total;
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
