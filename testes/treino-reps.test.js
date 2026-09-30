// Repetições pré-preenchidas com o que foi feito da última vez.
//
// A carga por série já era semeada do histórico (seedCargasHistorico); as reps ficavam em
// branco. Este teste trava as duas garantias que fazem o pré-preenchimento ser seguro:
//   1. só entra em linha VAZIA — nunca sobrescreve o que a pessoa acabou de digitar;
//   2. série em branco ou zerada não vira dado (0 reps não é "fiz zero", é "não preenchi").
const fs = require('fs');
const path = require('path');

const raiz = path.join(__dirname, '..');
const utilSrc = fs.readFileSync(path.join(raiz, 'js/util.js'), 'utf8');
const treinoSrc = fs.readFileSync(path.join(raiz, 'js/views/treino.js'), 'utf8');

let falhas = 0;
function ok(cond, nome) {
  console.log((cond ? '  OK    ' : '  FALHOU ') + nome);
  if (!cond) falhas++;
}
function eq(a, b, nome) {
  const iguais = JSON.stringify(a) === JSON.stringify(b);
  ok(iguais, nome + (iguais ? '' : ` (esperado ${JSON.stringify(b)}, veio ${JSON.stringify(a)})`));
}

console.log('\n--- Util.repsFeitasExercicio ---');
const repsFeitasExercicio = new Function(
  utilSrc.slice(utilSrc.indexOf('function repsFeitasExercicio('), utilSrc.indexOf('// Navegador embutido')) +
  '; return repsFeitasExercicio;'
)();

eq(repsFeitasExercicio(null), [], 'exercício nulo');
eq(repsFeitasExercicio({}), [], 'sem repsFeitas');
eq(repsFeitasExercicio({ repsFeitas: [] }), [], 'array vazio');
eq(repsFeitasExercicio({ repsFeitas: ['', '', ''] }), [], 'tudo em branco não é dado');
eq(repsFeitasExercicio({ repsFeitas: ['0', '0'] }), [], 'zero não é dado (é campo não preenchido)');
eq(repsFeitasExercicio({ repsFeitas: ['10', '9', '8'] }), [10, 9, 8], 'strings viram número');
eq(repsFeitasExercicio({ repsFeitas: [12, 10] }), [12, 10], 'números passam direto');
eq(repsFeitasExercicio({ repsFeitas: ['10', 'abc', '8'] }), [10, 8], 'lixo é descartado');
eq(repsFeitasExercicio({ repsFeitas: ['-5', '8'] }), [8], 'negativo é descartado');
ok(utilSrc.includes('repsFeitasExercicio,'), 'está exportado no Util');

console.log('\n--- a busca no histórico espelha a da carga ---');
const busca = treinoSrc.slice(treinoSrc.indexOf('function ultimaRepsPorSerie('), treinoSrc.indexOf('function melhorPaceHistorico('));
ok(busca.length > 0, 'achou ultimaRepsPorSerie');
ok(/e\.date <= dateISO/.test(busca), 'só olha treinos ATÉ a data aberta (não vaza do futuro)');
ok(/sort\(\(a, b\) => b\.date\.localeCompare\(a\.date\)\)/.test(busca), 'pega o mais recente primeiro');
ok(/toLowerCase\(\)/.test(busca), 'casa o nome sem diferenciar maiúsculas');
ok(/Util\.repsFeitasExercicio/.test(busca), 'usa o helper (não relê o array na mão)');
ok(/return null/.test(busca), 'sem histórico devolve null');

console.log('\n--- o pré-preenchimento não pisa no que foi digitado ---');
const seed = treinoSrc.slice(treinoSrc.indexOf('function seedRepsHistorico('), treinoSrc.indexOf('// Minutos já decorridos'));
ok(seed.length > 0, 'achou seedRepsHistorico');
ok(/r\.repsFeitas\.some\(v => v != null && v !== ''\)\) return;/.test(seed), 'linha com QUALQUER rep preenchida é pulada');
ok(/if \(!r\.name \|\| !r\.name\.trim\(\)\) return;/.test(seed), 'linha sem nome de exercício é pulada');
ok(/reps\[reps\.length - 1\]/.test(seed), 'série a mais que o histórico repete a última');

// A mesma guarda existe no seed de carga — se uma das duas sumir, o comportamento diverge.
const seedCarga = treinoSrc.slice(treinoSrc.indexOf('function seedCargasHistorico('), treinoSrc.indexOf('function seedRepsHistorico('));
ok(/if \(jaTemPeso\) return;/.test(seedCarga), 'o seed de carga também pula linha já preenchida');
ok(/cargas\[cargas\.length - 1\]/.test(seedCarga), 'e também repete a última série');

console.log('\n--- as duas sementes andam juntas ---');
// Onde a carga é semeada, as reps também precisam ser — senão metade do card vem pronta
// e a outra metade não, que era exatamente o incômodo.
const chamadasCarga = (treinoSrc.match(/seedCargasHistorico\(rows\)/g) || []).length;
const chamadasReps = (treinoSrc.match(/seedRepsHistorico\(rows\)/g) || []).length;
ok(chamadasCarga === chamadasReps && chamadasCarga === 3,
  `as duas são chamadas nos mesmos 3 pontos (carga: ${chamadasCarga}, reps: ${chamadasReps})`);
ok(/if \(!existing\) \{ seedCargasHistorico\(rows\); seedRepsHistorico\(rows\); \}/.test(treinoSrc),
  'ao abrir um treino novo');
ok(/syncNames\(\); seedCargasHistorico\(rows\); seedRepsHistorico\(rows\);/.test(treinoSrc),
  'ao trocar o nome do exercício');

console.log(falhas === 0 ? '\nTODOS OS TESTES PASSARAM\n' : `\n${falhas} TESTE(S) FALHARAM\n`);
process.exit(falhas === 0 ? 0 : 1);
