// Ilustração de exercício, do free-exercise-db (domínio público).
//
// Eu tinha recusado isso ao Victor dizendo que (a) imagem da web tem licença e (b) o
// casamento português/inglês erraria. O (a) estava certo para busca na web, mas errado como
// conclusão: existe conjunto com dedicação explícita ao domínio público. O (b) só vale para
// casamento AUTOMÁTICO por texto — o mapa escrito à mão não tem esse problema.
//
// O risco real é o erro SILENCIOSO: na montagem, a sugestão automática para "Abdução de
// quadril em pé" foi "Cable Hip Adduction", que é o movimento oposto. Num app de treino a
// pessoa olharia a foto errada e faria o exercício errado. Daí as duas regras travadas aqui:
// o mapa é manual, e o fallback é não mostrar nada em vez de mostrar qualquer coisa.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const raiz = path.join(__dirname, '..');
let falhas = 0;
function ok(cond, nome) {
  console.log((cond ? '  OK    ' : '  FALHOU ') + nome);
  if (!cond) falhas++;
}

const ctx = { console };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(raiz, 'js/data/ilustracoes.js'), 'utf8'), ctx);
const ILUS = vm.runInContext('ILUSTRACOES', ctx);
const BASE = vm.runInContext('ILUSTRACOES_BASE', ctx);
const url = vm.runInContext('ilustracaoExercicio', ctx);

const fonte = fs.readFileSync(path.join(raiz, 'js/data/ilustracoes.js'), 'utf8');
const treino = fs.readFileSync(path.join(raiz, 'js/views/treino.js'), 'utf8');
const html = fs.readFileSync(path.join(raiz, 'index.html'), 'utf8');

console.log('\n--- o mapa existe e cobre a biblioteca ---');
ok(Object.keys(ILUS).length >= 120, `${Object.keys(ILUS).length} exercícios mapeados`);

// Todo exercício da biblioteca semente tem que estar no mapa — é o conjunto que o app
// entrega pronto, e um buraco aí aparece como exercício sem imagem sem motivo.
const ctxEx = { console };
vm.createContext(ctxEx);
vm.runInContext(fs.readFileSync(path.join(raiz, 'js/data/exercicios.js'), 'utf8'), ctxEx);
const semente = vm.runInContext('EXERCICIOS_PADRAO', ctxEx);
const semIlustracao = semente.filter(e => !url(e.name) && e.grupo !== 'Outro');
ok(semIlustracao.length === 0,
  semIlustracao.length === 0 ? 'toda a biblioteca semente tem ilustração'
    : `faltam ${semIlustracao.length}: ${semIlustracao.slice(0, 5).map(e => e.name).join(', ')}`);

// E os 17 da ficha atual da MFIT.
const ctxM = { console };
vm.createContext(ctxM);
vm.runInContext('var TREINOS_PREDEFINIDOS={}; var EXERCICIOS_PADRAO=[];', ctxM);
vm.runInContext(fs.readFileSync(path.join(raiz, 'js/data/treinoMfitNov.js'), 'utf8'), ctxM);
const mfit = vm.runInContext('PLANO_MFIT_NOV', ctxM);
const nomesMfit = [...new Set(mfit.planos.flatMap(p => p.exercises.map(e => e.name)))];
const mfitSem = nomesMfit.filter(n => !url(n));
ok(mfitSem.length === 0,
  mfitSem.length === 0 ? `os ${nomesMfit.length} exercícios da ficha MFIT têm ilustração`
    : `faltam na MFIT: ${mfitSem.join(', ')}`);

console.log('\n--- a URL é montada certo ---');
ok(url('Agachamento livre') === BASE + 'Barbell_Squat/0.jpg', 'agachamento aponta pra Barbell_Squat');
ok(url('AGACHAMENTO LIVRE') === url('Agachamento livre'), 'não diferencia maiúscula de minúscula');
ok(url('  Agachamento livre  ') === url('Agachamento livre'), 'ignora espaço nas pontas');
ok(/^https:\/\/raw\.githubusercontent\.com\//.test(BASE), 'carrega do repositório de origem');

console.log('\n--- o fallback é NÃO mostrar, nunca mostrar errado ---');
ok(url('Exercício que não existe') === null, 'exercício fora do mapa devolve null');
ok(url('') === null && url(null) === null, 'nome vazio ou nulo devolve null');
ok(!/catch|\|\| BASE|fallback.*generic/i.test(fonte), 'não há imagem genérica de último recurso');

console.log('\n--- a procedência está escrita ---');
ok(/Unlicense/.test(fonte), 'diz a licença');
ok(/free-exercise-db/.test(fonte) && /wrkout\/exercises\.json/.test(fonte),
  'nomeia a fonte E a origem dela — a cadeia inteira');
ok(/escrito na mão|escrita à mão|MAPA É ESCRITO NA MÃO/i.test(fonte), 'explica por que o mapa é manual');
ok(/Adduction|OPOSTO/i.test(fonte), 'registra o erro silencioso que o mapa manual evita');

console.log('\n--- a prévia prefere o vídeo do usuário ---');
const thumb = treino.slice(treino.indexOf('function thumbExercicio'), treino.indexOf('function previaHtml'));
ok(thumb.indexOf('img.youtube.com') < thumb.indexOf('ilustracaoExercicio'),
  'vídeo cadastrado vem ANTES da ilustração genérica');
ok(/typeof ilustracaoExercicio === 'function'/.test(thumb),
  'checa se o módulo carregou — sem ele a tela não pode quebrar');

console.log('\n--- o script entra no index, na ordem certa ---');
ok(/js\/data\/ilustracoes\.js\?v=/.test(html), 'está no index com cache-bust');
ok(html.indexOf('js/data/ilustracoes.js') < html.indexOf('js/views/treino.js'),
  'carrega ANTES da view que o usa');

console.log(falhas === 0 ? '\nTODOS OS TESTES PASSARAM\n' : `\n${falhas} TESTE(S) FALHARAM\n`);
process.exit(falhas === 0 ? 0 : 1);
