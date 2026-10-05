// Dieta prescrita pela NUTRICIONISTA (Gabrielle Rubio), recebida em 04/10/2026.
// Este arquivo mudou de natureza: até 31/08 ele guardava uma meta que EU calculei a partir
// dos registros do app. Agora guarda uma PRESCRIÇÃO profissional. O que eu faço aqui é
// transcrever e conferir a aritmética, não propor.
//
// ======================= O QUE MUDOU NO DIAGNÓSTICO =======================
//
// A nutricionista levantou a hipótese de PLATÔ e prescreveu voltar à manutenção antes de
// cortar: semana 1 normocalórica (~2700), semana 2 em diante em déficit (~2350).
//
// Eu tinha concluído, com 7 meses de dados, que não era platô — era déficit pequeno o tempo
// todo (gordura caindo 0,32 kg/mês na 1ª metade do período e 0,12 na 2ª). Estava analisando
// a janela errada. O histórico que ela tem e eu não tinha: ele saiu de MAIS DE 100 kg para
// 73 kg numa rotina alta de treinos, depois voltou para 85 e há anos não desce de 80. Perda
// grande seguida de reganho com piso resistente é o quadro em que a adaptação metabólica
// pós-perda é real e documentada (gasto 100-300 kcal abaixo do previsto, por anos).
// Nesse quadro, comer em manutenção antes de cortar é a conduta indicada.
//
// ======================= A CONTA DE QUE A PRESCRIÇÃO DEPENDE =======================
//
// Ela avisou que o plano depende dos dados estarem corretos. NÃO ESTÃO, e dá pra provar:
//
//   consumo médio nos dias completos do diário ........ 1652 kcal
//   gasto estimado (meu cálculo de baixo pra cima
//     e o número dela convergem) ...................... 2700 kcal
//   déficit implícito ................................. 1048 kcal/dia
//   perda de gordura que isso produziria em 204 dias .. 27,8 kg
//   perda de gordura MEDIDA ...........................  1,5 kg
//
// O diário prevê 18x mais perda do que a balança mediu. E não dá pra salvar a conta baixando
// o gasto: para o diário fechar, o TDEE teria que ser 1709 kcal/dia — 138 ABAIXO da TMB de
// 1847. Ninguém gasta menos que o próprio repouso.
//
// Sobra uma explicação só: com o peso quase parado, o consumo real tem que estar perto do
// gasto, ~2640 kcal/dia. São ~990 kcal/dia que não entram no diário, e o buraco tem
// endereço: 28 dos últimos 32 fins de semana em branco.
//
// CONSEQUÊNCIA PRÁTICA: a "normocalórica de 2700" quase certamente NÃO é um aumento — é
// perto do que ele já come. O ganho real do plano não é restaurar metabolismo, é trocar um
// padrão oscilante e invisível (1650 na semana, 3500+ no fim de semana) por um consistente
// e mensurável, com 180 g de proteína. Se a semana 1 não mudar a balança, isso NÃO confirma
// platô metabólico — confirma que 2700 era mesmo a manutenção.
//
// ======================= DUAS RESSALVAS =======================
//
// 1. NÃO HÁ REFEIÇÃO LIVRE na prescrição, e por isso 'refeicaoLivre' está null. Foi
//    exatamente esse buraco que estragou o ciclo de 18/08: o alvo não previa livre, ele
//    manteve o hábito, e as duas livres (2859 e 2689 kcal) caíram inteiras por cima de um
//    alvo sem espaço pra elas. Precisa ser combinado com ela, não inventado aqui.
// 2. A SATURADA SUBIU em termos absolutos: 19,4 g/dia contra os 10,4-11,2 do ciclo anterior,
//    porque a dieta é maior. Como % das calorias ela CAIU, de 11-12% (o que ele comia de
//    fato) para 6,6%, abaixo do teto de 10%. Vale acompanhar mesmo assim: o LDL dele foi
//    101 -> 111 -> 120 -> 137 e o HDL caiu de 54 para 38 em um ano.
//
// ======================= NOTA DE MANUTENÇÃO =======================
//
// O 'fonte' continua 'meta-victor-ea-2026-08-18' de propósito, apesar de o nome já não
// descrever o conteúdo: é a chave que o botão Recarregar usa pra SUBSTITUIR os combos
// antigos. Trocar a chave deixaria os 11 combos do ciclo anterior órfãos na biblioteca.
// Combos da prescrição do Matheus ('dieta-gorgoteam-2026-08-15') e os feitos à mão NÃO são
// tocados por este arquivo — esses saem pela tela de Combos, na mão.
const META_VICTOR = {
  fonte: 'meta-victor-ea-2026-08-18',
  meta: {
    nome: 'Nutri Gabrielle — Semana 1, normocalórica (04/10/2026)',
    kcal: 2700,
    protein: 180,
    carb: 340,
    fat: 70,
    fiber: 28,
  },
  // A prescrição não prevê refeição livre. Null é deliberado: inventar um valor aqui seria
  // repetir o erro de 18/08 pelo avesso. A combinar com a nutricionista.
  refeicaoLivre: null,
  kcalDiaNormal: 2700,
  disclaimer: 'Prescrição da nutricionista Gabrielle Rubio (04/10/2026). Semana 1 é normocalórica; da semana 2 em diante o alvo cai para ~2350 kcal. Os combos abaixo são a transcrição do cardápio dela, com os valores calculados sobre a biblioteca do app.',
  baseCalculo: [
    'Alvo da semana 1: 2700 kcal (normocalórica). Semana 2 em diante: ~2350 kcal, déficit de ~380/dia = 0,35 kg de gordura por semana.',
    'Cardápio transcrito dá 2633 kcal, P 180, C 340, G 66, fibra 29 — 2% abaixo do alvo declarado, dentro das faixas do próprio cardápio (legumes 150-200g, "1 porção de fruta").',
    'Proteína em 2,15 g/kg de peso: faixa alta, adequada pra preservar massa magra no déficit que começa na semana 2.',
    'Convergência independente: meu cálculo de baixo pra cima (TMB Katch-McArdle de 1847 sobre massa magra medida de 68,4 kg, mais 255 kcal/dia de exercício tirados dos registros reais) dá ~2700, o mesmo número dela. O multiplicador automático do app, com atividade "intensa", daria 3186 — alto demais para 19 treinos em 25 dias.',
    'ATENÇÃO: o diário registra 1652 kcal/dia nos dias completos, o que é incompatível com peso estável e TMB de 1847. O consumo real está perto de 2640. Faltam ~990 kcal/dia de registro, concentradas nos fins de semana.',
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
          "foodName": "Tapioca (goma hidratada) 80g",
          "qty": 1,
          "kcal": 142.4,
          "carbs": 35.2,
          "sugars": 0.3,
          "protein": 0.2,
          "fat": 0,
          "satFat": 0,
          "transFat": 0,
          "fiber": 0.5,
          "sodium": 1.6
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
          "foodName": "Queijo minas frescal 40g",
          "qty": 1,
          "kcal": 116,
          "carbs": 1.3,
          "sugars": 1.3,
          "protein": 7.2,
          "fat": 8.8,
          "satFat": 5.6,
          "transFat": 0,
          "fiber": 0,
          "sodium": 173.3
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
        },
        {
          "foodName": "Mel de abelha 15g",
          "qty": 1,
          "kcal": 38.3,
          "carbs": 11,
          "sugars": 11,
          "protein": 0.1,
          "fat": 0,
          "satFat": 0,
          "transFat": 0,
          "fiber": 0.1,
          "sodium": 2.3
        }
      ]
    },
    {
      "nome": "R2 · Café/pós-treino — Mussarela e mamão (08:00)",
      "horario": "08:00",
      "itens": [
        {
          "foodName": "Tapioca (goma hidratada) 80g",
          "qty": 1,
          "kcal": 142.4,
          "carbs": 35.2,
          "sugars": 0.3,
          "protein": 0.2,
          "fat": 0,
          "satFat": 0,
          "transFat": 0,
          "fiber": 0.5,
          "sodium": 1.6
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
          "foodName": "Queijo mussarela 40g",
          "qty": 1,
          "kcal": 120,
          "carbs": 0.8,
          "sugars": 0.8,
          "protein": 8.8,
          "fat": 9.2,
          "satFat": 5.5,
          "transFat": 0,
          "fiber": 0,
          "sodium": 234.6
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
        },
        {
          "foodName": "Mel de abelha 15g",
          "qty": 1,
          "kcal": 38.3,
          "carbs": 11,
          "sugars": 11,
          "protein": 0.1,
          "fat": 0,
          "satFat": 0,
          "transFat": 0,
          "fiber": 0.1,
          "sodium": 2.3
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
          "foodName": "Arroz branco cozido 200g",
          "qty": 1,
          "kcal": 256,
          "carbs": 56,
          "sugars": 0,
          "protein": 5,
          "fat": 0.4,
          "satFat": 0,
          "transFat": 0,
          "fiber": 0.8,
          "sodium": 2
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
          "foodName": "Azeite de oliva 10g",
          "qty": 1,
          "kcal": 91.5,
          "carbs": 0,
          "sugars": 0,
          "protein": 0,
          "fat": 10.4,
          "satFat": 1.5,
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
          "foodName": "Arroz branco cozido 200g",
          "qty": 1,
          "kcal": 256,
          "carbs": 56,
          "sugars": 0,
          "protein": 5,
          "fat": 0.4,
          "satFat": 0,
          "transFat": 0,
          "fiber": 0.8,
          "sodium": 2
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
          "foodName": "Azeite de oliva 10g",
          "qty": 1,
          "kcal": 91.5,
          "carbs": 0,
          "sugars": 0,
          "protein": 0,
          "fat": 10.4,
          "satFat": 1.5,
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
          "foodName": "Arroz branco cozido 200g",
          "qty": 1,
          "kcal": 256,
          "carbs": 56,
          "sugars": 0,
          "protein": 5,
          "fat": 0.4,
          "satFat": 0,
          "transFat": 0,
          "fiber": 0.8,
          "sodium": 2
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
          "foodName": "Azeite de oliva 10g",
          "qty": 1,
          "kcal": 91.5,
          "carbs": 0,
          "sugars": 0,
          "protein": 0,
          "fat": 10.4,
          "satFat": 1.5,
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
          "foodName": "Arroz branco cozido 200g",
          "qty": 1,
          "kcal": 256,
          "carbs": 56,
          "sugars": 0,
          "protein": 5,
          "fat": 0.4,
          "satFat": 0,
          "transFat": 0,
          "fiber": 0.8,
          "sodium": 2
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
          "foodName": "Azeite de oliva 10g",
          "qty": 1,
          "kcal": 91.5,
          "carbs": 0,
          "sugars": 0,
          "protein": 0,
          "fat": 10.4,
          "satFat": 1.5,
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
          "foodName": "Farelo de aveia 20g",
          "qty": 1,
          "kcal": 73.3,
          "carbs": 11.5,
          "sugars": 0.3,
          "protein": 3.1,
          "fat": 1.6,
          "satFat": 0.3,
          "transFat": 0,
          "fiber": 2,
          "sodium": 0.7
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
          "foodName": "Arroz branco cozido 180g",
          "qty": 1,
          "kcal": 230.4,
          "carbs": 50.4,
          "sugars": 0,
          "protein": 4.5,
          "fat": 0.4,
          "satFat": 0,
          "transFat": 0,
          "fiber": 0.7,
          "sodium": 1.8
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
          "foodName": "Azeite de oliva 10g",
          "qty": 1,
          "kcal": 91.5,
          "carbs": 0,
          "sugars": 0,
          "protein": 0,
          "fat": 10.4,
          "satFat": 1.5,
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
          "foodName": "Arroz branco cozido 180g",
          "qty": 1,
          "kcal": 230.4,
          "carbs": 50.4,
          "sugars": 0,
          "protein": 4.5,
          "fat": 0.4,
          "satFat": 0,
          "transFat": 0,
          "fiber": 0.7,
          "sodium": 1.8
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
          "foodName": "Azeite de oliva 10g",
          "qty": 1,
          "kcal": 91.5,
          "carbs": 0,
          "sugars": 0,
          "protein": 0,
          "fat": 10.4,
          "satFat": 1.5,
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
          "foodName": "Arroz branco cozido 180g",
          "qty": 1,
          "kcal": 230.4,
          "carbs": 50.4,
          "sugars": 0,
          "protein": 4.5,
          "fat": 0.4,
          "satFat": 0,
          "transFat": 0,
          "fiber": 0.7,
          "sodium": 1.8
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
          "foodName": "Azeite de oliva 10g",
          "qty": 1,
          "kcal": 91.5,
          "carbs": 0,
          "sugars": 0,
          "protein": 0,
          "fat": 10.4,
          "satFat": 1.5,
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
