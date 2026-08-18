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
// Cardápio: mesma estrutura de 5 refeições/horários do plano do Matheus (facilita manter o
// hábito já formado). Ajustado em 18/08/2026 a pedido do Victor: sem tapioca às 5h30
// (impraticável nesse horário) e sem azeite (difícil de controlar a colher). Isso tira a
// principal fonte de gordura adicionada do cardápio — a meta abaixo foi baixada pra bater
// com o que essas refeições realmente entregam (1830 kcal / 170P / 197C / 42G), em vez de
// manter uma meta de 2210/71g de gordura que a comida sugerida não alcança mais. Resultado:
// um déficit maior que o originalmente calculado (~920 kcal/dia vs TDEE de ~2750, mais perto
// de 1%/semana do peso do que os 0,4-0,5%/semana visados) — vale reavaliar se um lanche fixo
// de gordura fácil de contar (ex: um sachê de castanhas) entra pra fechar a conta original.
const META_VICTOR = {
  fonte: 'meta-victor-ea-2026-08-18',
  meta: {
    nome: 'Meta própria — disponibilidade energética (18/08/2026)',
    kcal: 1830,
    protein: 170,
    carb: 197,
    fat: 42,
  },
  baseCalculo: [
    'TMB (Katch-McArdle, massa magra medida 68,4kg): ~1847 kcal.',
    'TDEE reconstruído (TMB + exercício últimas 8 semanas ~380 + efeito térmico ~240 + NEAT 250-400): ~2650-2870 kcal — perto do 2780 que o Matheus tinha calculado.',
    'Ingestão real implícita pelo peso (85,3→83,7kg em 162 dias, déficit real de ~76 kcal/dia): ~2670 kcal/dia — a maior parte disso nos dias que saem da dieta.',
    'Meta original pensada pra ser o piso dos dias "fora da linha" (2210 kcal / 71g gordura), sem apertar os 4 dias que já funcionam: ~0,4-0,5% do peso/semana, faixa que preserva massa magra em déficit (Garthe et al. 2011).',
    'Proteína 1,8-2,2 g/kg (Helms et al. 2014) — 170-177g bate perto da prescrição do Matheus (172,9g) e da regra do vídeo do Leandro Twin (168g).',
    'Ajuste de 18/08: sem tapioca às 5h30 e sem azeite (difícil de controlar a colher) — o cardápio ficou com bem menos gordura, e a meta foi baixada pra 1830 kcal / 42g de gordura pra bater com o que ele realmente entrega. Isso é um déficit mais acentuado que o originalmente calculado (~1%/semana em vez de 0,4-0,5%) — considerar um lanche de gordura fácil de contar (castanhas em sachê, por ex.) se quiser voltar pro ritmo mais lento.',
  ],
  disclaimer: 'Estimativa própria a partir dos dados registrados no app, feita em conversa com IA — não é prescrição de nutricionista nem substitui avaliação profissional. Recalibrar depois dos 14 dias de registro completo.',
  combos: [
    {
      nome: 'R1 · Pré-treino (05:30)',
      horario: '05:30',
      itens: [
        { foodName: 'Paçoca (vaga da pasta de amendoim 25g)', qty: 1, kcal: 153, carbs: 5, sugars: 4.2, protein: 6.8, fat: 11.8, satFat: 2.2, transFat: 0, fiber: 1.8, sodium: 45 },
        // Sem tapioca às 5h30 (pedido do Victor, 18/08) — só a paçoquita como adição.
        { foodName: 'Paçoquita', qty: 2, kcal: 160, carbs: 15, sugars: 14.4, protein: 5.4, fat: 8.4, satFat: 1.2, transFat: 0, fiber: 1.2, sodium: 56 },
      ],
    },
    {
      nome: 'R2 · Café da manhã (08:00)',
      horario: '08:00',
      itens: [
        // Antes 30g (qty 0.6 da porção de 50g da biblioteca) — sobe pra porção cheia.
        { foodName: 'Tapioca 50g', qty: 1, kcal: 89, carbs: 22, sugars: 0.2, protein: 0.1, fat: 0, satFat: 0, transFat: 0, fiber: 0.3, sodium: 1 },
        { foodName: 'Mel 15g', qty: 0.75, kcal: 46, carbs: 12.4, sugars: 12.3, protein: 0.1, fat: 0, satFat: 0, transFat: 0, fiber: 0, sodium: 1 },
        { foodName: 'Ovo (2 unidades)', qty: 1, kcal: 145, carbs: 1.2, sugars: 1.2, protein: 12.6, fat: 10, satFat: 3.1, transFat: 0, fiber: 0, sodium: 140 },
        { foodName: 'Mussarela 15g', qty: 1, kcal: 48, carbs: 0.5, sugars: 0.5, protein: 3.8, fat: 3.4, satFat: 2.1, transFat: 0, fiber: 0, sodium: 88 },
      ],
    },
    {
      nome: 'R3 · Almoço (12:30)',
      horario: '12:30',
      itens: [
        // Pedido do Victor (18/08): batata inglesa ASSADA de verdade, peso já assado — sem
        // a equivalência arroz+feijão que exigia conversão. 300g é o ponto de partida.
        { foodName: 'Batata inglesa assada 300g', qty: 1, kcal: 279, carbs: 63, sugars: 3.6, protein: 7.5, fat: 0.3, satFat: 0, transFat: 0, fiber: 6.6, sodium: 15 },
        { foodName: 'Frango 150g (peso cozido)', qty: 1, kcal: 226, carbs: 0, sugars: 0, protein: 48, fat: 3.8, satFat: 1.1, transFat: 0, fiber: 0, sodium: 98 },
      ],
    },
    {
      nome: 'R4 · Whey (16:00)',
      horario: '16:00',
      itens: [
        { foodName: 'Whey concentrado 30g', qty: 1, kcal: 114, carbs: 4.5, sugars: 2, protein: 24, fat: 0, satFat: 0, transFat: 0, fiber: 0, sodium: 50 },
        { foodName: 'Leite desnatado 200ml', qty: 1, kcal: 64, carbs: 10, sugars: 10, protein: 6, fat: 0, satFat: 0, transFat: 0, fiber: 0, sodium: 80 },
      ],
    },
    {
      nome: 'R5 · Jantar (20:00)',
      horario: '20:00',
      itens: [
        { foodName: 'Batata inglesa assada 300g', qty: 1, kcal: 279, carbs: 63, sugars: 3.6, protein: 7.5, fat: 0.3, satFat: 0, transFat: 0, fiber: 6.6, sodium: 15 },
        { foodName: 'Tilápia 150g (peso cozido)', qty: 1, kcal: 226, carbs: 0, sugars: 0, protein: 48, fat: 3.8, satFat: 1.1, transFat: 0, fiber: 0, sodium: 84 },
      ],
    },
  ],
};
