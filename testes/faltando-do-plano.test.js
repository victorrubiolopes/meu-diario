// "Do plano X, não estão na lista: [+ Mesa Flexora]"
//
// Veio direto da segunda mensagem do Victor depois de apagar exercícios sem querer:
// "Mas eu nem sei quais eram".
//
// O desfazer resolve o engano enquanto está fresco e some no F5 — é de uso imediato, de
// propósito. Esta tela resolve a pergunta seguinte, e resolve melhor: não depende de lembrar
// nada nem de ter percebido na hora, porque sai da COMPARAÇÃO entre o plano de onde o treino
// veio e o que está na lista agora. Funciona amanhã, em outro aparelho, depois de fechar o app.
//
// Serve pra mais do que o acidente: mostra o que ainda falta fazer da ficha.
//
// O que este teste trava:
//   - o bloco sai da comparação com o plano, não de memória do que foi removido;
//   - sem plano (treino livre) não aparece;
//   - recolocar devolve o exercício na POSIÇÃO QUE ELE TEM NO PLANO;
//   - recolocar NÃO inventa série marcada (o que foi feito morreu com a remoção);
//   - o texto é neutro — pular exercício de propósito é normal.
const fs = require('fs');
const path = require('path');

const raiz = path.join(__dirname, '..');
let falhas = 0;
function ok(cond, nome) {
  console.log((cond ? '  OK    ' : '  FALHOU ') + nome);
  if (!cond) falhas++;
}

const treino = fs.readFileSync(path.join(raiz, 'js/views/treino.js'), 'utf8');
const css = fs.readFileSync(path.join(raiz, 'css/style.css'), 'utf8');

const faltandoFn = treino.slice(treino.indexOf('function exerciciosFaltando'), treino.indexOf('function renderCards'));
const handler = treino.slice(treino.indexOf("cardsEl.querySelectorAll('[data-readd]')"), treino.indexOf("const undoBtn"));

console.log('\n--- o bloco sai da comparação com o plano ---');
ok(/plano\.exercises\.filter\(e => e\.name && !naLista\.has/.test(faltandoFn),
  'é o que o plano tem e a lista não tem');
ok(/rows\.map\(r => \(r\.name \|\| ''\)\.trim\(\)\.toLowerCase\(\)\)/.test(faltandoFn),
  'compara por nome normalizado, não por índice');
ok(!/removidos/.test(faltandoFn),
  'NÃO depende da pilha de desfazer — é isso que faz funcionar depois do F5');

console.log('\n--- sem plano, não aparece ---');
ok(/return planoIdAtual \? planos\.find\(p => p\.id === planoIdAtual\) : null/.test(treino),
  'treino livre não tem plano de onde comparar');
ok(/if \(!plano \|\| !Array\.isArray\(plano\.exercises\)\) return \[\]/.test(faltandoFn),
  'plano sem lista de exercícios não quebra a tela');
ok(/if \(!faltando\.length\) return ''/.test(treino),
  'com tudo na lista, o bloco some');

console.log('\n--- recolocar respeita a ordem da ficha ---');
// A ordem do plano é a ordem de executar: recolocar no fim embaralharia o treino.
ok(/const ordem = plano\.exercises\.map/.test(handler), 'lê a ordem do plano');
ok(/if \(idx > meu\) \{ pos = k; break; \}/.test(handler), 'entra antes do primeiro que vem depois dele');
ok(/-1 é exercício que não está no plano/.test(handler),
  'exercício adicionado na mão não manda na ordem');
ok(/rows\.splice\(pos, 0, nova\)/.test(handler), 'insere na posição calculada, não no fim');

console.log('\n--- recolocar não inventa o que foi feito ---');
ok(/\{ \.\.\.doPlano, done: \[\], weights: \[\], repsFeitas: \[\] \}/.test(handler),
  'volta com séries/reps do plano, mas sem marcação nem peso de hoje');
ok(/seedCargasHistorico\(rows\)/.test(handler) && /seedRepsHistorico\(rows\)/.test(handler),
  'a carga vem do histórico do exercício, como em qualquer card novo');
ok(/persist\(\)/.test(handler), 'grava — senão voltaria só na tela');

console.log('\n--- o texto não cobra nada de ninguém ---');
ok(/não estão na lista/.test(treino) && /não está na lista/.test(treino),
  'singular e plural');
// Olha só o que vai pra tela: o comentário do código cita "você esqueceu" justamente para
// dizer que esse não é o texto escolhido.
const htmlFaltando = treino.slice(treino.indexOf('function faltandoHtml'), treino.indexOf('function renderCards'));
ok(!/esqueceu|faltou fazer|você não fez/i.test(htmlFaltando),
  'não acusa: pular exercício de propósito é normal e o app não sabe a diferença');

console.log('\n--- estilo ---');
ok(/\.ex-faltando \{/.test(css) && /\.ex-faltando-chip \{/.test(css), 'o bloco e os botões têm estilo');
ok(/\.ex-faltando-chip \{[^}]*padding: 8px 14px/.test(css),
  'área de toque de dedo, não de mouse');

console.log('\n--- segue as regras de render da tela de treino ---');
ok(/cardsEl\.innerHTML = desfazerHtml\(\) \+ rows\.map\(\(r, i\) => cardHtml\(r, i\)\)\.join\(''\) \+ faltandoHtml\(\)/.test(treino),
  'repinta junto com os cards');
ok(!/api\.render\(\)/.test(handler),
  'NÃO chama api.render() — apagaria as séries já marcadas nos outros exercícios');

console.log(falhas === 0 ? '\nTODOS OS TESTES PASSARAM\n' : `\n${falhas} TESTE(S) FALHARAM\n`);
process.exit(falhas === 0 ? 0 : 1);
