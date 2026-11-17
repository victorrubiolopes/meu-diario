// Treinos de corrida do Victor na MFIT Personal — recebidos em 17/11/2026.
// Mesmo modelo das fichas de musculação: pacote carregável que só aparece pro dono do app.
//
// ======================= O QUE ENTRA E O QUE NÃO ENTRA =======================
//
// A ficha tem 11 treinos numerados. Aqui estão 8: o 3, o 6 e o 9 são longões que o Victor
// faz com a esposa e pediu pra não subir. Os números dos que ficaram são os DA FICHA, com
// os buracos à vista — renumerar de 1 a 8 faria o app e o aplicativo da MFIT discordarem
// na hora de escolher o treino do dia, que é justamente quando confundir custa caro.
//
// ======================= RECUPERAÇÃO: PARADA OU CORRENDO =======================
//
// Regra que o Victor confirmou e que a ficha não escreve: recuperação marcada só com TEMPO
// é parada; onde a ficha dá distância ou ritmo ("600m fraco", "500 trote"), é correndo leve.
// Isso muda a natureza do treino e por isso está escrito em cada descrição — o 8 (10x 400m
// com 1'20" parado) e o 4 (25 minutos sem parar, trocando de ritmo) parecem irmãos na ficha
// e são estímulos bem diferentes.
//
// ======================= DISTÂNCIA E TEMPO FICAM NULOS =======================
//
// Nenhum treino declara total de distância ou tempo, e eu não estimo: num intervalado o
// total depende do aquecimento, do tamanho da recuperação e de quanto a pessoa aguentou. Um
// número inventado aqui viraria "meta do treino" na tela de registro. Com os dois nulos, o
// botão "Usar" não aparece e o Victor registra o que o relógio marcou — que é o certo.
const CORRIDA_MFIT = {
  fonte: 'corrida-mfit-2026-11-17',
  planos: [
    { nome: 'Corrida 1 · 3x (1 km + 400 m)', tipo: 'Intervalado longo', distanceKm: null, timeMin: null,
      descricao: 'Aquecimento 10 min Z1. Principal 3x: 1 km abaixo de 6:00/km, 2 min de recuperação PARADO; depois 400 m forte, 1 min PARADO. Final 5 min de trote leve.' },

    { nome: 'Corrida 2 · 10x 200 m', tipo: 'Intervalado curto', distanceKm: null, timeMin: null,
      descricao: 'Aquecimento 10 min Z1. Principal 10x 200 m com 1 min de recuperação PARADO entre os tiros. Final 5 min de trote leve.' },

    { nome: 'Corrida 4 · 15x 1′ + 10x 30″', tipo: 'Fartlek', distanceKm: null, timeMin: null,
      descricao: 'Aquecimento 10 min Z1. Principal 15x (1 min forte / 1 min fraco), depois 10x (30 s forte / 30 s fraco). Final 5 min de trote. ATENÇÃO: aqui a recuperação é CORRENDO leve, não parado — são 25 min seguidos de corrida trocando de ritmo.' },

    { nome: 'Corrida 5 · 10x 300 m', tipo: 'Intervalado curto', distanceKm: null, timeMin: null,
      descricao: 'Aquecimento 10 min Z1. Principal 10x 300 m com 1 min de recuperação PARADO. Final 5 min de trote leve.' },

    { nome: 'Corrida 7 · 2x pirâmide 500→200 m', tipo: 'Pirâmide', distanceKm: null, timeMin: null,
      descricao: 'Aquecimento 10 min Z1. Principal 2x a sequência: 500 m forte + 500 m trote; 400 m forte + 600 m fraco; 300 m forte + 200 m fraco; 200 m forte + 300 m fraco. Final 5 min de trote. Recuperação CORRENDO leve em todas. A ficha dá recuperações irregulares (500/600/200/300) — confirmar com a personal se é proposital.' },

    { nome: 'Corrida 8 · 10x 400 m', tipo: 'Intervalado curto', distanceKm: null, timeMin: null,
      descricao: 'Aquecimento 10 min Z1. Principal 10x 400 m forte com 1 min e 20 s de recuperação PARADO. Final 5 min de trote. É o mais duro da lista: recuperação curta e passiva em tiro longo.' },

    { nome: 'Corrida 10 · 3x (500 + 400 + 200 m)', tipo: 'Intervalado longo', distanceKm: null, timeMin: null,
      descricao: 'Aquecimento 10 min Z1. Principal 3x a sequência: 500 m forte com 1 min PARADO; 400 m forte com 30 s PARADO; 200 m forte com 1 min PARADO. Final 5 min de trote. A ficha escreve "parado" em todas as recuperações.' },

    { nome: 'Corrida 11 · 10x 500 m', tipo: 'Intervalado longo', distanceKm: null, timeMin: null,
      descricao: 'Aquecimento (a ficha não dá o tempo; nos outros treinos são 10 min Z1). Principal 10x 500 m com 1 min de recuperação PARADO. A ficha também não fecha com trote, ao contrário dos demais.' },
  ],
};

// Disponibiliza o pacote na tela Mais → Planos de Treino → Pacotes de corrida.
// pessoal: true o esconde de quem não é o dono do app — mesma regra das fichas de academia.
if (typeof CORRIDAS_PREDEFINIDAS !== 'undefined') {
  CORRIDAS_PREDEFINIDAS[CORRIDA_MFIT.fonte] = {
    label: 'MFIT Personal — Corrida (17/11/2026)',
    descricao: 'Oito treinos intervalados da MFIT, numerados como na ficha original (os longões 3, 6 e 9 ficaram de fora). Quase todos abrem com 10 min em Z1 e fecham com 5 min de trote. Distância e tempo ficam em branco de propósito: num intervalado o total depende do dia, então registre o que o relógio marcou.',
    planos: CORRIDA_MFIT.planos,
    pessoal: true,
  };
}
