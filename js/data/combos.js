// Combos pré-definidos. Editáveis e ampliáveis pelo usuário em Mais > Combos de refeição.
const COMBOS_PADRAO = [
  {
    nome: 'Nutricionista - Refeição 1 (Pré-treino)',
    itens: [
      { foodName: 'Paçoquita', qty: 1, kcal: 80, carbs: 7.5, sugars: 7.2, protein: 2.7, fat: 4.2, satFat: 0.6, transFat: 0, fiber: 0.6, sodium: 28 },
    ],
  },
  {
    nome: 'Nutricionista - Refeição 2',
    itens: [
      { foodName: 'Pão de forma integral', qty: 2, kcal: 120, carbs: 22, sugars: 3, protein: 6, fat: 1.6, satFat: 0.4, transFat: 0, fiber: 3.6, sodium: 220 },
      { foodName: 'Ovo frito (chapa untada, sem óleo)', qty: 2, kcal: 164, carbs: 1.2, sugars: 1.2, protein: 13, fat: 11.6, satFat: 3.6, transFat: 0, fiber: 0, sodium: 140 },
      { foodName: 'Queijo mussarela', qty: 0.5, kcal: 45, carbs: 0.3, sugars: 0.3, protein: 3.3, fat: 3.45, satFat: 2.05, transFat: 0, fiber: 0, sodium: 88 },
    ],
  },
  {
    nome: 'Nutricionista - Refeição 3 (Almoço)',
    itens: [
      { foodName: 'Arroz branco cozido', qty: 1.1, kcal: 140.8, carbs: 30.8, sugars: 0, protein: 2.75, fat: 0.22, satFat: 0, transFat: 0, fiber: 0.44, sodium: 1.1 },
      { foodName: 'Peito de frango grelhado', qty: 1.5, kcal: 238.5, carbs: 0, sugars: 0, protein: 48, fat: 4.5, satFat: 1.35, transFat: 0, fiber: 0, sodium: 111 },
      { foodName: 'Salada crua (mix de folhas e legumes)', qty: 1.5, kcal: 30, carbs: 5.25, sugars: 2.25, protein: 2.25, fat: 0.3, satFat: 0, transFat: 0, fiber: 3, sodium: 22.5 },
      { foodName: 'Suco Zero (em pó, sem açúcar)', qty: 1.25, kcal: 6.25, carbs: 1.25, sugars: 0, protein: 0, fat: 0, satFat: 0, transFat: 0, fiber: 0, sodium: 12.5 },
    ],
  },
  {
    nome: 'Nutricionista - Refeição 4',
    itens: [
      { foodName: 'Whey protein (pó)', qty: 1, kcal: 120, carbs: 3, sugars: 2, protein: 24, fat: 1.5, satFat: 0.5, transFat: 0, fiber: 0, sodium: 50 },
      { foodName: 'Leite desnatado', qty: 1, kcal: 70, carbs: 9.8, sugars: 9.8, protein: 6.8, fat: 0.4, satFat: 0.2, transFat: 0, fiber: 0, sodium: 80 },
    ],
  },
  {
    nome: 'Nutricionista - Refeição 5 (Jantar Airfryer)',
    itens: [
      { foodName: 'Batata inglesa crua', qty: 2.7, kcal: 207.9, carbs: 47.25, sugars: 2.16, protein: 5.4, fat: 0.27, satFat: 0, transFat: 0, fiber: 3.51, sodium: 16.2 },
      { foodName: 'Peito de frango grelhado', qty: 1.5, kcal: 238.5, carbs: 0, sugars: 0, protein: 48, fat: 4.5, satFat: 1.35, transFat: 0, fiber: 0, sodium: 111 },
      { foodName: 'Salada crua (mix de folhas e legumes)', qty: 1.5, kcal: 30, carbs: 5.25, sugars: 2.25, protein: 2.25, fat: 0.3, satFat: 0, transFat: 0, fiber: 3, sodium: 22.5 },
      { foodName: 'Suco Zero (em pó, sem açúcar)', qty: 1.25, kcal: 6.25, carbs: 1.25, sugars: 0, protein: 0, fat: 0, satFat: 0, transFat: 0, fiber: 0, sodium: 12.5 },
    ],
  },
];
