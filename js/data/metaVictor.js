// Meta própria do Victor, calculada em conversa com a IA a partir dos dados registrados no
// app — NÃO é prescrição de nutricionista. Nasceu em 18/08/2026 e foi REVISADA em 31/08,
// no fechamento dos 14 dias de teste. Mesmo modelo do DIETA_VICTOR (upsert por fonte, só
// aparece pro dono do app).
//
// ======================= O QUE OS 14 DIAS MOSTRARAM (31/08) =======================
//
// A versão de 18/08 mirava 1940 kcal/dia e ERRAVA em duas coisas:
//
// 1. TIRAVA A REFEIÇÃO LIVRE. A prescrição do Matheus tinha 1050 kcal, 1x/semana,
//    SUBSTITUINDO uma refeição — média semanal de 1665. Esta meta simplesmente não tinha
//    o campo. O Victor manteve o hábito (que estava certo) e as duas livres do período
//    caíram INTEIRAS por cima de um alvo sem espaço pra elas: saíram em 2859 e 2689 kcal,
//    contra os ~2065 previstos. E o app não avisou, porque a régua tinha sido removida.
//
// 2. O ALVO ERA ALTO DEMAIS. 1940 sem previsão de livre, com as livres acontecendo,
//    implicava ~2060 kcal/dia de média real.
//
// Resultado dos 14 dias: peso 83,7 -> 84,3 kg. MAS o ganho quase certamente não é gordura.
// O carboidrato subiu de 110 pra 179 g/dia; glicogênio carrega ~3g de água por grama, e
// reabastecer de um estado depletado adiciona 1,3-1,5 kg na balança sem uma grama de
// gordura. Com TDEE realista de ~2350, comer 1875 dá déficit de ~475/dia = -0,86 kg de
// gordura em 14 dias. -0,86 de gordura mais +1,4 de água dá exatamente o +0,6 medido.
//
// ATENÇÃO PRA QUEM LER DEPOIS: não dá pra derivar TDEE de peso de balança em 2 semanas
// com o carboidrato mudando. Eu tentei três vezes nesta conversa e produzi três respostas
// diferentes (1530, 2700, 2350) — o erro estava no método, não nos dados. Peso de balança
// nesse prazo mede hidratação, não balanço energético.
//
// ======================= POR QUE 1750 E NÃO 1515 =======================
//
// Voltar pro 1515 do Matheus seria over-correction: contra TDEE de ~2350 é déficit de
// 835/dia, mais de 1% do peso por semana. É o tipo de aperto associado a adaptação
// metabólica — e os exames do Victor já mostram T4 livre em 0,98 (piso da faixa é 0,75)
// com TSH subindo de 2,56 pra 3,3 em três anos. Foram também as duas semanas a ~1290 kcal
// que precederam os dias de 2859 e 2689: restrição forte cobra o preço depois.
//
// 1750 é o meio entre as duas configurações que ele JÁ rodou (1515 do Matheus e 1940 meu),
// com a régua da refeição livre de volta. Média semanal ~1840, déficit de ~510/dia.
//
// ======================= A PRIORIDADE MUDOU =======================
//
// O peso está entre 83,7 e 85,4 kg desde março e a gordura entre 18,3% e 19,6% — seis meses
// de composição parada. No mesmo período os lipídios pioraram de forma monotônica:
// LDL 101 -> 111 -> 120 -> 137 (nunca desceu), HDL 40 -> 45 -> 54 -> 38 (caiu 30% em um ano),
// colesterol total 160 -> 198. Ele tem 29 anos.
//
// Por isso o alvo primário deste ciclo NÃO é a balança, é a GORDURA SATURADA: estava em
// 20,5-23,5 g/dia (11-12% das kcal) e o cardápio abaixo entrega 10,4-11,2 g (5,4-5,5%).
// Saturada é o fator dietético com relação causal mais estabelecida com LDL, e não depende
// de resolver nenhuma dúvida sobre o metabolismo dele.
//
// Os ~10g de excesso não vinham do cardápio prescrito — vinham de fora dele (mussarela em
// porção maior que a prescrita, requeijão, pizza, pipoca de cinema).
//
// ======================= REGRA DE MÉTODO =======================
//
// Em 18/08 eu mudei TRÊS variáveis de uma vez (alvo, refeição livre e estrutura das
// refeições). Testar três juntas significa que nenhuma foi testada. Neste ciclo muda UMA:
// a saturada. As calorias voltam pra um ponto defensável e ficam lá.
const META_VICTOR = {
  fonte: 'meta-victor-ea-2026-08-18',
  meta: {
    nome: 'Meta própria — revisão pós-14 dias (31/08/2026)',
    kcal: 1750,
    protein: 160,
    carb: 195,
    fat: 38,
    fiber: 25,
  },
  // Estava na prescrição do Matheus e eu tinha removido em 18/08. Volta com o mesmo valor:
  // SUBSTITUI uma refeição do dia, não soma às cinco. Com ela, a média da semana fica em
  // ~1840 kcal. As duas livres dos 14 dias saíram em 2859 e 2689 — é esse número que o app
  // volta a conseguir apontar.
  refeicaoLivre: { kcal: 1050, carbs: 120, fat: 50, protein: 30, fiber: 5, porSemana: 1 },
  kcalDiaNormal: 1750,
  baseCalculo: [
    'TMB (Katch-McArdle, massa magra medida 68,7kg): ~1847 kcal.',
    'Exercício líquido calculado sobre os registros reais dos 14 dias (44,1 km de corrida a ~1,03 kcal/kg/km e 6 sessões de musculação a 3,5-4 METs médios, contando os descansos): ~332 kcal/dia brutos, ~230 depois de compensação de NEAT.',
    'TDEE resultante: ~2350 kcal/dia. As estimativas anteriores (2650-2870 em 18/08) superestimavam a musculação usando 5 METs, que ignora que metade da sessão é descanso.',
    'Alvo de 1750 nos dias normais + 1 refeição livre de 1050/semana substituindo uma refeição = média semanal ~1840, déficit de ~510 kcal/dia (~0,45 kg/semana).',
    'Proteína 160g = 1,9 g/kg, dentro da faixa de 1,8-2,2 recomendada em déficit com treino de força (Helms et al. 2014).',
    'ALVO PRIMÁRIO DO CICLO: gordura saturada abaixo de 17 g/dia. Estava em 20,5-23,5g (11-12% das kcal) com LDL em 137 e HDL em 38 no exame de 28/08. O cardápio abaixo entrega 10,4-11,2g.',
    'O peso NÃO é critério de sucesso deste ciclo: 15 dias com o carboidrato se estabilizando não separam gordura de glicogênio. O que o ciclo precisa entregar é 8 pesagens (2x/semana) e 15 de 15 dias registrados — sem isso toda média depende de qual subconjunto de dias se escolhe.',
  ],
  disclaimer: 'Estimativa própria a partir dos dados registrados no app, feita em conversa com IA — não é prescrição de nutricionista nem substitui avaliação profissional. Os achados de exame (LDL 137, HDL 38, T4 livre 0,98, creatinina 1,23, ferritina 269) são pra discutir com médico, não pra conduta por conta própria.',
  combos: [
    {
      nome: 'R1 · Pré-treino — Paçoca e banana (05:30)',
      horario: '05:30',
      itens: [
        { foodName: 'Paçoquita (1 unidade, 15g)', qty: 1, kcal: 80, carbs: 7.5, sugars: 7.2, protein: 2.7, fat: 4.2, satFat: 0.6, transFat: 0, fiber: 0.6, sodium: 28 },
        { foodName: 'Banana prata (1 unidade, 90g)', qty: 1, kcal: 80, carbs: 20, sugars: 12, protein: 1, fat: 0.2, satFat: 0, transFat: 0, fiber: 2, sodium: 1 },
      ],
    },
    {
      nome: 'R1 · Pré-treino — Paçoquita (05:30)',
      horario: '05:30',
      itens: [
        { foodName: 'Paçoquita (2 unidades, 30g)', qty: 1, kcal: 160, carbs: 15, sugars: 14.4, protein: 5.4, fat: 8.4, satFat: 1.2, transFat: 0, fiber: 1.2, sodium: 56 },
      ],
    },
    {
      nome: 'R1 · Pré-treino — Banana e bananinha (05:30)',
      horario: '05:30',
      itens: [
        { foodName: 'Banana nanica (1 unidade, 120g)', qty: 1, kcal: 110, carbs: 28.6, sugars: 20, protein: 1.7, fat: 0.1, satFat: 0, transFat: 0, fiber: 2.3, sodium: 1 },
        { foodName: 'Bala de banana (1 unidade, 26g)', qty: 1, kcal: 54, carbs: 13, sugars: 11, protein: 0, fat: 0, satFat: 0, transFat: 0, fiber: 0, sodium: 0 },
      ],
    },
    {
      nome: 'R2 · Café da manhã — Mussarela (08:00)',
      horario: '08:00',
      itens: [
        { foodName: 'Tapioca (goma hidratada) 50g', qty: 1, kcal: 89, carbs: 22, sugars: 0.2, protein: 0.1, fat: 0, satFat: 0, transFat: 0, fiber: 0.3, sodium: 1 },
        { foodName: 'Mel 10g', qty: 1, kcal: 30.5, carbs: 8.3, sugars: 8.2, protein: 0.1, fat: 0, satFat: 0, transFat: 0, fiber: 0, sodium: 0.5 },
        { foodName: 'Ovo 100g (2 unidades)', qty: 1, kcal: 146, carbs: 0.6, sugars: 0.6, protein: 13.4, fat: 9.6, satFat: 2.8, transFat: 0, fiber: 0, sodium: 146 },
        { foodName: 'Queijo mussarela 20g', qty: 1, kcal: 60, carbs: 0.4, sugars: 0.4, protein: 4.4, fat: 4.6, satFat: 2.7, transFat: 0, fiber: 0, sodium: 117.3 },
      ],
    },
    {
      nome: 'R2 · Café da manhã — Queijo branco (08:00)',
      horario: '08:00',
      itens: [
        { foodName: 'Tapioca (goma hidratada) 50g', qty: 1, kcal: 89, carbs: 22, sugars: 0.2, protein: 0.1, fat: 0, satFat: 0, transFat: 0, fiber: 0.3, sodium: 1 },
        { foodName: 'Mel 10g', qty: 1, kcal: 30.5, carbs: 8.3, sugars: 8.2, protein: 0.1, fat: 0, satFat: 0, transFat: 0, fiber: 0, sodium: 0.5 },
        { foodName: 'Ovo 100g (2 unidades)', qty: 1, kcal: 146, carbs: 0.6, sugars: 0.6, protein: 13.4, fat: 9.6, satFat: 2.8, transFat: 0, fiber: 0, sodium: 146 },
        { foodName: 'Queijo branco (minas frescal) 20g', qty: 1, kcal: 58, carbs: 0.7, sugars: 0.7, protein: 3.6, fat: 4.4, satFat: 2.8, transFat: 0, fiber: 0, sodium: 86.7 },
      ],
    },
    {
      nome: 'R3 · Almoço — Ceviche e batata assada (12:30)',
      horario: '12:30',
      itens: [
        { foodName: 'Ceviche de tilápia 300g', qty: 1, kcal: 285, carbs: 13.5, sugars: 4.5, protein: 45, fat: 5.4, satFat: 1.2, transFat: 0, fiber: 1.8, sodium: 1050 },
        { foodName: 'Batata inglesa assada 175g', qty: 1, kcal: 162.8, carbs: 36.8, sugars: 2.1, protein: 4.4, fat: 0.2, satFat: 0, transFat: 0, fiber: 3.9, sodium: 8.8 },
        { foodName: 'Brócolis cozido 100g', qty: 1, kcal: 25, carbs: 4.4, sugars: 0, protein: 2.1, fat: 0.5, satFat: 0.1, transFat: 0, fiber: 3.4, sodium: 10 },
        { foodName: 'Cenoura cozida 80g', qty: 1, kcal: 24, carbs: 5, sugars: 3.2, protein: 0.6, fat: 0.2, satFat: 0, transFat: 0, fiber: 2.3, sodium: 28 },
      ],
    },
    {
      nome: 'R3 · Almoço — Ceviche, arroz e feijão (12:30)',
      horario: '12:30',
      itens: [
        { foodName: 'Ceviche de tilápia 280g', qty: 1, kcal: 266, carbs: 12.6, sugars: 4.2, protein: 42, fat: 5, satFat: 1.1, transFat: 0, fiber: 1.7, sodium: 980 },
        { foodName: 'Arroz branco cozido 100g', qty: 1, kcal: 128, carbs: 28, sugars: 0, protein: 2.5, fat: 0.2, satFat: 0, transFat: 0, fiber: 0.4, sodium: 1 },
        { foodName: 'Feijão carioca cozido 120g', qty: 1, kcal: 91.2, carbs: 16.3, sugars: 0.4, protein: 5.8, fat: 0.6, satFat: 0.1, transFat: 0, fiber: 10.2, sodium: 2.4 },
        { foodName: 'Brócolis cozido 100g', qty: 1, kcal: 25, carbs: 4.4, sugars: 0, protein: 2.1, fat: 0.5, satFat: 0.1, transFat: 0, fiber: 3.4, sodium: 10 },
        { foodName: 'Cenoura cozida 80g', qty: 1, kcal: 24, carbs: 5, sugars: 3.2, protein: 0.6, fat: 0.2, satFat: 0, transFat: 0, fiber: 2.3, sodium: 28 },
      ],
    },
    {
      nome: 'R3 · Almoço — Frango e batata assada (12:30)',
      horario: '12:30',
      itens: [
        { foodName: 'Peito de frango grelhado 150g', qty: 1, kcal: 238.5, carbs: 0, sugars: 0, protein: 48, fat: 3.8, satFat: 1.2, transFat: 0, fiber: 0, sodium: 75 },
        { foodName: 'Batata inglesa assada 175g', qty: 1, kcal: 162.8, carbs: 36.8, sugars: 2.1, protein: 4.4, fat: 0.2, satFat: 0, transFat: 0, fiber: 3.9, sodium: 8.8 },
        { foodName: 'Brócolis cozido 100g', qty: 1, kcal: 25, carbs: 4.4, sugars: 0, protein: 2.1, fat: 0.5, satFat: 0.1, transFat: 0, fiber: 3.4, sodium: 10 },
        { foodName: 'Cenoura cozida 80g', qty: 1, kcal: 24, carbs: 5, sugars: 3.2, protein: 0.6, fat: 0.2, satFat: 0, transFat: 0, fiber: 2.3, sodium: 28 },
      ],
    },
    {
      nome: 'R4 · Lanche — Whey, leite e banana (16:00)',
      horario: '16:00',
      itens: [
        { foodName: 'Whey protein 30g', qty: 1, kcal: 120, carbs: 3, sugars: 2, protein: 24, fat: 1.5, satFat: 0.5, transFat: 0, fiber: 0, sodium: 50 },
        { foodName: 'Leite desnatado 200ml', qty: 1, kcal: 70, carbs: 9.8, sugars: 9.8, protein: 6.8, fat: 0.4, satFat: 0.2, transFat: 0, fiber: 0, sodium: 80 },
        { foodName: 'Banana nanica (1 unidade, 120g)', qty: 1, kcal: 110, carbs: 28.6, sugars: 20, protein: 1.7, fat: 0.1, satFat: 0, transFat: 0, fiber: 2.3, sodium: 1 },
      ],
    },
    {
      nome: 'R4 · Lanche — Whey, leite, banana e aveia (16:00)',
      horario: '16:00',
      itens: [
        { foodName: 'Whey protein 30g', qty: 1, kcal: 120, carbs: 3, sugars: 2, protein: 24, fat: 1.5, satFat: 0.5, transFat: 0, fiber: 0, sodium: 50 },
        { foodName: 'Leite desnatado 200ml', qty: 1, kcal: 70, carbs: 9.8, sugars: 9.8, protein: 6.8, fat: 0.4, satFat: 0.2, transFat: 0, fiber: 0, sodium: 80 },
        { foodName: 'Banana prata (1 unidade, 90g)', qty: 1, kcal: 80, carbs: 20, sugars: 12, protein: 1, fat: 0.2, satFat: 0, transFat: 0, fiber: 2, sodium: 1 },
        { foodName: 'Aveia em flocos 20g', qty: 1, kcal: 78, carbs: 13.3, sugars: 0.3, protein: 2.8, fat: 1.5, satFat: 0.3, transFat: 0, fiber: 2, sodium: 1.3 },
      ],
    },
    {
      nome: 'R5 · Jantar — Marmita tilápia, batata e brócolis (20:00)',
      horario: '20:00',
      itens: [
        { foodName: 'Tilápia grelhada 200g', qty: 1, kcal: 256, carbs: 0, sugars: 0, protein: 52.4, fat: 5.4, satFat: 1.8, transFat: 0, fiber: 0, sodium: 112 },
        { foodName: 'Batata inglesa cozida 300g', qty: 1, kcal: 156, carbs: 35.7, sugars: 2.4, protein: 3.6, fat: 0, satFat: 0, transFat: 0, fiber: 3.9, sodium: 6 },
        { foodName: 'Brócolis cozido 100g', qty: 1, kcal: 25, carbs: 4.4, sugars: 0, protein: 2.1, fat: 0.5, satFat: 0.1, transFat: 0, fiber: 3.4, sodium: 10 },
        { foodName: 'Azeite de oliva 6g (do cozimento)', qty: 1, kcal: 54.9, carbs: 0, sugars: 0, protein: 0, fat: 6.2, satFat: 0.9, transFat: 0, fiber: 0, sodium: 0 },
      ],
    },
  ],
};
