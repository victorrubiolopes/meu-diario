// Plano alimentar do Victor — nutricionista Gabrielle, prescrito em 23/11/2026.
// Mesmo molde do DIETA_VICTOR: pacote carregável, que só aparece pro dono do app e NÃO é
// semeado em ninguém. Carrega em Mais → Minhas Dietas → Dietas prontas.
//
// CONTEXTO — este plano é a PRIMEIRA ETAPA de um protocolo de medição, não uma dieta de
// emagrecimento fechada. A nutri estimou o gasto em 2.750 kcal (TMB 1.833 × fator 1,5); o
// histórico de peso aponta ~2.360. Ela escolheu 2.400 como referência provisória e montou
// 14 dias de registro pra descobrir qual estimativa está certa. A tela de Protocolo
// (Mais → Protocolo) faz essa conta. Por isso aqui o que importa mais que o valor
// prescrito é o registro do que foi REALMENTE comido.
//
// NOTA DO FRANGO — a única divergência real contra o PDF, e está aqui porque não deve ser
// escondida. O relatório de nutrientes do PDF fecha em 2.425 kcal; somando pelos valores
// da biblioteca do app dá ~2.345. Quase toda a diferença é o frango: a biblioteca usa o
// valor TACO do peito sem pele grelhado (159 kcal / 32g proteína / 2,5g gordura por 100g)
// e o software da nutri usa um filé bem mais gordo (~6g por 100g, deduzido do relatório
// dela). Nos dois casos os 8g de azeite são contados à parte.
//
// NÃO ajustei nenhum número pra 'fazer bater' — forçar valor pra casar com outra tabela é
// inventar dado. Quem resolve isso é o Victor dizendo qual corte ele come de verdade: se
// for peito sem pele, o valor do app está certo; se for um filé mais gordo ou com óleo de
// preparo junto, o dela está. São ~80 kcal/dia, e no meio de um protocolo que tenta medir
// uma diferença de 390 kcal isso não inverte a conclusão, mas desloca o resultado.
//
// Os macros por item saem da biblioteca do app (base TACO) multiplicados pela grama
// prescrita — diferente do DIETA_VICTOR, cujo PDF trazia macro por alimento e por isso
// pôde ser transcrito. Este PDF só traz total por refeição; esses totais ficam registrados
// em 'pdfPorRefeicao' logo abaixo de cada uma, pra conferência.
const DIETA_GABI = {
  fonte: 'dieta-gabi-2026-11-23',
  profissional: 'Gabrielle',
  dieta: {
    nome: 'Gabrielle · Protocolo 23/11/2026',
    kcal: 2425,
    protein: 172.1,
    carb: 283.8,
    fat: 65.7,
    fiber: 23.4,
  },
  // O que o PDF declara, pra comparar com o que o app calcula.
  pdfTotal: { kcal: 2425, protein: 172.1, carb: 283.8, fat: 65.7, fiber: 23.4, colesterol: 886.6, satFat: 14.2, sodio: 2042.3 },
  appTotal: { kcal: 2342, protein: 172.1, carb: 291.0, fat: 56.6 },
  protocolo: { vet: 2400, dias: 14, inicio: null },
  observacoes: [
    'Este plano é a primeira etapa de um protocolo de 14 dias para MEDIR o gasto energético, não uma dieta de emagrecimento fechada.',
    'Registrar todos os alimentos e bebidas, incluindo refeições livres, óleos, molhos e pequenas porções.',
    'Pesar-se diariamente pela manhã, após ir ao banheiro e antes de comer ou beber.',
    'Manter a rotina habitual de exercícios, sem alterações intencionais — mudar o gasto no meio invalida a medição.',
    'Observar fome, saciedade, disposição, recuperação e desempenho nos treinos.',
    'As substituições do PDF NÃO são equivalentes em caloria. Exemplo: trocar a banana do pré-treino por 30g de paçoca soma ~84 kcal ao dia. Lançar o que foi comido, não o que foi prescrito.',
    'Meta proteica de 172g (1,96 g/kg) — a própria nutri marcou a proteína como sujeita a confirmação pelo histórico renal, e o plano veio acima dos 158g que ela havia citado.',
    'Gordura saturada em 14,2g (5,3% das calorias) — bem abaixo do limite de 7% recomendado para dislipidemia. Colesterol em 886mg, quase todo dos 3 ovos do café.',
  ],
  combos: [
    {
      nome: "Gabi · Pré-treino (05:30)",
      horario: "05:30",
      pdfPorRefeicao: { kcal: 109, protein: 2, fat: 1.2, carbs: 23.2 },
      itens: [
        // PDF: 1 unidade média (65g). Substituição autorizada: paçoca 30g — mas ela tem ~84 kcal A MAIS, não é troca neutra.
        { foodName: "Banana nanica", qty: 0.5417, kcal: 59.59, carbs: 15.49, sugars: 10.83, protein: 0.92, fat: 0.05, satFat: 0, transFat: 0, fiber: 1.25, sodium: 0.54 },
        // PDF: Doce de Leite Nobre (Frimesa) 15g.
        { foodName: "Doce de leite", qty: 0.75, kcal: 45, carbs: 8.25, sugars: 8.25, protein: 1.05, fat: 1.13, satFat: 0.75, transFat: 0, fiber: 0, sodium: 15 },
      ],
    },
    {
      nome: "Gabi · Café da manhã (08:00)",
      horario: "08:00",
      pdfPorRefeicao: { kcal: 604, protein: 28.1, fat: 25.6, carbs: 66 },
      itens: [
        // PDF: 3 unidades (150g). Substituição: frango desfiado refogado 60g.
        { foodName: "Ovo cozido", qty: 3, kcal: 219, carbs: 0.9, sugars: 0.9, protein: 20.1, fat: 14.4, satFat: 4.2, transFat: 0, fiber: 0, sodium: 219 },
        // PDF: 3 fatias (75g). Substituição: goma de tapioca 45g.
        { foodName: "Pão de forma integral", qty: 3, kcal: 189, carbs: 37.5, sugars: 4.5, protein: 7.2, fat: 2.7, satFat: 0.6, transFat: 0, fiber: 5.1, sodium: 381 },
        // PDF: 1 colher de sopa rasa (15g).
        { foodName: "Mel de abelha", qty: 0.75, kcal: 38.25, carbs: 11.02, sugars: 11.02, protein: 0.08, fat: 0, satFat: 0, transFat: 0, fiber: 0.08, sodium: 2.25 },
        // PDF: 1 unidade média (65g).
        { foodName: "Banana nanica", qty: 0.5417, kcal: 59.59, carbs: 15.49, sugars: 10.83, protein: 0.92, fat: 0.05, satFat: 0, transFat: 0, fiber: 1.25, sodium: 0.54 },
        // PDF: 1 colher de sopa rasa (8g).
        { foodName: "Azeite de oliva", qty: 0.6154, kcal: 73.23, carbs: 0, sugars: 0, protein: 0, fat: 8.31, satFat: 1.17, transFat: 0, fiber: 0, sodium: 0 },
      ],
    },
    {
      nome: "Gabi · Lanche da manhã (11:00)",
      horario: "11:00",
      pdfPorRefeicao: { kcal: 67, protein: 0.9, fat: 0.2, carbs: 16.2 },
      itens: [
        // PDF: Uva Itália, 15 unidades (120g). Substituições: banana 65g, maçã 90g, melancia 200g, melão 230g ou pera 110g.
        { foodName: "Uva", qty: 1.2, kcal: 63.6, carbs: 16.68, sugars: 15.6, protein: 0.84, fat: 0.24, satFat: 0, transFat: 0, fiber: 1.08, sodium: 2.4 },
      ],
    },
    {
      nome: "Gabi · Almoço (12:00)",
      horario: "12:00",
      pdfPorRefeicao: { kcal: 725, protein: 50.5, fat: 17.8, carbs: 88 },
      itens: [
        // PDF: filé de frango grelhado, 3 bifes pequenos (150g). VER NOTA DO FRANGO no cabeçalho.
        { foodName: "Peito de frango grelhado", qty: 1.5, kcal: 238.5, carbs: 0, sugars: 0, protein: 48, fat: 3.75, satFat: 1.2, transFat: 0, fiber: 0, sodium: 75 },
        // PDF: 180g. Substituições: batata 432g, batata sauté 360g, macarrão de arroz 180g ou mandioca 180g.
        { foodName: "Arroz branco cozido", qty: 1.8, kcal: 230.4, carbs: 50.4, sugars: 0, protein: 4.5, fat: 0.36, satFat: 0, transFat: 0, fiber: 0.72, sodium: 1.8 },
        // PDF: 6 colheres de sopa cheias picada (120g). Várias substituições de legume.
        { foodName: "Beterraba cozida", qty: 1.2, kcal: 38.4, carbs: 8.64, sugars: 0, protein: 1.56, fat: 0.12, satFat: 0, transFat: 0, fiber: 2.28, sodium: 1.2 },
        // PDF: suco de uva concentrado envasado, 1 copo médio (200ml). Substituição: suco de laranja 240ml.
        { foodName: "Suco de uva integral (envasado)", qty: 1, kcal: 120, carbs: 30, sugars: 28, protein: 0, fat: 0, satFat: 0, transFat: 0, fiber: 0.2, sodium: 2 },
        // PDF: 1 colher de sopa rasa (8g).
        { foodName: "Azeite de oliva", qty: 0.6154, kcal: 73.23, carbs: 0, sugars: 0, protein: 0, fat: 8.31, satFat: 1.17, transFat: 0, fiber: 0, sodium: 0 },
      ],
    },
    {
      nome: "Gabi · Lanche da tarde (16:00)",
      horario: "16:00",
      pdfPorRefeicao: { kcal: 310, protein: 38.3, fat: 2.5, carbs: 34 },
      itens: [
        // PDF: whey protein ISOLADO, 1 porção (30g). O que o Victor tem é o Dark Lab 100%
        // Whey (Gelato di Latte), que é CONCENTRADO: 21g de proteína por dose contra os ~27g
        // de um isolado. Entra o produto real, não o prescrito — a conta do protocolo usa o
        // que foi comido. A nutri precisa saber da troca: são ~6g de proteína/dia a menos do
        // que ela planejou, e a meta proteica já estava marcada como pendente pelo histórico
        // renal.
        { foodName: "Dark Lab 100% Whey (Gelato di Latte)", qty: 1, kcal: 117, carbs: 3.4, sugars: 2.9, protein: 21, fat: 2.3, satFat: 1.5, transFat: 0.1, fiber: 0.1, sodium: 64 },
        // PDF: 1 unidade média (65g).
        { foodName: "Banana nanica", qty: 0.5417, kcal: 59.59, carbs: 15.49, sugars: 10.83, protein: 0.92, fat: 0.05, satFat: 0, transFat: 0, fiber: 1.25, sodium: 0.54 },
        // PDF: 2 colheres de sopa cheias (20g).
        { foodName: "Leite de vaca desnatado em pó", qty: 1, kcal: 72.4, carbs: 10.6, sugars: 10.6, protein: 6.9, fat: 0.2, satFat: 0.1, transFat: 0, fiber: 0, sodium: 86 },
        // PDF: 2 colheres de sopa rasas (20g).
        { foodName: "Farelo de aveia", qty: 1.3333, kcal: 73.33, carbs: 11.47, sugars: 0.27, protein: 3.07, fat: 1.6, satFat: 0.27, transFat: 0, fiber: 2, sodium: 0.67 },
      ],
    },
    {
      nome: "Gabi · Jantar (19:00)",
      horario: "19:00",
      pdfPorRefeicao: { kcal: 609, protein: 52.2, fat: 18.3, carbs: 56.4 },
      itens: [
        // PDF: filé de frango grelhado, 3 bifes pequenos (150g). VER NOTA DO FRANGO. Substituições: contrafilé 120g, frango desfiado 150g, 6 ovos (330g), sobrecoxa sem pele 150g ou tilápia 180g.
        { foodName: "Peito de frango grelhado", qty: 1.5, kcal: 238.5, carbs: 0, sugars: 0, protein: 48, fat: 3.75, satFat: 1.2, transFat: 0, fiber: 0, sodium: 75 },
        // PDF: 180g.
        { foodName: "Arroz branco cozido", qty: 1.8, kcal: 230.4, carbs: 50.4, sugars: 0, protein: 4.5, fat: 0.36, satFat: 0, transFat: 0, fiber: 0.72, sodium: 1.8 },
        // PDF: 2 ramos médios (120g).
        { foodName: "Brócolis cozido", qty: 1.2, kcal: 30, carbs: 5.28, sugars: 0, protein: 2.52, fat: 0.6, satFat: 0.12, transFat: 0, fiber: 4.08, sodium: 12 },
        // PDF: 1 colher de sopa rasa (8g).
        { foodName: "Azeite de oliva", qty: 0.6154, kcal: 73.23, carbs: 0, sugars: 0, protein: 0, fat: 8.31, satFat: 1.17, transFat: 0, fiber: 0, sodium: 0 },
      ],
    },
  ],
};
