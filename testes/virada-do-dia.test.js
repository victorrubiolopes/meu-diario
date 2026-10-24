// Virada do dia com o app suspenso em segundo plano.
//
// Bug real: o Victor treinou num dia, marcou no app, e o treino foi lançado no dia
// ANTERIOR. Causa: 'state.date' nasce com o hoje do momento em que o app carregou, e em
// celular o app fica suspenso por dias — ao voltar, a data continuava velha. Só o FAB, o
// link de lançar e as setas atualizavam a data; entrar direto numa aba, não.
//
// O que este teste trava:
//   1. a correção existe e roda de verdade (a função é extraída do app.js e executada,
//      não só procurada por regex);
//   2. ela NÃO atropela a navegação deliberada — quem foi ver outro dia continua lá. Esse
//      é o bug que um conserto apressado introduziria, e seria pior que o original;
//   3. ela é chamada nos dois lugares que importam: no render() (app aberto atravessando a
//      meia-noite) e na volta do segundo plano (celular suspenso).
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const raiz = path.join(__dirname, '..');
const app = fs.readFileSync(path.join(raiz, 'js/app.js'), 'utf8');

let falhas = 0;
function ok(cond, nome) {
  console.log((cond ? '  OK    ' : '  FALHOU ') + nome);
  if (!cond) falhas++;
}

// --- extrai o trecho real do app.js: a variável e a função, sem copiar a lógica ---
function recorta(src, inicio, fim) {
  const i = src.indexOf(inicio);
  if (i < 0) return null;
  const j = src.indexOf(fim, i);
  if (j < 0) return null;
  return src.slice(i, j + fim.length);
}
const decl = recorta(app, 'let hojeConhecido = Util.todayISO();', 'let hojeConhecido = Util.todayISO();');
const fn = recorta(app, 'function virarODiaSePreciso() {', '\n  }');

console.log('\n--- a correção está no app.js ---');
ok(!!decl, "declara 'hojeConhecido' a partir de Util.todayISO()");
ok(!!fn, "define a função 'virarODiaSePreciso'");
if (!decl || !fn) {
  console.log('\nNÃO ACHOU O CÓDIGO — o resto do teste não roda.\n');
  process.exit(1);
}

// --- monta um sandbox com a função REAL e um relógio controlável ---
function monta(hojeInicial) {
  const ctx = {
    hoje: hojeInicial,
    Util: { todayISO: () => ctx.hoje },
    state: { date: hojeInicial },
  };
  vm.createContext(ctx);
  vm.runInContext(decl + '\n' + fn + '\n', ctx);
  ctx.virar = () => vm.runInContext('virarODiaSePreciso()', ctx);
  return ctx;
}

console.log('\n--- dia não virou: nada muda ---');
let c = monta('2026-10-23');
ok(c.virar() === false, 'devolve false quando ainda é o mesmo dia');
ok(c.state.date === '2026-10-23', 'a data fica onde estava');

console.log('\n--- o BUG: app suspenso, usuário parado no hoje, o dia virou ---');
c = monta('2026-10-23');
c.hoje = '2026-10-24';                       // o celular passou a noite suspenso
ok(c.virar() === true, 'devolve true, sinalizando que a tela precisa repintar');
ok(c.state.date === '2026-10-24', 'a data acompanha o novo hoje  <-- o treino iria pro dia certo');

console.log('\n--- navegação deliberada NÃO é atropelada ---');
c = monta('2026-10-23');
c.state.date = '2026-10-20';                 // foi conferir a segunda-feira
c.hoje = '2026-10-24';
ok(c.virar() === false, 'devolve false: não há nada pra repintar');
ok(c.state.date === '2026-10-20', 'continua no dia que a pessoa escolheu ver');

console.log('\n--- depois de virar, não fica virando de novo ---');
c = monta('2026-10-23');
c.hoje = '2026-10-24';
c.virar();
ok(c.virar() === false, 'segunda chamada no mesmo dia é no-op');
ok(c.state.date === '2026-10-24', 'e não mexe mais na data');

console.log('\n--- quem estava noutro dia volta a acompanhar depois ---');
// 'hojeConhecido' tem que avançar MESMO quando a data não é mexida, senão a pessoa que
// navegou uma vez nunca mais veria a virada automática.
c = monta('2026-10-23');
c.state.date = '2026-10-20';
c.hoje = '2026-10-24';
c.virar();                                   // não mexe, mas registra que hoje é 24
c.state.date = '2026-10-24';                 // a pessoa voltou pro hoje
c.hoje = '2026-10-25';                       // e o dia virou outra vez
ok(c.virar() === true, 'volta a acompanhar a virada');
ok(c.state.date === '2026-10-25', 'e chega no dia certo');

console.log('\n--- vários dias suspenso de uma vez ---');
c = monta('2026-10-10');
c.hoje = '2026-10-24';
ok(c.virar() === true && c.state.date === '2026-10-24', 'pula direto pro hoje, não um dia por vez');

console.log('\n--- é chamada onde precisa ---');
const render = app.slice(app.indexOf('function render() {'), app.indexOf('sincronizarHistorico();'));
ok(/virarODiaSePreciso\(\)/.test(render), 'render() chama a função');
ok(render.indexOf('virarODiaSePreciso()') < render.indexOf('atualizarSino()'),
  'chama ANTES de desenhar, senão a tela sairia com a data velha');
ok(/visibilitychange[\s\S]{0,220}virarODiaSePreciso\(\)\s*\)\s*render\(\)/.test(app),
  'na volta do segundo plano, chama e repinta se mudou');

console.log('\n--- a data nunca vem de UTC ---');
// toLocalISO existe justamente porque toISOString() é UTC e jogaria o fim da noite de
// São Paulo pro dia seguinte. A correção não pode reintroduzir isso.
ok(!/toISOString/.test(app), 'app.js não usa toISOString em lugar nenhum');
const util = fs.readFileSync(path.join(raiz, 'js/util.js'), 'utf8');
ok(/function todayISO\(\)\s*\{\s*return toLocalISO\(new Date\(\)\);/.test(util),
  'todayISO sai de toLocalISO, não de UTC');

console.log(falhas === 0 ? '\nTODOS OS TESTES PASSARAM\n' : `\n${falhas} TESTE(S) FALHARAM\n`);
process.exit(falhas === 0 ? 0 : 1);
