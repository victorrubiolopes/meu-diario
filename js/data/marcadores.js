// Catálogo de marcadores de exame de sangue: nome, unidade, grupo e faixa de referência.
//
// As faixas são as do laboratório dos exames do Victor (Sabin/Precision, adulto MASCULINO) —
// e é justamente por isso que ficam aqui em vez de na tela: laboratório diferente publica
// faixa diferente, então cada valor guardado carrega o número, e a faixa é só a régua de
// leitura. Se a pessoa usar outro lab, o que muda é a régua, não o histórico.
//
// min/max nulo = a faixa é aberta daquele lado (ex: HDL só tem mínimo; LDL só tem máximo).
const MARCADORES_EXAME = [
  // ---- Lipídios ----
  { chave: 'colesterolTotal', nome: 'Colesterol total', unidade: 'mg/dL', grupo: 'Lipídios', min: null, max: 190 },
  { chave: 'ldl', nome: 'LDL', unidade: 'mg/dL', grupo: 'Lipídios', min: null, max: 130,
    obs: 'A meta de LDL depende do risco cardiovascular: 130 para risco baixo, mas 100 ou 70 se o médico classificar em risco maior.' },
  { chave: 'hdl', nome: 'HDL', unidade: 'mg/dL', grupo: 'Lipídios', min: 40, max: null,
    obs: 'Aqui quanto MAIOR melhor — é o único do grupo em que estar abaixo da faixa é o problema.' },
  { chave: 'naoHdl', nome: 'Não-HDL', unidade: 'mg/dL', grupo: 'Lipídios', min: null, max: 160,
    obs: 'Colesterol total menos HDL. Junta tudo que é aterogênico num número só.' },
  { chave: 'vldl', nome: 'VLDL', unidade: 'mg/dL', grupo: 'Lipídios', min: null, max: 30 },
  { chave: 'triglicerides', nome: 'Triglicérides', unidade: 'mg/dL', grupo: 'Lipídios', min: null, max: 150 },

  // ---- Glicemia ----
  { chave: 'glicose', nome: 'Glicose (jejum)', unidade: 'mg/dL', grupo: 'Glicemia', min: 60, max: 99 },
  { chave: 'hba1c', nome: 'Hemoglobina glicada', unidade: '%', grupo: 'Glicemia', min: null, max: 5.7,
    obs: 'Média dos últimos ~3 meses. Acima de 5,7% já é pré-diabetes.' },

  // ---- Rim ----
  { chave: 'creatinina', nome: 'Creatinina', unidade: 'mg/dL', grupo: 'Rim', min: 0.6, max: 1.3,
    obs: 'Vem do músculo: massa magra alta, treino pesado nos dias anteriores e suplementação de creatina elevam o valor sem doença renal. Sempre conte isso ao médico junto com o resultado.' },
  { chave: 'rfg', nome: 'Filtração glomerular (RFG)', unidade: 'mL/min/1,73m²', grupo: 'Rim', min: 60, max: null,
    obs: 'Quanto MAIOR melhor. O laboratório libera qualquer valor acima de 90 como ">90", então pontos em 90 podem ser o piso, não o valor real.' },
  { chave: 'ureia', nome: 'Ureia', unidade: 'mg/dL', grupo: 'Rim', min: 16.6, max: 48.5 },
  { chave: 'acidoUrico', nome: 'Ácido úrico', unidade: 'mg/dL', grupo: 'Rim', min: 3.7, max: 7.8 },
  { chave: 'microalb', nome: 'Microalbuminúria', unidade: 'mcg/mg creat.', grupo: 'Rim', min: null, max: 30,
    obs: 'Albumina na urina. É o marcador que costuma acusar dano renal de verdade, antes da creatinina.' },

  // ---- Fígado ----
  { chave: 'tgo', nome: 'TGO (AST)', unidade: 'U/L', grupo: 'Fígado', min: null, max: 40 },
  { chave: 'tgp', nome: 'TGP (ALT)', unidade: 'U/L', grupo: 'Fígado', min: null, max: 45 },
  { chave: 'gamaGT', nome: 'Gama GT', unidade: 'U/L', grupo: 'Fígado', min: null, max: 73 },
  { chave: 'fosfatase', nome: 'Fosfatase alcalina', unidade: 'U/L', grupo: 'Fígado', min: 40, max: 129 },

  // ---- Tireoide ----
  { chave: 'tsh', nome: 'TSH', unidade: 'µUI/mL', grupo: 'Tireoide', min: 0.35, max: 4.94 },
  { chave: 't4livre', nome: 'T4 livre', unidade: 'ng/dL', grupo: 'Tireoide', min: 0.75, max: 1.22 },

  // ---- Hormônios ----
  { chave: 'testoTotal', nome: 'Testosterona total', unidade: 'ng/dL', grupo: 'Hormônios', min: 240, max: 871 },
  { chave: 'testoLivre', nome: 'Testosterona livre', unidade: 'ng/dL', grupo: 'Hormônios', min: 3.5, max: 15.5 },
  { chave: 'shbg', nome: 'SHBG', unidade: 'nmol/L', grupo: 'Hormônios', min: 11.2, max: 78.1 },
  { chave: 'estradiol', nome: 'Estradiol', unidade: 'pg/mL', grupo: 'Hormônios', min: 11.3, max: 43.2 },
  { chave: 'lh', nome: 'LH', unidade: 'mUI/mL', grupo: 'Hormônios', min: 1.7, max: 8.6 },
  { chave: 'prolactina', nome: 'Prolactina', unidade: 'ng/mL', grupo: 'Hormônios', min: null, max: 15.2 },
  { chave: 'cortisol', nome: 'Cortisol (manhã)', unidade: 'mcg/dL', grupo: 'Hormônios', min: 5.3, max: 22.5 },

  // ---- Vitaminas e minerais ----
  { chave: 'vitaminaD', nome: 'Vitamina D (25-OH)', unidade: 'ng/mL', grupo: 'Vitaminas e minerais', min: 20, max: 60,
    obs: 'Abaixo de 20 é deficiência. Para atletas e idosos costuma-se mirar 30 a 60.' },
  { chave: 'b12', nome: 'Vitamina B12', unidade: 'pg/mL', grupo: 'Vitaminas e minerais', min: 181, max: 906 },
  { chave: 'acidoFolico', nome: 'Ácido fólico', unidade: 'ng/mL', grupo: 'Vitaminas e minerais', min: 3.37, max: null },
  { chave: 'ferro', nome: 'Ferro sérico', unidade: 'mcg/dL', grupo: 'Vitaminas e minerais', min: 65, max: 175 },
  { chave: 'ferritina', nome: 'Ferritina', unidade: 'ng/mL', grupo: 'Vitaminas e minerais', min: 30, max: 476,
    obs: 'Sobe com estoque de ferro, mas também com inflamação, álcool e gordura no fígado — por isso a tendência diz mais que o valor isolado.' },
  { chave: 'calcio', nome: 'Cálcio', unidade: 'mg/dL', grupo: 'Vitaminas e minerais', min: 8.6, max: 10.4 },
  { chave: 'sodio', nome: 'Sódio', unidade: 'mEq/L', grupo: 'Vitaminas e minerais', min: 136, max: 145 },
  { chave: 'potassio', nome: 'Potássio', unidade: 'mEq/L', grupo: 'Vitaminas e minerais', min: 3.5, max: 5.1 },

  // ---- Hemograma ----
  { chave: 'hemoglobina', nome: 'Hemoglobina', unidade: 'g/dL', grupo: 'Hemograma', min: 13, max: 17.5 },
  { chave: 'hematocrito', nome: 'Hematócrito', unidade: '%', grupo: 'Hemograma', min: 40, max: 50 },
  { chave: 'leucocitos', nome: 'Leucócitos', unidade: '/mm³', grupo: 'Hemograma', min: 4000, max: 11000 },
  { chave: 'plaquetas', nome: 'Plaquetas', unidade: '/mm³', grupo: 'Hemograma', min: 150000, max: 450000 },
];

const GRUPOS_MARCADOR = ['Lipídios', 'Glicemia', 'Rim', 'Fígado', 'Tireoide', 'Hormônios', 'Vitaminas e minerais', 'Hemograma'];

function marcadorPorChave(chave) {
  return MARCADORES_EXAME.find(m => m.chave === chave) || null;
}

// 'baixo' | 'alto' | 'ok'. Devolve null quando não dá pra classificar (marcador
// desconhecido ou sem valor) — quem chama trata isso como "sem julgamento", em vez de
// mostrar um resultado normal por engano.
function situacaoMarcador(chave, valor) {
  const m = marcadorPorChave(chave);
  if (!m || valor == null || Number.isNaN(Number(valor))) return null;
  const v = Number(valor);
  if (m.min != null && v < m.min) return 'baixo';
  if (m.max != null && v > m.max) return 'alto';
  return 'ok';
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MARCADORES_EXAME, GRUPOS_MARCADOR, marcadorPorChave, situacaoMarcador };
}
