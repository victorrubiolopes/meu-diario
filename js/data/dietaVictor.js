// Plano nutricional do Victor montado pelo profissional Bronyer, referência 15/08/2026,
// objetivo Cutting. Mesmo modelo do PLANO_VICTOR (ficha de treino): fica aqui como pacote
// carregável e só aparece pro dono do app — não é semeado em ninguém.
//
// As metas abaixo são as prescritas, transcritas sem ajuste. Vale registrar que a soma das
// 5 refeições dá ~1460 kcal e ~145g de proteína, ou seja ~205 kcal e ~28g de proteína abaixo
// das metas (o carboidrato bate: ~146,5g contra 145,5g). Os valores dos alimentos aqui vêm da
// biblioteca do app, que pode divergir da tabela usada pelo profissional — a diferença está
// documentada pra acompanhamento, não corrigida.
//
// Cada item de combo guarda o valor TOTAL já multiplicado pela quantidade (mesmo formato que
// a tela de Combos grava), então o pacote não depende de nenhum alimento da biblioteca.
const DIETA_VICTOR = {
  fonte: 'dieta-bronyer-2026-08-15',
  dieta: {
    nome: 'Bronyer · Cutting 15/08/2026',
    kcal: 1665,
    protein: 172.9,
    carb: 145.5,
    fat: 42.7,
    fiber: null,
  },
  aguaMetaMl: 4000,
  combos: [
    {
      nome: 'Bronyer · R1 (05:30)',
      horario: '05:30',
      itens: [
        { foodName: 'Paçoca', qty: 1, kcal: 96, carbs: 10.4, sugars: 8.6, protein: 2.5, fat: 5, satFat: 0.9, transFat: 0, fiber: 1, sodium: 45 },
      ],
    },
    {
      nome: 'Bronyer · R2 Crepioca (08:00)',
      horario: '08:00',
      itens: [
        { foodName: 'Ovo frito (chapa untada, sem óleo)', qty: 2, kcal: 164, carbs: 1.2, sugars: 1.2, protein: 13, fat: 11.6, satFat: 3.6, transFat: 0, fiber: 0, sodium: 140 },
        { foodName: 'Tapioca (goma hidratada)', qty: 0.6, kcal: 53.4, carbs: 13.2, sugars: 0.1, protein: 0.1, fat: 0, satFat: 0, transFat: 0, fiber: 0.2, sodium: 0.6 },
        { foodName: 'Mel', qty: 0.75, kcal: 45.8, carbs: 12.4, sugars: 12.3, protein: 0.1, fat: 0, satFat: 0, transFat: 0, fiber: 0, sodium: 0.8 },
        { foodName: 'Queijo mussarela', qty: 0.5, kcal: 45, carbs: 0.3, sugars: 0.3, protein: 3.3, fat: 3.5, satFat: 2.1, transFat: 0, fiber: 0, sodium: 88 },
      ],
    },
    {
      nome: 'Bronyer · R3 Almoço (12:30)',
      horario: '12:30',
      itens: [
        { foodName: 'Batata inglesa assada', qty: 2.3, kcal: 213.9, carbs: 48.3, sugars: 2.8, protein: 5.8, fat: 0.2, satFat: 0, transFat: 0, fiber: 5.1, sodium: 11.5 },
        { foodName: 'Frango desfiado cozido (peito)', qty: 1.5, kcal: 247.5, carbs: 0, sugars: 0, protein: 45, fat: 6, satFat: 1.7, transFat: 0, fiber: 0, sodium: 97.5 },
      ],
    },
    {
      nome: 'Bronyer · R4 Whey (16:00)',
      horario: '16:00',
      itens: [
        { foodName: 'Whey protein (pó)', qty: 1, kcal: 120, carbs: 3, sugars: 2, protein: 24, fat: 1.5, satFat: 0.5, transFat: 0, fiber: 0, sodium: 50 },
        { foodName: 'Leite desnatado', qty: 1, kcal: 70, carbs: 9.8, sugars: 9.8, protein: 6.8, fat: 0.4, satFat: 0.2, transFat: 0, fiber: 0, sodium: 80 },
      ],
    },
    {
      nome: 'Bronyer · R5 Jantar (20:00)',
      horario: '20:00',
      itens: [
        { foodName: 'Batata inglesa assada', qty: 2.3, kcal: 213.9, carbs: 48.3, sugars: 2.8, protein: 5.8, fat: 0.2, satFat: 0, transFat: 0, fiber: 5.1, sodium: 11.5 },
        { foodName: 'Tilápia grelhada', qty: 1.5, kcal: 192, carbs: 0, sugars: 0, protein: 39.3, fat: 4.1, satFat: 1.4, transFat: 0, fiber: 0, sodium: 84 },
      ],
    },
  ],
  // Substituições que o profissional autorizou, guardadas como texto pra consulta —
  // não viram alimento nem combo.
  observacoes: [
    'R2 — queijo: 15g mussarela OU 20g queijo minas OU 25g requeijão light.',
    'R3 — carboidrato: 230g batata inglesa assada OU 240g batata doce assada (peso pronto).',
    'R3/R5 — proteína (150g, peso cozido): frango, patinho, tilápia, lombo ou pernil.',
    'R4 — proteína: 30g whey concentrado OU albumina, proteína da carne ou vegetal.',
    'R4 — lácteo: 200ml leite desnatado OU 20g leite em pó desnatado OU 160g iogurte natural desnatado.',
    'R4 — pode ser substituída inteira por uma barrinha de proteína, se precisar de praticidade.',
    'R1/R2/R4 — bebida: café, chá ou suco zero à vontade. R3/R5 — 250ml de suco/refri zero.',
    'R3/R5 — salada à vontade (brócolis, repolho, couve-flor, alface, pepino, espinafre).',
    'Suplementação: whey na Refeição 4. Água: 4 litros/dia.',
  ],
};
