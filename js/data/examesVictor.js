// Exames de sangue do Victor, transcritos dos laudos em PDF (Sabin/Precision).
//
// Mesma ideia dos outros pacotes pessoais (dietaVictor, metaVictor, treinoMfit): é dado do
// dono do app, não semente pra todo mundo, então só aparece pra ele — a tela filtra por
// super-admin igual faz com a ficha de treino pessoal.
//
// Valores conferidos um a um contra o laudo. Onde o laudo não trouxe o marcador, a chave
// simplesmente não existe no objeto — nunca zero, senão viraria um ponto falso no gráfico.
const EXAMES_VICTOR = {
  fonte: 'exames-victor-sabin',
  exames: [
    {
      date: '2023-11-17',
      lab: 'Sabin/Precision',
      solicitante: 'Jessica Parisi Cysneiros Nunes (CRM-PE 20747)',
      valores: {
        colesterolTotal: 160, ldl: 101, hdl: 40, naoHdl: 120, vldl: 19, triglicerides: 95,
        glicose: 86, hba1c: 4.9,
        creatinina: 1.09, ureia: 34.2, rfg: 90, acidoUrico: 7.4,
        tgo: 39, tgp: 28, gamaGT: 20, fosfatase: 56,
        tsh: 2.56, t4livre: 1.06,
        estradiol: 30.2, lh: 3.79, prolactina: 8.2, cortisol: 13.3,
        vitaminaD: 23.6, b12: 306, ferro: 134, ferritina: 126.1,
        calcio: 9.5, sodio: 144, potassio: 3.9,
        hemoglobina: 14.2, hematocrito: 41.6, leucocitos: 3980, plaquetas: 215000,
      },
    },
    {
      date: '2024-10-03',
      lab: 'Sabin/Precision',
      solicitante: 'Naiana Gouveia de Melo (CRM-SP 171648)',
      valores: {
        colesterolTotal: 177, ldl: 111, hdl: 45, naoHdl: 132, vldl: 21, triglicerides: 107,
        glicose: 81, hba1c: 4.9,
        creatinina: 0.99, rfg: 90,
        tgo: 23, tgp: 27,
        tsh: 3.16, t4livre: 1.08,
        testoTotal: 647, testoLivre: 13.67, shbg: 35.2,
        vitaminaD: 27.5, b12: 376, acidoFolico: 11.04, ferro: 190, ferritina: 137.7,
        sodio: 143, potassio: 3.9,
        hemoglobina: 15.2, hematocrito: 43.7, leucocitos: 3990, plaquetas: 241000,
      },
    },
    {
      date: '2025-09-06',
      lab: 'Sabin/Precision',
      solicitante: 'Mariana Thomaz Bacchim (CRM-SP 157564)',
      valores: {
        // Não-HDL não vem impresso neste laudo: é colesterol total menos HDL (191 - 54).
        colesterolTotal: 191, ldl: 120, hdl: 54, naoHdl: 137, vldl: 17, triglicerides: 78,
        glicose: 94,
        creatinina: 1.04, rfg: 90,
        tgo: 22, tgp: 13,
        tsh: 3.39, t4livre: 1.23,
        vitaminaD: 36.0, b12: 463, acidoFolico: 10.13, ferro: 113, ferritina: 155.6,
        hemoglobina: 15.5, hematocrito: 43.8, leucocitos: 4310, plaquetas: 231000,
      },
    },
    {
      date: '2026-08-28',
      lab: 'Sabin/Precision',
      solicitante: 'Luisa de Oliveira Franca Teixeira (CRM-RJ 1384274)',
      valores: {
        colesterolTotal: 198, ldl: 137, hdl: 38, naoHdl: 160, vldl: 23, triglicerides: 110,
        glicose: 87, hba1c: 4.9,
        creatinina: 1.23, ureia: 38.1, rfg: 82, microalb: 3.3,
        tgo: 27, tgp: 33,
        tsh: 3.30, t4livre: 0.98,
        testoTotal: 640, testoLivre: 13.39, shbg: 35.7,
        vitaminaD: 32.0, b12: 515, ferro: 158, ferritina: 269.0,
        calcio: 9.4, sodio: 140, potassio: 4.5,
        hemoglobina: 15.9, hematocrito: 44.1, leucocitos: 5000, plaquetas: 227000,
      },
    },
  ],
};
