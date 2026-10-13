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
// No segundo caso o déficit prometido (0,35 kg/semana) não acontece, e isso só aparece
// daqui a 3-4 semanas de balança parada. Vale olhar o peso antes de assumir que a fase 2
// está funcionando — a diferença entre as duas hipóteses é de 500 kcal/dia.
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
    'ATENÇÃO: a semana 1 existia pra medir se 2700 era manutenção ou superávit, e isso depende de ter peso medido no começo e no fim. Sem essa medida, não dá pra saber se 2350 é déficit de 350 ou quase manutenção — a diferença entre as duas hipóteses é de 500 kcal/dia, e um erro aí só aparece depois de 3-4 semanas de balança parada.',
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
