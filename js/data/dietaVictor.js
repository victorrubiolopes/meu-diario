// Plano nutricional do Victor — nutricionista Matheus Alvarenga (GorgoTeam), 15/08/2026,
// objetivo Cutting, 3 meses. Mesmo modelo do PLANO_VICTOR (ficha de treino): pacote carregável
// que só aparece pro dono do app, não é semeado em ninguém.
//
// TODOS os macros abaixo são transcritos do PDF do nutricionista, alimento por alimento —
// não são calculados pela biblioteca do app. É o que faz o acompanhamento bater com a
// prescrição dele em vez de divergir por diferença de tabela.
//
// Contexto do cabeçalho: 84,1 kg · 1,75 m · 29 anos · gasto calórico diário 2780 kcal ·
// consumo da dieta 1665 kcal · saldo estimado −1115 kcal/dia.
//
// COMO O 1665 kcal É FORMADO (importante pra ler o app corretamente):
// A soma das 5 refeições dá 1515 kcal / 128,4C / 35,7G / 168,7P / 23,1 fibras. A refeição
// livre semanal (1050 kcal) entra diluída por 7 dias — 150 kcal/dia — fechando os 1665 do
// cabeçalho. Confere nos cinco: 1515+150=1665 · 128,4+17,1=145,5 · 35,7+7,1=42,8≈42,7 ·
// 168,7+4,2=172,9 · 23,1+0,71=23,8.
// Ou seja: em dia normal você come 1515 kcal, não 1665. A meta de 1665 é a média semanal.
//
// A refeição livre SUBSTITUI uma das 5 refeições (obs. 2 do PDF: "1x por semana você pode
// retirar 1 refeição da sua dieta padrão e comer uma refeição lixo") — ela não se soma às 5.
//
// Os alimentos abaixo usam as substituições que o Victor prefere, todas autorizadas na coluna
// de observações do próprio PDF. Como o nutricionista trata as substituições como equivalentes
// dentro da mesma "vaga", os macros da vaga valem para o substituto.
const DIETA_VICTOR = {
  fonte: 'dieta-gorgoteam-2026-08-15',
  profissional: 'Matheus Alvarenga · GorgoTeam',
  dieta: {
    nome: 'GorgoTeam · Cutting 15/08/2026',
    kcal: 1665,
    protein: 172.9,
    carb: 145.5,
    fat: 42.7,
    fiber: 23.8,
  },
  aguaMetaMl: 4000,
  // Média semanal (cabeçalho) x dia normal, pra referência de quem lê o app.
  kcalDiaNormal: 1515,
  refeicaoLivre: { kcal: 1050, carbs: 120, fat: 50, protein: 30, fiber: 5, porSemana: 1 },
  combos: [
    {
      nome: 'GorgoTeam · R1 (05:30)',
      horario: '05:30',
      itens: [
        // PDF: pasta de amendoim 25g — "ou chocolate 50% ou amendoim torrado ou 1 paçoca".
        { foodName: 'Paçoca (vaga da pasta de amendoim 25g)', qty: 1, kcal: 153, carbs: 5, sugars: 4.2, protein: 6.8, fat: 11.8, satFat: 2.2, transFat: 0, fiber: 1.8, sodium: 45 },
      ],
    },
    {
      nome: 'GorgoTeam · R2 (08:00)',
      horario: '08:00',
      itens: [
        // PDF: pão integral 2 fatias — "ou 1 pão francês ou 50g tapioca ou 100g cuscuz".
        // O Victor usa 30g de tapioca + 15g de mel no lugar dos 50g de tapioca da equivalência.
        // Fica ~34 kcal abaixo da vaga (292 contra 326 na refeição) e, principalmente, perde as
        // 3,5g de fibra do pão — compensável com os vegetais liberados à vontade.
        { foodName: 'Tapioca 30g', qty: 0.6, kcal: 53, carbs: 13.2, sugars: 0.1, protein: 0.1, fat: 0, satFat: 0, transFat: 0, fiber: 0.2, sodium: 1 },
        { foodName: 'Mel 15g', qty: 0.75, kcal: 46, carbs: 12.4, sugars: 12.3, protein: 0.1, fat: 0, satFat: 0, transFat: 0, fiber: 0, sodium: 1 },
        { foodName: 'Ovo (2 unidades)', qty: 1, kcal: 145, carbs: 1.2, sugars: 1.2, protein: 12.6, fat: 10, satFat: 3.1, transFat: 0, fiber: 0, sodium: 140 },
        { foodName: 'Mussarela 15g', qty: 1, kcal: 48, carbs: 0.5, sugars: 0.5, protein: 3.8, fat: 3.4, satFat: 2.1, transFat: 0, fiber: 0, sodium: 88 },
      ],
    },
    {
      nome: 'GorgoTeam · R3 Almoço (12:30)',
      horario: '12:30',
      itens: [
        // PDF: arroz 100g + feijão 100g. Substituição autorizada: 245g batata inglesa (vaga do
        // arroz) + 145g (vaga do feijão), peso cozido — equivale a ~230g assada.
        { foodName: 'Batata inglesa (vaga do arroz 100g + feijão 100g)', qty: 1, kcal: 204, carbs: 41.6, sugars: 2.4, protein: 7.5, fat: 0.8, satFat: 0.1, transFat: 0, fiber: 8.9, sodium: 12 },
        // PDF: frango 150g — "ou patinho ou tilápia ou lombo ou pernil (peso cozido)".
        { foodName: 'Frango 150g (peso cozido)', qty: 1, kcal: 226, carbs: 0, sugars: 0, protein: 48, fat: 3.8, satFat: 1.1, transFat: 0, fiber: 0, sodium: 98 },
      ],
    },
    {
      nome: 'GorgoTeam · R4 Whey (16:00)',
      horario: '16:00',
      itens: [
        { foodName: 'Whey concentrado 30g', qty: 1, kcal: 114, carbs: 4.5, sugars: 2, protein: 24, fat: 0, satFat: 0, transFat: 0, fiber: 0, sodium: 50 },
        { foodName: 'Leite desnatado 200ml', qty: 1, kcal: 64, carbs: 10, sugars: 10, protein: 6, fat: 0, satFat: 0, transFat: 0, fiber: 0, sodium: 80 },
      ],
    },
    {
      nome: 'GorgoTeam · R5 Jantar (20:00)',
      horario: '20:00',
      itens: [
        { foodName: 'Batata inglesa (vaga do arroz 100g + feijão 100g)', qty: 1, kcal: 204, carbs: 41.6, sugars: 2.4, protein: 7.5, fat: 0.8, satFat: 0.1, transFat: 0, fiber: 8.9, sodium: 12 },
        { foodName: 'Tilápia 150g (peso cozido)', qty: 1, kcal: 226, carbs: 0, sugars: 0, protein: 48, fat: 3.8, satFat: 1.1, transFat: 0, fiber: 0, sodium: 84 },
      ],
    },
  ],
  suplementos: [
    'Cafeína 100mg — 1 cáps ao acordar + 1 cáps após o almoço.',
    'Creatina 5g — ao acordar.',
    'Multivitamínico — 1 cáps após a refeição 1.',
    'Whey Protein — refeição 4.',
    'L-Teanina 200mg — 1 cáps após a última refeição.',
  ],
  observacoes: [
    'Dieta composta por 5 refeições diárias + 1 refeição livre semanal (a livre SUBSTITUI uma das 5).',
    'Refeição livre ~1000 kcal, 1x na semana, sem exageros — preferir hambúrguer artesanal ou pizza com proteína.',
    'Comer mais ou menos a cada 3h. A ordem e o horário das refeições não fazem diferença — dá pra juntar refeições.',
    'Optar pelos lácteos na versão ZERO LACTOSE.',
    'R1 — pasta de amendoim 25g: ou chocolate 50%, ou amendoim torrado, ou 1 paçoca.',
    'R2 — pão integral 2 fatias: ou 1 pão francês, ou 50g tapioca, ou 100g cuscuz (peso pronto).',
    'R2 — mussarela 15g: ou 20g queijo minas ou 25g requeijão light.',
    'R3/R5 — arroz 100g: ou 80g macarrão, ou 165g batata doce, ou 245g batata inglesa, ou 100g mandioca (peso cozido).',
    'R3/R5 — feijão 100g: ou +60g arroz, ou 50g macarrão, ou 100g batata doce, ou 145g batata inglesa, ou 60g mandioca.',
    'R3/R5 — frango 150g: ou patinho, ou tilápia, ou lombo, ou pernil (peso cozido).',
    'R4 — whey: ou albumina, ou proteína da carne, ou proteína vegetal. Lácteo: ou 20g leite em pó desnatado ou 160g iogurte natural desnatado. Pode virar 1 barrinha de proteína.',
    'R5 — pode substituir a janta por hambúrguer caseiro: 100g de carne + 2 fatias de pão + 15g de queijo.',
    'Vegetais (brócolis, repolho, couve-flor, alface, pepino, espinafre) à vontade em qualquer refeição.',
    'Temperos sem carboidrato liberados; ketchup/mostarda/barbecue com moderação. Bebidas 0 kcal liberadas.',
    'Atentar à rotina de aeróbicos — questão calórica e hormonal. Álcool: cortar se possível.',
    'Enviar o relatório quinzenal. "Não se importe com peso, seu melhor amigo é seu espelho."',
  ],
};
