// Cardio avulso — bike ergométrica, elíptico, esteira, escada.
//
// Nasceu de um caso real: pedalar depois da musculação (ou enquanto espera alguém) não tinha
// onde ser lançado. O Garmin mostrava 6 sessões de "Cardiovascular" em novembro que não
// existiam no diário.
//
// O que este teste trava:
//   - a coleção existe, sincroniza e aparece no histórico;
//   - o MET da ergométrica está calibrado contra a sessão medida, e não contra a tabela;
//   - o gasto é LÍQUIDO e entra no total sem quebrar a separação por modalidade;
//   - é sub-aba e não tela própria (registro diário não ganha navegação);
//   - gravar e excluir recalculam o gasto do dia.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const raiz = path.join(__dirname, '..');
let falhas = 0;
function ok(cond, nome) {
  console.log((cond ? '  OK    ' : '  FALHOU ') + nome);
  if (!cond) falhas++;
}
function perto(a, b, tol) { return Math.abs(a - b) <= tol; }

const ctx = { Storage: { getByDate: () => [], getAll: () => [] }, Util: { getPesoAtual: () => null }, console };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(raiz, 'js/data/dietas.js'), 'utf8'), ctx);
const kcalCardio = vm.runInContext('kcalCardioLiquido', ctx);
const detalhar = vm.runInContext('detalharGastoEstimado', ctx);

const storage = fs.readFileSync(path.join(raiz, 'js/storage.js'), 'utf8');
const cloud = fs.readFileSync(path.join(raiz, 'js/cloud.js'), 'utf8');
const util = fs.readFileSync(path.join(raiz, 'js/util.js'), 'utf8');
const treino = fs.readFileSync(path.join(raiz, 'js/views/treino.js'), 'utf8');
const mais = fs.readFileSync(path.join(raiz, 'js/views/mais.js'), 'utf8');
const app = fs.readFileSync(path.join(raiz, 'js/app.js'), 'utf8');

const PESO = 84.5;

console.log('\n--- a coleção existe e acompanha o resto ---');
ok(/cardio: 'cardio_entries'/.test(storage), 'cardio está em Storage.KEYS');
ok(/'treino', 'corridas', 'cardio'/.test(cloud), 'cardio está em SYNC_KEYS — senão só existiria neste aparelho');
ok(/tipo: 'cardio'/.test(util), 'cardio aparece no histórico de treinos');

console.log('\n--- MET calibrado contra medição, não contra tabela ---');
// Sessão real: bike indoor, 22,7 min, 187 kcal BRUTAS pelo Garmin a 84,5 kg.
// O basal de 22,7 min (TMB 1792) é ~28 kcal, então o LÍQUIDO medido é ~159.
const BRUTO_MEDIDO = 187, MIN_MEDIDO = 22.7;
const liquidoMedido = BRUTO_MEDIDO - (1792 / 1440) * MIN_MEDIDO;
const nosso = kcalCardio('Bicicleta ergométrica', MIN_MEDIDO, PESO);
ok(nosso < BRUTO_MEDIDO,
  `líquido (${nosso.toFixed(0)}) abaixo do bruto medido (${BRUTO_MEDIDO}) — o contrário é fisicamente impossível`);
ok(perto(nosso, liquidoMedido, 15),
  `bate com o líquido medido de ${liquidoMedido.toFixed(0)} kcal (deu ${nosso.toFixed(0)})`);
// Com o MET 7,0 do código geral do Compêndio daria 194 — mais que o bruto. É o erro que a
// escolha de 6,0 evita, e o mesmo que MET_MUSCULACAO cometeu com o 5.
const dietas = fs.readFileSync(path.join(raiz, 'js/data/dietas.js'), 'utf8');
ok(/'Bicicleta ergométrica': 6\.0/.test(dietas), 'ergométrica em 6,0, não no 7,0 da tabela geral');

console.log('\n--- é líquido e não inventa número ---');
ok(kcalCardio('Elíptico', 0, PESO) === 0, 'sem tempo não gera caloria');
ok(kcalCardio('Elíptico', 30, 0) === 0, 'sem peso não dá pra estimar');
ok(perto(kcalCardio('Elíptico', 60, PESO), (5 - 1) * PESO, 1), 'Elíptico: (MET-1) × peso × horas');
ok(perto(kcalCardio('Elíptico', 30, PESO), kcalCardio('Elíptico', 60, PESO) / 2, 1), 'escala linear com a duração');
ok(kcalCardio('Escada / simulador', 30, PESO) > kcalCardio('Esteira (caminhada)', 30, PESO),
  'escada custa mais que caminhada na esteira, como o Compêndio prevê');
ok(kcalCardio('Modalidade que não existe', 30, PESO) > 0,
  'modalidade desconhecida cai num padrão em vez de zerar o treino');

console.log('\n--- entra no total sem quebrar a separação ---');
const dia = detalhar('2026-11-18', {
  peso: PESO,
  corridas: [{ date: '2026-11-18', distanceKm: 5, timeMin: 30 }],
  treino: [{ date: '2026-11-18', duracaoMin: 45 }],
  cardio: [{ date: '2026-11-18', modalidade: 'Bicicleta ergométrica', timeMin: 20 }],
});
ok(dia.cardio > 0, 'cardio aparece separado');
ok(dia.corrida > 0 && dia.musculacao > 0, 'corrida e musculação seguem separadas');
ok(dia.total === dia.corrida + dia.musculacao + dia.cardio, 'o total é a soma das TRÊS');
const outroDia = detalhar('2026-11-19', {
  peso: PESO, corridas: [], treino: [],
  cardio: [{ date: '2026-11-18', modalidade: 'Elíptico', timeMin: 20 }],
});
ok(outroDia.cardio === 0, 'só conta o cardio do dia pedido');
ok(detalhar('2026-11-18', { peso: null, corridas: [], treino: [], cardio: [] }).cardio === 0,
  'sem peso devolve zero em vez de NaN');

console.log('\n--- é sub-aba, não tela própria ---');
// Regra do projeto: registro diário (comida, treino, peso) sai em 2 toques e não ganha
// navegação. Tela própria é pra escolher/montar, não pra lançar.
ok(/data-sub="cardio"/.test(treino), 'existe a sub-aba Cardio');
ok(/state\.treinoSub === 'cardio'/.test(treino), 'o roteador da aba trata cardio');
ok(!/goToSub\('cardio/.test(treino) && !/subView.*cardio/.test(app),
  'não virou subView — seria atrito no registro diário');
ok(/TIPO_POR_SUB/.test(treino), 'o histórico resolve por mapa, não por ternário encadeado');

console.log('\n--- gravar e excluir recalculam o gasto do dia ---');
const bloco = treino.slice(treino.indexOf('function renderCardio'), treino.indexOf('function renderCorrida'));
ok((bloco.match(/atualizarGastoAuto\(state\.date\)/g) || []).length >= 2,
  'chama atualizarGastoAuto ao gravar E ao excluir');
ok(/if \(!timeMin\) return;/.test(bloco), 'sem tempo não grava — é o campo que a estimativa precisa');
ok(/distanceKm = Number\([^)]*\)\.value\) \|\| null/.test(bloco.replace(/\s+/g, ' ')) || /\|\| null/.test(bloco),
  'distância é opcional (vira null, não NaN)');

console.log('\n--- o relatório descreve o método certo ---');
ok(!/musculação por MET 5 /.test(mais), 'não diz mais "MET 5" — o valor virou 3,5 e o texto tinha ficado para trás');
ok(/MET 3,5 e cardio por MET do Compêndio/.test(mais), 'descreve musculação e cardio');

console.log(falhas === 0 ? '\nTODOS OS TESTES PASSARAM\n' : `\n${falhas} TESTE(S) FALHARAM\n`);
process.exit(falhas === 0 ? 0 : 1);
