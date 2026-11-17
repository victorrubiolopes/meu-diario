// Dieta prescrita pela NUTRICIONISTA (Gabrielle Rubio) — SEMANA 2 EM DIANTE, em déficit.
// Transcrita em 13/10/2026, quando o Victor entrou na segunda fase. O cardápio das duas
// semanas veio junto, em 04/10; o que estava aqui até agora era a semana 1.
// O que eu faço neste arquivo é transcrever e conferir a aritmética, não propor.
//
// ======================= O QUE MUDA DA SEMANA 1 PRA CÁ =======================
//
// A estrutura é a mesma (6 refeições, mesmos horários, mesmas opções de proteína e fruta).
// Só as quantidades caem:
//
//   café ...... tapioca 80 -> 60 g | queijo 40 -> 30 g | MEL (15 g) SAI
//   almoço .... arroz 200 -> 150 g | azeite 10 -> 8 g
//   lanche .... farelo de aveia 20 -> 15 g
//   jantar .... arroz 180 -> 125 g | azeite 10 -> 5 g | fruta vira "se necessário"
//
// Pré-treino e lanche da manhã ficam iguais.
//
//   dia típico semana 1 ... 2633 kcal | P 180 | C 340 | G 66 | sat 19,4 | fibra 29
//   dia típico semana 2 ... 2313 kcal | P 174 | C 288 | G 56 | sat 16,8 | fibra 28
//                           -320 kcal, e a proteína quase intacta (-6 g)
//
// O corte é quase todo em carboidrato e gordura, que é o desenho certo pra um déficit:
// preserva a proteína (2,08 g/kg) e com ela a massa magra. A saturada também caiu, de
// 19,4 para 16,8 g — relevante porque o LDL dele foi 101 -> 111 -> 120 -> 137 em um ano,
// com HDL caindo de 54 para 38.
//
// ======================= A FRUTA DO JANTAR =======================
//
// O cardápio diz "1 porção de fruta, se necessário" no jantar. ELA ESTÁ DENTRO dos combos,
// e isso é uma decisão, não um descuido:
//
//   sem a fruta no jantar ... 2203 kcal (-147 do alvo, -6%)
//   com a fruta no jantar ... 2313 kcal ( -37 do alvo, -1,6%)
//
// Com ela, seguir o combo é seguir a prescrição no número que a nutri declarou. Sem ela, o
// déficit fica mais agressivo do que o planejado (0,45 kg/semana em vez de 0,35). Então o
// padrão é COM, e a banana do jantar é a primeira coisa a tirar num dia de menos fome —
// é literalmente o item que ela marcou como opcional.
//
// ======================= A CONTA QUE A SEMANA 1 DEVIA TER MEDIDO =======================
//
// A semana 1 existia pra responder uma pergunta: 2700 era manutenção ou superávit? A
// resposta sai da balança, e dependia de ter peso medido no começo e no fim.
//
//   se o gasto real for 2700 .. peso estável na semana 1, e 2350 agora dá -350/dia
//   se o gasto real for ~2200 . peso SUBIU na semana 1, e 2350 agora é quase manutenção
//
// RESPONDIDA EM 17/11/2026, por outro caminho: exportação do relógio (Garmin) + backup do
// app. É a SEGUNDA hipótese. Ver o bloco abaixo.
//
// ======================= MEDIDO EM 17/11/2026 =======================
//
// Três fontes que não se falam: 19 dias de atividade medida pelo relógio, 12 meses de
// VO₂máx, e o backup do app com 11 medições de composição corporal.
//
// GASTO TOTAL ~2360 kcal/dia, não 2700.
//   TMB 1792 (Mifflin-St Jeor: 84,5 kg, 1,74 m, 29 anos, masculino)
//   x 1,2  -> trabalho sentado o dia todo. ERA a maior incerteza desta conta, e foi MEDIDO
//             em 17/11 pela exportação de podômetro do Samsung (2446 dias desde 2020):
//               NEAT 127 (mediana dos 10 dias sem treino em 93) + TEF 230 (10% de 2300)
//               sobre TMB 1792 = 2149, ou seja fator 1,199 contra o 1,200 assumido.
//             Diferença de 2 kcal/dia no TDEE. A suposição se confirmou.
//             De quebra: mediana de 4686 passos/dia nos últimos 90 dias, abaixo do corte
//             de 5000 que classifica sedentário, e caindo ano a ano (7806 em 2024, 7079
//             em 2025, 5455 em 2026). Os 34 min/dia de treino não compensam as outras
//             15 horas acordado.
//             CUIDADO ao usar passos pra datar a bike. Eu escrevi aqui que "pedalar não
//             gera passo" e isso é firme demais: relógio de pulso costuma contar passo
//             fantasma pedalando (vibração e movimento de braço), e este arquivo classifica
//             TODO passo como caminhada ou corrida — não existe terceira categoria, então
//             passo fantasma de bike entraria mudo dentro de "caminhada". Conferido: a soma
//             caminhada+corrida fecha o total em 100% dos dias. Logo, passos não datam nem
//             descartam a bike.
//   + 210  -> o que o treino REALMENTE adiciona, medido: 20 atividades em 19 dias,
//             647 min, 4799 kcal brutas, menos o basal das sessões. São 34 min/dia.
//   = 2361
//   Confere com a balança: -1,7 kg em 204 dias = -64 kcal/dia de saldo, o que põe o
//   consumo real em ~2297. Duas rotas independentes.
//
//   >>> LOGO: 2350 É MANUTENÇÃO, não déficit de 350. O déficit prometido de 0,35 kg/semana
//   não acontece com essa prescrição sozinha. Isso é medição, não proposta — a decisão de
//   o que fazer com ela é da nutricionista.
//
//   Por que o multiplicador errava 730 kcal: "Intenso (6-7x/semana)" (1,725) dá 3092. Ele
//   treina 6x por semana, então o rótulo encaixa. Mas o multiplicador não mede frequência,
//   mede custo — e 34 min/dia de esforço moderado custam pouco. O gasto medido cai entre
//   'sedentário' (2151) e 'leve' (2465). O perfil dele já foi corrigido pra 'leve'.
//
// SUB-REGISTRO DE 36%.
//   consumo real implícito .. 2297 kcal/dia (gasto 2361 menos o saldo da balança)
//   registrado no app ....... 1475 kcal/dia (66 dias com registro, 05/03 a 25/09)
//   diferença ............... 821 kcal/dia
//   E isso só nos dias COM registro: 139 dos 205 dias do período não têm nada. A fase 2
//   tem 7 dias registrados de 36 (19%), e nada depois de 23/10.
//   Em 05/10 este arquivo estimou 20-30% de sub-registro. O medido é 36%: direção certa,
//   magnitude baixa. Qualquer leitura de adesão pelo app precisa deste fator.
//
// A COMPOSIÇÃO ESTÁ INDO BEM, e isso é o que a prescrição tem de mérito.
//   05/03: 85,3 kg, 19,6% -> 16,7 kg de gordura, 68,6 de magra
//   25/09: 83,6 kg, 18,2% -> 15,2 kg de gordura, 68,4 de magra
//   -1,5 kg de gordura contra -0,2 de magra: 88% da perda foi gordura. Lento
//   (0,24 kg/mês) mas da qualidade certa, e o percentual de gordura cai de forma
//   monotônica nas 11 medições. A proteína alta está fazendo o trabalho dela.
//
// ======================= A BIKE: O FATO QUE FALTAVA AQUI =======================
//
// Em 2024 o trabalho do Victor mudou pra mais longe e ele passou a ir e voltar de bicicleta
// — 13 km cada trecho (26 km/dia, ~35 min por trecho, 22,3 km/h), 5x por semana. No começo
// de 2025 parou e passou a ir de carro. ESTE FATO NÃO ESTAVA ESCRITO EM LUGAR NENHUM do
// projeto até 17/11/2026, e a falta dele me levou a uma conclusão errada: eu vi a queda do
// VO₂máx, não tinha a causa, e inferi ganho de peso que o backup desmente.
//
//   26 km a 22,3 km/h = 8 MET (Compêndio, faixa 12-13,9 mph)
//   70 min x 7 MET líquidos x 84,5 kg = ~690 kcal líquidas por dia de bike
//   a 5x/semana isso era ~490 kcal/dia na média. Foi a maior mudança de gasto do período.
//
// O podômetro bate com a data: 2024 é o pico da série inteira (7806 passos/dia de mediana,
// contra 4381 em 2023 e 5455 em 2026). Não PROVA a bike, pelo motivo da nota de cuidado lá
// em cima, mas o degrau está no ano que ele descreve.
//
// ======================= O VO₂MÁX: NÃO ATRIBUÍDO =======================
//
// O VO₂máx caiu 52,6 -> 49,2 mL/kg/min em 12 meses, sem uma reversão. Como o peso CAIU no
// período, a capacidade absoluta caiu mais do que o número por quilo sugere: 4,35 -> 4,13
// L/min (-5%). A QUEDA É REAL; a CAUSA é que não está estabelecida.
//
// Eu escrevi aqui, mais cedo em 17/11, que a bike "EXPLICA o VO₂máx". Retiro. Há pelo menos
// dois candidatos e eu não consigo separá-los:
//
//   1. a bike, que parou no começo de 2025;
//   2. o volume de CORRIDA, que desabou em 2026 — passos de corrida por dia caíram de
//      ~3000 (jan-mar) para ~100-600 (ago-nov). A correlação com o VO₂máx nos 12 meses em
//      que tenho os dois é r = 0,91.
//
// O 0,91 parece decisivo e NÃO é: o Victor usa o Garmin pra correr e o Samsung perde a
// maior parte dessas corridas. Conferido contra 5 corridas que o Garmin registrou entre
// 04/11 e 17/11: o Samsung viu 5349 de 21742 passos, 25% — e numa delas viu 9 passos contra
// 6662. Ou seja, parte do "desabou" é o aparelho, não o treino. Pra piorar, o período em que
// a série despenca (abr-mai/2026) coincide com uma troca de relógio Samsung.
//
// O que resolveria: volume de corrida pelo GARMIN (que é onde as corridas estão de fato),
// mês a mês, contra a mesma curva de VO₂máx. Até lá, não atribuir.
//
// RETOMADA da bike em dezembro/2026, 3x/semana: +296 kcal/dia na média, gasto vai a ~2660,
// e os 2350 viram déficit real de ~300/dia (1,2 kg/mês) SEM mexer na comida. Esse número é
// de gasto e não depende de nada acima — vale mesmo com a causa do VO₂máx em aberto.
//
// ======================= RESSALVA QUE CONTINUA DE PÉ =======================
//
// NÃO HÁ REFEIÇÃO LIVRE na prescrição, e 'refeicaoLivre' segue null. Foi esse buraco que
// estragou o ciclo de 18/08: o alvo não previa livre, o hábito continuou, e as duas livres
// registradas (2859 e 2689 kcal) caíram inteiras por cima de um alvo sem espaço pra elas.
// Num alvo de 2350 isso pesa MAIS que num de 2700. Precisa ser combinado com ela.
//
// ======================= NOTA DE MANUTENÇÃO =======================
//
// O 'fonte' continua 'meta-victor-ea-2026-08-18', apesar de o nome já não descrever nada:
// é a chave que o botão Recarregar usa pra SUBSTITUIR os combos da semana 1 pelos desta.
// Trocar a chave deixaria os 16 combos da semana 1 órfãos na biblioteca, convivendo com os
// novos — 32 refeições com nomes iguais e quantidades diferentes. Combos feitos à mão não
// são tocados por este arquivo.
const META_VICTOR = {
  fonte: 'meta-victor-ea-2026-08-18',
  // Mesmo campo que DIETA_VICTOR usa. É o que identifica os combos na tela de Combos: o
  // 'fonte' nunca aparece pro usuário, e sem isso as 16 refeições dela ficavam visualmente
  // iguais às que o Victor montou na mão.
  profissional: 'Gabrielle Rubio',
  meta: {
    nome: 'Nutri Gabrielle — Semana 2+, déficit (13/10/2026)',
    kcal: 2350,
    protein: 175,
    carb: 288,
    fat: 56,
    fiber: 28,
  },
  // A prescrição não prevê refeição livre. Null é deliberado: inventar um valor aqui seria
  // repetir o erro de 18/08 pelo avesso. A combinar com a nutricionista.
  refeicaoLivre: null,
  kcalDiaNormal: 2350,
  disclaimer: 'Prescrição da nutricionista Gabrielle Rubio — fase 2, em déficit (transcrita em 13/10/2026). Mesma estrutura da semana 1 com as quantidades reduzidas: ~320 kcal a menos por dia, cortadas em carboidrato e gordura, com a proteína preservada em 2,1 g/kg. Os combos são a transcrição do cardápio dela, calculados sobre a biblioteca do app.',
  baseCalculo: [
    'Alvo da fase 2: ~2350 kcal (déficit de ~350/dia sobre uma manutenção estimada em 2700, o que daria ~0,35 kg de gordura por semana).',
    'Cardápio transcrito: dia de musculação dá 2313 kcal (P 174, C 288, G 56, fibra 28) e dia de corrida 2373 — 1,6% abaixo e 1,0% acima do alvo declarado, dentro das faixas do próprio cardápio (legumes 150-200g, "1 porção de fruta").',
    'O corte de 320 kcal em relação à semana 1 sai quase todo de carboidrato (-52 g) e gordura (-10 g). A proteína cai só 6 g e fica em 2,08 g/kg — é o desenho certo pra preservar massa magra em déficit.',
    'A fruta do jantar está marcada como "se necessário" no cardápio e ficou DENTRO dos combos: sem ela o dia dá 2203 kcal, um déficit de 0,45 kg/semana em vez dos 0,35 planejados. É o primeiro item a tirar num dia de menos fome.',
    'Saturada caiu de 19,4 para 16,8 g/dia (6,5% das calorias, bem abaixo do teto de 10%). Vale acompanhar: o LDL foi 101 -> 111 -> 120 -> 137 e o HDL caiu de 54 para 38 em um ano.',
    'MEDIDO EM 17/11: o gasto total é ~2360 kcal/dia, não 2700 — então 2350 é MANUTENÇÃO, e não déficit de 350. A conta: TMB 1792 (Mifflin, 84,5 kg, 1,74 m, 29 anos) x 1,2 (trabalho sentado o dia todo) + 210 kcal/dia que o treino realmente adiciona, medidos pelo relógio em 19 dias (20 atividades, 647 min, 34 min/dia). Confere com a balança por outro caminho: -1,7 kg em 204 dias são -64 kcal/dia de saldo. O multiplicador "Intenso (6-7x/semana)" dava 3092 e errava 730 kcal — ele treina 6x por semana, mas 34 min/dia de esforço moderado custam pouco. O fator 1,2 também foi MEDIDO, pela exportação de podômetro (2446 dias): deu 1,199, diferença de 2 kcal/dia.',
    'MOVIMENTAÇÃO DIÁRIA EM FAIXA SEDENTÁRIA: mediana de 4686 passos/dia nos últimos 90 dias, abaixo do corte de 5000. E caindo ano a ano: 7806 em 2024, 7079 em 2025, 5455 em 2026. Trabalho sentado o dia todo, e os 34 min/dia de treino não compensam as outras 15 horas acordado. É o maior espaço de ganho fora da dieta — e é exatamente o que a volta da bike ataca.',
    'MEDIDO EM 17/11: o diário sub-registra 821 kcal/dia, 36% do consumo real (registrado 1475 vs real ~2297), e isso só nos dias COM registro — 139 dos 205 dias não têm nada, e a fase 2 tem 7 dias de 36. Não é desleixo de quem anota: é o erro conhecido de registro alimentar (porção estimada a olho, óleo do preparo, bebida). Qualquer leitura de adesão por este app precisa desse fator.',
    'A COMPOSIÇÃO ESTÁ INDO BEM: de 05/03 a 25/09 o peso caiu 1,7 kg, dos quais 1,5 kg foram de GORDURA e só 0,2 kg de massa magra (19,6% -> 18,2%, queda monotônica nas 11 medições). É recomposição da qualidade certa, e a proteína alta da prescrição é o que está fazendo isso. O ritmo é que é lento: 0,24 kg/mês.',
    'A BIKE: em 2024 o trabalho mudou pra mais longe e ele passou a ir de bicicleta, 26 km/dia, 5x por semana; no começo de 2025 parou e passou a ir de carro. São ~690 kcal líquidas por dia de bike, ou ~490 kcal/dia na média — a maior mudança de gasto do período. O podômetro bate com a data: 2024 é o pico da série inteira (7806 passos/dia contra 4381 em 2023). Retomando 3x/semana em dezembro: +296 kcal/dia, gasto a ~2660, e os 2350 viram déficit de ~300/dia (1,2 kg/mês) sem mexer na comida.',
    'O VO₂MÁX CAIU, MAS A CAUSA NÃO ESTÁ ESTABELECIDA: de 52,6 para 49,2 mL/kg/min em 12 meses, sem reversão, e como o peso caiu a capacidade absoluta caiu mais (4,35 -> 4,13 L/min). A queda é real. Há dois candidatos que eu não consigo separar: a parada da bike no começo de 2025, e o volume de corrida, que desabou em 2026. Esta segunda hipótese tem correlação de 0,91 com a curva, o que parece decisivo e não é: ele corre com o Garmin, e o Samsung perdeu 75% dos passos de corrida numa amostra de 5 corridas conferidas. Para resolver, é preciso o volume de corrida pelo Garmin.',
  ],
  combos: [
    {
      "nome": "R1 · Pré-treino musculação — Paçoca (05:30)",
      "horario": "05:30",
      "itens": [
        {
          "foodName": "Paçoca 15g",
          "qty": 1,
          "kcal": 72,
          "carbs": 7.8,
          "sugars": 6.5,
          "protein": 1.9,
          "fat": 3.8,
          "satFat": 0.7,
          "transFat": 0,
          "fiber": 0.8,
          "sodium": 33.8
        }
      ]
    },
    {
      "nome": "R1 · Pré-treino corrida — Paçoca e banana (05:30)",
      "horario": "05:30",
      "itens": [
        {
          "foodName": "Paçoca 15g",
          "qty": 1,
          "kcal": 72,
          "carbs": 7.8,
          "sugars": 6.5,
          "protein": 1.9,
          "fat": 3.8,
          "satFat": 0.7,
          "transFat": 0,
          "fiber": 0.8,
          "sodium": 33.8
        },
        {
          "foodName": "Banana nanica 120g",
          "qty": 1,
          "kcal": 110,
          "carbs": 28.6,
          "sugars": 20,
          "protein": 1.7,
          "fat": 0.1,
          "satFat": 0,
          "transFat": 0,
          "fiber": 2.3,
          "sodium": 1
        }
      ]
    },
    {
      "nome": "R2 · Café/pós-treino — Queijo minas e banana (08:00)",
      "horario": "08:00",
      "itens": [
        {
          "foodName": "Tapioca (goma hidratada) 60g",
          "qty": 1,
          "kcal": 106.8,
          "carbs": 26.4,
          "sugars": 0.2,
          "protein": 0.1,
          "fat": 0,
          "satFat": 0,
          "transFat": 0,
          "fiber": 0.4,
          "sodium": 1.2
        },
        {
          "foodName": "Ovo cozido 150g",
          "qty": 1,
          "kcal": 219,
          "carbs": 0.9,
          "sugars": 0.9,
          "protein": 20.1,
          "fat": 14.4,
          "satFat": 4.2,
          "transFat": 0,
          "fiber": 0,
          "sodium": 219
        },
        {
          "foodName": "Queijo minas frescal 30g",
          "qty": 1,
          "kcal": 87,
          "carbs": 1,
          "sugars": 1,
          "protein": 5.4,
          "fat": 6.6,
          "satFat": 4.2,
          "transFat": 0,
          "fiber": 0,
          "sodium": 130
        },
        {
          "foodName": "Banana nanica 120g",
          "qty": 1,
          "kcal": 110,
          "carbs": 28.6,
          "sugars": 20,
          "protein": 1.7,
          "fat": 0.1,
          "satFat": 0,
          "transFat": 0,
          "fiber": 2.3,
          "sodium": 1
        }
      ]
    },
    {
      "nome": "R2 · Café/pós-treino — Mussarela e mamão (08:00)",
      "horario": "08:00",
      "itens": [
        {
          "foodName": "Tapioca (goma hidratada) 60g",
          "qty": 1,
          "kcal": 106.8,
          "carbs": 26.4,
          "sugars": 0.2,
          "protein": 0.1,
          "fat": 0,
          "satFat": 0,
          "transFat": 0,
          "fiber": 0.4,
          "sodium": 1.2
        },
        {
          "foodName": "Ovo cozido 150g",
          "qty": 1,
          "kcal": 219,
          "carbs": 0.9,
          "sugars": 0.9,
          "protein": 20.1,
          "fat": 14.4,
          "satFat": 4.2,
          "transFat": 0,
          "fiber": 0,
          "sodium": 219
        },
        {
          "foodName": "Queijo mussarela 30g",
          "qty": 1,
          "kcal": 90,
          "carbs": 0.6,
          "sugars": 0.6,
          "protein": 6.6,
          "fat": 6.9,
          "satFat": 4.1,
          "transFat": 0,
          "fiber": 0,
          "sodium": 176
        },
        {
          "foodName": "Mamão 180g",
          "qty": 1,
          "kcal": 72,
          "carbs": 18,
          "sugars": 14,
          "protein": 1.1,
          "fat": 0.2,
          "satFat": 0,
          "transFat": 0,
          "fiber": 3.1,
          "sodium": 5.4
        }
      ]
    },
    {
      "nome": "R3 · Lanche da manhã — Banana (10:30)",
      "horario": "10:30",
      "itens": [
        {
          "foodName": "Banana nanica 120g",
          "qty": 1,
          "kcal": 110,
          "carbs": 28.6,
          "sugars": 20,
          "protein": 1.7,
          "fat": 0.1,
          "satFat": 0,
          "transFat": 0,
          "fiber": 2.3,
          "sodium": 1
        }
      ]
    },
    {
      "nome": "R3 · Lanche da manhã — Mamão (10:30)",
      "horario": "10:30",
      "itens": [
        {
          "foodName": "Mamão 200g",
          "qty": 1,
          "kcal": 80,
          "carbs": 20,
          "sugars": 15.6,
          "protein": 1.2,
          "fat": 0.2,
          "satFat": 0,
          "transFat": 0,
          "fiber": 3.4,
          "sodium": 6
        }
      ]
    },
    {
      "nome": "R3 · Lanche da manhã — Uva (10:30)",
      "horario": "10:30",
      "itens": [
        {
          "foodName": "Uva 150g",
          "qty": 1,
          "kcal": 79.5,
          "carbs": 20.9,
          "sugars": 19.5,
          "protein": 1,
          "fat": 0.3,
          "satFat": 0,
          "transFat": 0,
          "fiber": 1.4,
          "sodium": 3
        }
      ]
    },
    {
      "nome": "R3 · Lanche da manhã — Pera (10:30)",
      "horario": "10:30",
      "itens": [
        {
          "foodName": "Pera 130g",
          "qty": 1,
          "kcal": 68.9,
          "carbs": 17.9,
          "sugars": 12.7,
          "protein": 0.4,
          "fat": 0.1,
          "satFat": 0,
          "transFat": 0,
          "fiber": 3.6,
          "sodium": 1.3
        }
      ]
    },
    {
      "nome": "R4 · Almoço — Frango (12:30)",
      "horario": "12:30",
      "itens": [
        {
          "foodName": "Arroz branco cozido 150g",
          "qty": 1,
          "kcal": 192,
          "carbs": 42,
          "sugars": 0,
          "protein": 3.8,
          "fat": 0.3,
          "satFat": 0,
          "transFat": 0,
          "fiber": 0.6,
          "sodium": 1.5
        },
        {
          "foodName": "Peito de frango cozido 150g",
          "qty": 1,
          "kcal": 244.5,
          "carbs": 0,
          "sugars": 0,
          "protein": 47.3,
          "fat": 4.8,
          "satFat": 1.5,
          "transFat": 0,
          "fiber": 0,
          "sodium": 54
        },
        {
          "foodName": "Brócolis cozido 175g",
          "qty": 1,
          "kcal": 43.8,
          "carbs": 7.7,
          "sugars": 0,
          "protein": 3.7,
          "fat": 0.9,
          "satFat": 0.2,
          "transFat": 0,
          "fiber": 6,
          "sodium": 17.5
        },
        {
          "foodName": "Azeite de oliva 8g",
          "qty": 1,
          "kcal": 73.2,
          "carbs": 0,
          "sugars": 0,
          "protein": 0,
          "fat": 8.3,
          "satFat": 1.2,
          "transFat": 0,
          "fiber": 0,
          "sodium": 0
        },
        {
          "foodName": "Banana nanica 120g",
          "qty": 1,
          "kcal": 110,
          "carbs": 28.6,
          "sugars": 20,
          "protein": 1.7,
          "fat": 0.1,
          "satFat": 0,
          "transFat": 0,
          "fiber": 2.3,
          "sodium": 1
        }
      ]
    },
    {
      "nome": "R4 · Almoço — Ceviche (12:30)",
      "horario": "12:30",
      "itens": [
        {
          "foodName": "Arroz branco cozido 150g",
          "qty": 1,
          "kcal": 192,
          "carbs": 42,
          "sugars": 0,
          "protein": 3.8,
          "fat": 0.3,
          "satFat": 0,
          "transFat": 0,
          "fiber": 0.6,
          "sodium": 1.5
        },
        {
          "foodName": "Ceviche 150g",
          "qty": 1,
          "kcal": 142.5,
          "carbs": 6.8,
          "sugars": 2.3,
          "protein": 22.5,
          "fat": 2.7,
          "satFat": 0.6,
          "transFat": 0,
          "fiber": 0.9,
          "sodium": 525
        },
        {
          "foodName": "Brócolis cozido 175g",
          "qty": 1,
          "kcal": 43.8,
          "carbs": 7.7,
          "sugars": 0,
          "protein": 3.7,
          "fat": 0.9,
          "satFat": 0.2,
          "transFat": 0,
          "fiber": 6,
          "sodium": 17.5
        },
        {
          "foodName": "Azeite de oliva 8g",
          "qty": 1,
          "kcal": 73.2,
          "carbs": 0,
          "sugars": 0,
          "protein": 0,
          "fat": 8.3,
          "satFat": 1.2,
          "transFat": 0,
          "fiber": 0,
          "sodium": 0
        },
        {
          "foodName": "Banana nanica 120g",
          "qty": 1,
          "kcal": 110,
          "carbs": 28.6,
          "sugars": 20,
          "protein": 1.7,
          "fat": 0.1,
          "satFat": 0,
          "transFat": 0,
          "fiber": 2.3,
          "sodium": 1
        }
      ]
    },
    {
      "nome": "R4 · Almoço — Alcatra (12:30)",
      "horario": "12:30",
      "itens": [
        {
          "foodName": "Arroz branco cozido 150g",
          "qty": 1,
          "kcal": 192,
          "carbs": 42,
          "sugars": 0,
          "protein": 3.8,
          "fat": 0.3,
          "satFat": 0,
          "transFat": 0,
          "fiber": 0.6,
          "sodium": 1.5
        },
        {
          "foodName": "Miolo de alcatra grelhado 150g",
          "qty": 1,
          "kcal": 361.5,
          "carbs": 0,
          "sugars": 0,
          "protein": 47.8,
          "fat": 17.4,
          "satFat": 5.3,
          "transFat": 0,
          "fiber": 0,
          "sodium": 78
        },
        {
          "foodName": "Brócolis cozido 175g",
          "qty": 1,
          "kcal": 43.8,
          "carbs": 7.7,
          "sugars": 0,
          "protein": 3.7,
          "fat": 0.9,
          "satFat": 0.2,
          "transFat": 0,
          "fiber": 6,
          "sodium": 17.5
        },
        {
          "foodName": "Azeite de oliva 8g",
          "qty": 1,
          "kcal": 73.2,
          "carbs": 0,
          "sugars": 0,
          "protein": 0,
          "fat": 8.3,
          "satFat": 1.2,
          "transFat": 0,
          "fiber": 0,
          "sodium": 0
        },
        {
          "foodName": "Banana nanica 120g",
          "qty": 1,
          "kcal": 110,
          "carbs": 28.6,
          "sugars": 20,
          "protein": 1.7,
          "fat": 0.1,
          "satFat": 0,
          "transFat": 0,
          "fiber": 2.3,
          "sodium": 1
        }
      ]
    },
    {
      "nome": "R4 · Almoço — Tilápia (12:30)",
      "horario": "12:30",
      "itens": [
        {
          "foodName": "Arroz branco cozido 150g",
          "qty": 1,
          "kcal": 192,
          "carbs": 42,
          "sugars": 0,
          "protein": 3.8,
          "fat": 0.3,
          "satFat": 0,
          "transFat": 0,
          "fiber": 0.6,
          "sodium": 1.5
        },
        {
          "foodName": "Tilápia grelhada 150g",
          "qty": 1,
          "kcal": 192,
          "carbs": 0,
          "sugars": 0,
          "protein": 39.3,
          "fat": 4.1,
          "satFat": 1.4,
          "transFat": 0,
          "fiber": 0,
          "sodium": 84
        },
        {
          "foodName": "Brócolis cozido 175g",
          "qty": 1,
          "kcal": 43.8,
          "carbs": 7.7,
          "sugars": 0,
          "protein": 3.7,
          "fat": 0.9,
          "satFat": 0.2,
          "transFat": 0,
          "fiber": 6,
          "sodium": 17.5
        },
        {
          "foodName": "Azeite de oliva 8g",
          "qty": 1,
          "kcal": 73.2,
          "carbs": 0,
          "sugars": 0,
          "protein": 0,
          "fat": 8.3,
          "satFat": 1.2,
          "transFat": 0,
          "fiber": 0,
          "sodium": 0
        },
        {
          "foodName": "Banana nanica 120g",
          "qty": 1,
          "kcal": 110,
          "carbs": 28.6,
          "sugars": 20,
          "protein": 1.7,
          "fat": 0.1,
          "satFat": 0,
          "transFat": 0,
          "fiber": 2.3,
          "sodium": 1
        }
      ]
    },
    {
      "nome": "R5 · Lanche da tarde — Whey, aveia e banana (16:00)",
      "horario": "16:00",
      "itens": [
        {
          "foodName": "Whey protein (pó) 30g",
          "qty": 1,
          "kcal": 120,
          "carbs": 3,
          "sugars": 2,
          "protein": 24,
          "fat": 1.5,
          "satFat": 0.5,
          "transFat": 0,
          "fiber": 0,
          "sodium": 50
        },
        {
          "foodName": "Leite em pó integral 10g",
          "qty": 1,
          "kcal": 49.7,
          "carbs": 3.8,
          "sugars": 3.8,
          "protein": 2.5,
          "fat": 2.7,
          "satFat": 1.7,
          "transFat": 0.1,
          "fiber": 0,
          "sodium": 37
        },
        {
          "foodName": "Farelo de aveia 15g",
          "qty": 1,
          "kcal": 55,
          "carbs": 8.6,
          "sugars": 0.2,
          "protein": 2.3,
          "fat": 1.2,
          "satFat": 0.2,
          "transFat": 0,
          "fiber": 1.5,
          "sodium": 0.5
        },
        {
          "foodName": "Banana nanica 120g",
          "qty": 1,
          "kcal": 110,
          "carbs": 28.6,
          "sugars": 20,
          "protein": 1.7,
          "fat": 0.1,
          "satFat": 0,
          "transFat": 0,
          "fiber": 2.3,
          "sodium": 1
        }
      ]
    },
    {
      "nome": "R6 · Jantar — Frango (20:00)",
      "horario": "20:00",
      "itens": [
        {
          "foodName": "Arroz branco cozido 125g",
          "qty": 1,
          "kcal": 160,
          "carbs": 35,
          "sugars": 0,
          "protein": 3.1,
          "fat": 0.3,
          "satFat": 0,
          "transFat": 0,
          "fiber": 0.5,
          "sodium": 1.3
        },
        {
          "foodName": "Peito de frango cozido 150g",
          "qty": 1,
          "kcal": 244.5,
          "carbs": 0,
          "sugars": 0,
          "protein": 47.3,
          "fat": 4.8,
          "satFat": 1.5,
          "transFat": 0,
          "fiber": 0,
          "sodium": 54
        },
        {
          "foodName": "Brócolis cozido 200g",
          "qty": 1,
          "kcal": 50,
          "carbs": 8.8,
          "sugars": 0,
          "protein": 4.2,
          "fat": 1,
          "satFat": 0.2,
          "transFat": 0,
          "fiber": 6.8,
          "sodium": 20
        },
        {
          "foodName": "Azeite de oliva 5g",
          "qty": 1,
          "kcal": 45.8,
          "carbs": 0,
          "sugars": 0,
          "protein": 0,
          "fat": 5.2,
          "satFat": 0.7,
          "transFat": 0,
          "fiber": 0,
          "sodium": 0
        },
        {
          "foodName": "Banana nanica 120g",
          "qty": 1,
          "kcal": 110,
          "carbs": 28.6,
          "sugars": 20,
          "protein": 1.7,
          "fat": 0.1,
          "satFat": 0,
          "transFat": 0,
          "fiber": 2.3,
          "sodium": 1
        }
      ]
    },
    {
      "nome": "R6 · Jantar — Tilápia (20:00)",
      "horario": "20:00",
      "itens": [
        {
          "foodName": "Arroz branco cozido 125g",
          "qty": 1,
          "kcal": 160,
          "carbs": 35,
          "sugars": 0,
          "protein": 3.1,
          "fat": 0.3,
          "satFat": 0,
          "transFat": 0,
          "fiber": 0.5,
          "sodium": 1.3
        },
        {
          "foodName": "Tilápia grelhada 150g",
          "qty": 1,
          "kcal": 192,
          "carbs": 0,
          "sugars": 0,
          "protein": 39.3,
          "fat": 4.1,
          "satFat": 1.4,
          "transFat": 0,
          "fiber": 0,
          "sodium": 84
        },
        {
          "foodName": "Brócolis cozido 200g",
          "qty": 1,
          "kcal": 50,
          "carbs": 8.8,
          "sugars": 0,
          "protein": 4.2,
          "fat": 1,
          "satFat": 0.2,
          "transFat": 0,
          "fiber": 6.8,
          "sodium": 20
        },
        {
          "foodName": "Azeite de oliva 5g",
          "qty": 1,
          "kcal": 45.8,
          "carbs": 0,
          "sugars": 0,
          "protein": 0,
          "fat": 5.2,
          "satFat": 0.7,
          "transFat": 0,
          "fiber": 0,
          "sodium": 0
        },
        {
          "foodName": "Banana nanica 120g",
          "qty": 1,
          "kcal": 110,
          "carbs": 28.6,
          "sugars": 20,
          "protein": 1.7,
          "fat": 0.1,
          "satFat": 0,
          "transFat": 0,
          "fiber": 2.3,
          "sodium": 1
        }
      ]
    },
    {
      "nome": "R6 · Jantar — Alcatra (20:00)",
      "horario": "20:00",
      "itens": [
        {
          "foodName": "Arroz branco cozido 125g",
          "qty": 1,
          "kcal": 160,
          "carbs": 35,
          "sugars": 0,
          "protein": 3.1,
          "fat": 0.3,
          "satFat": 0,
          "transFat": 0,
          "fiber": 0.5,
          "sodium": 1.3
        },
        {
          "foodName": "Miolo de alcatra grelhado 150g",
          "qty": 1,
          "kcal": 361.5,
          "carbs": 0,
          "sugars": 0,
          "protein": 47.8,
          "fat": 17.4,
          "satFat": 5.3,
          "transFat": 0,
          "fiber": 0,
          "sodium": 78
        },
        {
          "foodName": "Brócolis cozido 200g",
          "qty": 1,
          "kcal": 50,
          "carbs": 8.8,
          "sugars": 0,
          "protein": 4.2,
          "fat": 1,
          "satFat": 0.2,
          "transFat": 0,
          "fiber": 6.8,
          "sodium": 20
        },
        {
          "foodName": "Azeite de oliva 5g",
          "qty": 1,
          "kcal": 45.8,
          "carbs": 0,
          "sugars": 0,
          "protein": 0,
          "fat": 5.2,
          "satFat": 0.7,
          "transFat": 0,
          "fiber": 0,
          "sodium": 0
        },
        {
          "foodName": "Banana nanica 120g",
          "qty": 1,
          "kcal": 110,
          "carbs": 28.6,
          "sugars": 20,
          "protein": 1.7,
          "fat": 0.1,
          "satFat": 0,
          "transFat": 0,
          "fiber": 2.3,
          "sodium": 1
        }
      ]
    }
  ],
};
