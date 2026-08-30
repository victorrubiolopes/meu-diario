// Meta própria do Victor, calculada em conversa com a IA a partir dos dados registrados no
// app — NÃO é prescrição de nutricionista. Aplicada em 18/08/2026, quando ele decidiu se
// afastar do gasto calórico estimado pelo Matheus (GorgoTeam) e recalcular do zero em cima do
// que os próprios dados de treino/corrida/peso mostravam, mais o relato de que a rotina real é
// "~4 dias na linha, 3 dias com desvio" — não os 7 dias parelhos que a dieta original assumia.
// Mesmo modelo do DIETA_VICTOR (upsert por fonte, só aparece pro dono do app).
//
// COMO CHEGOU NESSES NÚMEROS:
// TMB por Katch-McArdle (usa a massa magra medida, 68,4kg, mais apropriada que Mifflin pra
// quem tem FFMI alto) = ~1847 kcal. Somado ao gasto médio de exercício das últimas 8 semanas
// (corrida + musculação, ~380 kcal/dia), ao efeito térmico da comida (~240) e a uma faixa de
// NEAT (250-400), o TDEE reconstruído fica em 2650-2870 — bem perto do 2780 que o Matheus
// tinha calculado (a diferença nunca foi o gasto, foi o tamanho do déficit puxado em cima dele).
//
// O peso caiu de 85,3 para 83,7kg em 162 dias — um déficit real médio de só ~76 kcal/dia,
// o que implica ingestão real de ~2670 kcal/dia (bem acima do que o app tinha registrado).
// Pelo relato do Victor, os 4 dias "na linha" já entregam esse resultado sozinhos — quem
// apaga o déficit são os outros 3. Por isso a meta abaixo não aperta os dias que já
// funcionam: ela é desenhada como o piso pros dias que hoje saem da linha, mirando uma
// perda de ~0,4-0,5% do peso/semana (faixa associada a preservar massa magra em déficit,
// Garthe et al. 2011) sem exigir nenhum dia mais restrito do que os que ele já cumpre.
//
// Proteína em 1,8-2,2 g/kg (faixa recomendada em déficit com treino de força, Helms et al.
// 2014) — por coincidência bem próxima tanto da prescrição do Matheus (172,9g) quanto da
// regra do vídeo do Leandro Twin (168g). Esse é o número mais assentado da conta toda.
//
// ---------------------------------------------------------------------------------------
// REVISÃO DE 30/08/2026 — cardápio refeito a pedido do Victor, depois dos 14 dias de registro.
//
// 1. TODOS os itens passaram a ser DERIVADOS DA BIBLIOTECA (js/data/alimentos.js), escalando
//    a porção da biblioteca pelas gramas da refeição. Antes os números eram digitados à mão e
//    tinham divergido: "Tilápia 150g (peso cozido)" trazia 226 kcal / 48g de proteína, valores
//    idênticos aos do frango na mesma linha — era o frango copiado e renomeado, não um
//    rendimento de cocção diferente. Pela biblioteca (128 kcal / 26,2g por 100g), 150g de
//    tilápia são 192 kcal / 39,3g. Eram ~9g de proteína fantasma por refeição.
//    O DIETA_VICTOR (prescrição do Matheus) NÃO foi tocado — é documento dele.
//
// 2. Estrutura nova, com variantes intercambiáveis em cada horário:
//    - R1 pré-treino: 4 paçoquitas às 5h30 não desce. Ganhou opção com banana e com
//      bananinha. A versão com banana troca metade do açúcar ADICIONADO da paçoca por
//      açúcar intrínseco de fruta e dobra a fibra (5,2g contra 2,4g).
//    - R2 café: ovo em gramas (100g = 2 unidades) e escolha entre mussarela e queijo branco.
//      Os dois são praticamente iguais em saturada (4,1 vs 4,2g por 30g) — "queijo branco"
//      não é a opção leve que costuma parecer.
//    - R3 almoço: ceviche de tilápia (a entrada "Ceviche" da biblioteca é o prato inteiro,
//      95 kcal / 15g de proteína por 100g — peixe cru diluído em cebola e limão, por isso a
//      porção precisa ser grande pra fechar a proteína). Frango ficou como terceira variante
//      pros dias sem peixe.
//    - R4 lanche: whey + leite + banana como ele já faz, e uma segunda versão com 20g de
//      aveia — melhor fibra por caloria que qualquer outra coisa que caiba num shake.
//    - R5 jantar: só a marmita, que é o que ele está fazendo. As três variantes antigas de
//      tilápia saíram (eram as que carregavam os números errados).
//
// 3. O cardápio agora soma ~2100 kcal/dia contra a meta de 1940 fixada em 18/08. Está ACIMA
//    de propósito e é para ser revisto: os 14 dias fecharam com o peso parado a 1875 kcal
//    REGISTRADAS, o que só se explica por ingestão real maior que a anotada. A meta numérica
//    abaixo fica como está até a pesagem e as medidas de 31/08 dizerem qual é o TDEE real.
//    Proteína (173g), fibra (29g) e saturada (5,7% das kcal) já batem os alvos.
const META_VICTOR = {
  fonte: 'meta-victor-ea-2026-08-18',
  meta: {
    nome: 'Meta própria — disponibilidade energética (18/08/2026)',
    kcal: 1940,
    protein: 171,
    carb: 225,
    fat: 42,
  },
  baseCalculo: [
    'TMB (Katch-McArdle, massa magra medida 68,4kg): ~1847 kcal.',
    'TDEE reconstruído (TMB + exercício últimas 8 semanas ~380 + efeito térmico ~240 + NEAT 250-400): ~2650-2870 kcal — perto do 2780 que o Matheus tinha calculado.',
    'Ingestão real implícita pelo peso (85,3→83,7kg em 162 dias, déficit real de ~76 kcal/dia): ~2670 kcal/dia — a maior parte disso nos dias que saem da dieta.',
    'Meta original pensada pra ser o piso dos dias "fora da linha" (2210 kcal / 71g gordura), sem apertar os 4 dias que já funcionam: ~0,4-0,5% do peso/semana, faixa que preserva massa magra em déficit (Garthe et al. 2011).',
    'Proteína 1,8-2,2 g/kg (Helms et al. 2014) — 170-177g bate perto da prescrição do Matheus (172,9g) e da regra do vídeo do Leandro Twin (168g).',
    'Revisão de 30/08: cardápio refeito a pedido do Victor e com todos os itens derivados da biblioteca de alimentos, não mais digitados à mão. Um dia típico (paçoca com banana, café com mussarela, ceviche com batata assada, whey com banana e a marmita de tilápia) fecha em ~2100 kcal / 173g de proteína / 29g de fibra / saturada em 5,7% das kcal. As calorias estão ~160 acima da meta de 18/08 de propósito: os 14 dias fecharam com o peso parado a 1875 kcal registradas, o que indica ingestão real maior que a anotada. A meta numérica só muda depois da pesagem e das medidas de 31/08.',
  ],
  disclaimer: 'Estimativa própria a partir dos dados registrados no app, feita em conversa com IA — não é prescrição de nutricionista nem substitui avaliação profissional. Recalibrar depois dos 14 dias de registro completo.',
  combos: [
    {
      nome: 'R1 · Pré-treino — Paçoquita (05:30)',
      horario: '05:30',
      itens: [
        { foodName: 'Paçoquita (4 unidades, 60g)', qty: 1, kcal: 320, carbs: 30, sugars: 28.8, protein: 10.8, fat: 16.8, satFat: 2.4, transFat: 0, fiber: 2.4, sodium: 112 },
      ],
    },
    {
      nome: 'R1 · Pré-treino — Paçoca e banana (05:30)',
      horario: '05:30',
      itens: [
        { foodName: 'Paçoquita (2 unidades, 30g)', qty: 1, kcal: 160, carbs: 15, sugars: 14.4, protein: 5.4, fat: 8.4, satFat: 1.2, transFat: 0, fiber: 1.2, sodium: 56 },
        { foodName: 'Banana prata (2 unidades, 180g)', qty: 1, kcal: 160, carbs: 40, sugars: 24, protein: 2, fat: 0.4, satFat: 0, transFat: 0, fiber: 4, sodium: 2 },
      ],
    },
    {
      nome: 'R1 · Pré-treino — Banana e bananinha (05:30)',
      horario: '05:30',
      itens: [
        { foodName: 'Banana nanica (1 unidade, 120g)', qty: 1, kcal: 110, carbs: 28.6, sugars: 20, protein: 1.7, fat: 0.1, satFat: 0, transFat: 0, fiber: 2.3, sodium: 1 },
        { foodName: 'Bala de banana (3 unidades, 78g)', qty: 1, kcal: 162, carbs: 39, sugars: 33, protein: 0, fat: 0, satFat: 0, transFat: 0, fiber: 0, sodium: 0 },
      ],
    },
    {
      nome: 'R2 · Café da manhã — Mussarela (08:00)',
      horario: '08:00',
      itens: [
        { foodName: 'Tapioca (goma hidratada) 50g', qty: 1, kcal: 89, carbs: 22, sugars: 0.2, protein: 0.1, fat: 0, satFat: 0, transFat: 0, fiber: 0.3, sodium: 1 },
        { foodName: 'Mel 15g', qty: 1, kcal: 45.8, carbs: 12.4, sugars: 12.3, protein: 0.1, fat: 0, satFat: 0, transFat: 0, fiber: 0, sodium: 0.8 },
        { foodName: 'Ovo 100g (2 unidades)', qty: 1, kcal: 146, carbs: 0.6, sugars: 0.6, protein: 13.4, fat: 9.6, satFat: 2.8, transFat: 0, fiber: 0, sodium: 146 },
        { foodName: 'Queijo mussarela 30g', qty: 1, kcal: 90, carbs: 0.6, sugars: 0.6, protein: 6.6, fat: 6.9, satFat: 4.1, transFat: 0, fiber: 0, sodium: 176 },
      ],
    },
    {
      nome: 'R2 · Café da manhã — Queijo branco (08:00)',
      horario: '08:00',
      itens: [
        { foodName: 'Tapioca (goma hidratada) 50g', qty: 1, kcal: 89, carbs: 22, sugars: 0.2, protein: 0.1, fat: 0, satFat: 0, transFat: 0, fiber: 0.3, sodium: 1 },
        { foodName: 'Mel 15g', qty: 1, kcal: 45.8, carbs: 12.4, sugars: 12.3, protein: 0.1, fat: 0, satFat: 0, transFat: 0, fiber: 0, sodium: 0.8 },
        { foodName: 'Ovo 100g (2 unidades)', qty: 1, kcal: 146, carbs: 0.6, sugars: 0.6, protein: 13.4, fat: 9.6, satFat: 2.8, transFat: 0, fiber: 0, sodium: 146 },
        { foodName: 'Queijo branco (minas frescal) 30g', qty: 1, kcal: 87, carbs: 1, sugars: 1, protein: 5.4, fat: 6.6, satFat: 4.2, transFat: 0, fiber: 0, sodium: 130 },
      ],
    },
    {
      // Ceviche é o PRATO INTEIRO na biblioteca (95 kcal / 15g de proteína por 100g): peixe
      // cru diluído em cebola, limão e tempero. Por isso 300g aqui rendem 45g de proteína,
      // enquanto 300g de tilápia grelhada renderiam 79g. A porção parece grande no papel e é
      // uma travessa normal na mesa.
      //
      // Sódio: 350mg por 100g na biblioteca, então 300g já são 1050mg — sozinho, mais da
      // metade do dia. Se salgar por cima, passa. É o ponto fraco desta variante.
      nome: 'R3 · Almoço — Ceviche e batata assada (12:30)',
      horario: '12:30',
      itens: [
        { foodName: 'Ceviche de tilápia 300g', qty: 1, kcal: 285, carbs: 13.5, sugars: 4.5, protein: 45, fat: 5.4, satFat: 1.2, transFat: 0, fiber: 1.8, sodium: 1050 },
        { foodName: 'Batata inglesa assada 225g', qty: 1, kcal: 209.3, carbs: 47.3, sugars: 2.7, protein: 5.6, fat: 0.2, satFat: 0, transFat: 0, fiber: 5, sodium: 11.3 },
        { foodName: 'Brócolis cozido 100g', qty: 1, kcal: 25, carbs: 4.4, sugars: 0, protein: 2.1, fat: 0.5, satFat: 0.1, transFat: 0, fiber: 3.4, sodium: 10 },
        { foodName: 'Cenoura cozida 80g', qty: 1, kcal: 24, carbs: 5, sugars: 3.2, protein: 0.6, fat: 0.2, satFat: 0, transFat: 0, fiber: 2.3, sodium: 28 },
      ],
    },
    {
      nome: 'R3 · Almoço — Ceviche, arroz e feijão (12:30)',
      horario: '12:30',
      itens: [
        { foodName: 'Ceviche de tilápia 250g', qty: 1, kcal: 237.5, carbs: 11.3, sugars: 3.8, protein: 37.5, fat: 4.5, satFat: 1, transFat: 0, fiber: 1.5, sodium: 875 },
        { foodName: 'Arroz branco cozido 130g', qty: 1, kcal: 166.4, carbs: 36.4, sugars: 0, protein: 3.3, fat: 0.3, satFat: 0, transFat: 0, fiber: 0.5, sodium: 1.3 },
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
        { foodName: 'Batata inglesa assada 250g', qty: 1, kcal: 232.5, carbs: 52.5, sugars: 3, protein: 6.3, fat: 0.3, satFat: 0, transFat: 0, fiber: 5.5, sodium: 12.5 },
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
        { foodName: 'Banana nanica (1 unidade, 120g)', qty: 1, kcal: 110, carbs: 28.6, sugars: 20, protein: 1.7, fat: 0.1, satFat: 0, transFat: 0, fiber: 2.3, sodium: 1 },
        { foodName: 'Aveia em flocos 20g', qty: 1, kcal: 78, carbs: 13.3, sugars: 0.3, protein: 2.8, fat: 1.5, satFat: 0.3, transFat: 0, fiber: 2, sodium: 1.3 },
      ],
    },
    {
      // Pesos em COZIDO de propósito: ele cozinha pra duas pessoas, então o peso cru é da
      // panela inteira e não da porção. Batata cozida e assada têm valores diferentes por
      // rendimento (100g crua vira 123g cozida ou 69g assada), não por fonte — as duas
      // conservam as 64 kcal da batata crua.
      //
      // O azeite vai no cozimento e não dá pra medir por marmita; 8g é estimativa
      // deliberadamente generosa pra dourar 400g de batata. Errar pra cima aqui é o lado
      // seguro: o problema atual é peso parado com 1875 kcal registradas.
      nome: 'R5 · Jantar — Marmita tilápia, batata e brócolis (20:00)',
      horario: '20:00',
      itens: [
        { foodName: 'Tilápia grelhada 200g', qty: 1, kcal: 256, carbs: 0, sugars: 0, protein: 52.4, fat: 5.4, satFat: 1.8, transFat: 0, fiber: 0, sodium: 112 },
        { foodName: 'Batata inglesa cozida 400g', qty: 1, kcal: 208, carbs: 47.6, sugars: 3.2, protein: 4.8, fat: 0, satFat: 0, transFat: 0, fiber: 5.2, sodium: 8 },
        { foodName: 'Brócolis cozido 100g', qty: 1, kcal: 25, carbs: 4.4, sugars: 0, protein: 2.1, fat: 0.5, satFat: 0.1, transFat: 0, fiber: 3.4, sodium: 10 },
        { foodName: 'Azeite de oliva 8g (do cozimento)', qty: 1, kcal: 73.2, carbs: 0, sugars: 0, protein: 0, fat: 8.3, satFat: 1.2, transFat: 0, fiber: 0, sodium: 0 },
      ],
    },
  ],
};
