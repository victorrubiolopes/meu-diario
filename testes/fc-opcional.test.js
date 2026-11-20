// Frequência cardíaca opcional (média, máxima, mínima) nos três registros de treino.
//
// Os valores são GRAVADOS mas NÃO entram na estimativa de caloria. Isso é medição, não
// preguiça: contra as 8 sessões de força e as 4 corridas que o relógio mediu, estimar gasto
// por %FC da reserva erra de +58% a +114% na musculação e de +7% a +23% na corrida — e nesta
// o ACSM por distância e tempo é melhor E usa dados que o app já tem.
//
// Travado aqui junto: a tonelagem (carga x repetições) também não entra. Nas mesmas 8
// sessões, depois de descontar a duração, a tonelagem explica r = 0,00 da caloria. O trabalho
// mecânico de 8.576 kg x 0,5 m são ~40 kcal de custo metabólico contra 252 medidas: levantar
// o peso é ~16% do custo da sessão, o resto é tempo em pé com FC elevada.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const raiz = path.join(__dirname, '..');
let falhas = 0;
function ok(cond, nome) {
  console.log((cond ? '  OK    ' : '  FALHOU ') + nome);
  if (!cond) falhas++;
}

const treino = fs.readFileSync(path.join(raiz, 'js/views/treino.js'), 'utf8');
const cloud = fs.readFileSync(path.join(raiz, 'js/cloud.js'), 'utf8');

console.log('\n--- os três campos existem nos três formulários ---');
['treino', 'run', 'cardio'].forEach(pref => {
  const temTodos = [`${pref}-fcmed`, `${pref}-fcmax`, `${pref}-fcmin`].every(id => treino.includes(id));
  ok(temTodos, `${pref}: média, máxima e mínima`);
});
ok((treino.match(/opcional, do relógio/g) || []).length === 3, 'os três marcados como opcionais');

console.log('\n--- vazio vira null, não zero ---');
// 0 bpm no histórico seria um dado falso, e estragaria qualquer média futura.
ok(/return v > 0 \? v : null;/.test(treino), 'campo em branco grava null');
ok(/function lerFC\(prefixo\)/.test(treino), 'um helper só, não três cópias');

console.log('\n--- os três handlers gravam ---');
ok(/Storage\.update\('treino'[^)]*\.\.\.lerFC\('treino'\)/.test(treino), 'musculação, ao atualizar');
ok(/Storage\.add\('treino'[^)]*\.\.\.lerFC\('treino'\)/.test(treino), 'musculação, ao criar');
ok(/Storage\.add\('corridas'[^)]*\.\.\.lerFC\('run'\)/.test(treino), 'corrida');
ok(/Storage\.add\('cardio'[^)]*\.\.\.lerFC\('cardio'\)/.test(treino), 'cardio');

console.log('\n--- e aparecem depois (senão seria campo que só escreve) ---');
ok(/function resumoFC\(r\)/.test(treino), 'há um resumo pra exibição');
ok((treino.match(/resumoFC\(/g) || []).length >= 4, 'usado nas listas de corrida, cardio e musculação');
ok(/if \(r\.fcMedia\) partes\.push/.test(treino), 'mostra só o que foi preenchido');

console.log('\n--- NÃO entram na conta de caloria ---');
const ctx = { Storage: { getByDate: () => [], getAll: () => [] }, Util: { getPesoAtual: () => null }, console };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(raiz, 'js/data/dietas.js'), 'utf8'), ctx);
const detalhar = vm.runInContext('detalharGastoEstimado', ctx);
const PESO = 84.5;
const semFC = detalhar('2026-11-20', { peso: PESO, corridas: [], cardio: [], treino: [{ date: '2026-11-20', duracaoMin: 45 }] });
const comFC = detalhar('2026-11-20', { peso: PESO, corridas: [], cardio: [], treino: [{ date: '2026-11-20', duracaoMin: 45, fcMedia: 150, fcMax: 180, fcMin: 90 }] });
ok(semFC.musculacao === comFC.musculacao, 'a mesma sessão com e sem FC dá a mesma caloria');

const dietas = fs.readFileSync(path.join(raiz, 'js/data/dietas.js'), 'utf8');
ok(!/fcMedia|fcMax|fcMin/.test(dietas), 'dietas.js não lê nenhum campo de FC');

console.log('\n--- nem a carga, nem as repetições ---');
const comCarga = detalhar('2026-11-20', {
  peso: PESO, corridas: [], cardio: [],
  treino: [{ date: '2026-11-20', duracaoMin: 45, exercises: [{ name: 'Supino', weights: [100, 100, 100], repsFeitas: [15, 15, 15] }] }],
});
ok(semFC.musculacao === comCarga.musculacao,
  'sessão de 45 min custa o mesmo com ou sem 4,5 toneladas registradas');
ok(!/weights|repsFeitas|tonelagem/.test(dietas), 'dietas.js não lê carga nem repetições');

console.log('\n--- sincroniza ---');
// Os campos moram dentro de treino/corridas/cardio, que já estão em SYNC_KEYS.
ok(/'treino', 'corridas', 'cardio'/.test(cloud), 'as três coleções sincronizam, e a FC vai junto');

console.log(falhas === 0 ? '\nTODOS OS TESTES PASSARAM\n' : `\n${falhas} TESTE(S) FALHARAM\n`);
process.exit(falhas === 0 ? 0 : 1);
