// Definir o link de vídeo do exercício direto do card de treino.
//
// Antes, videoUrl só podia ser editado em Mais → Biblioteca de Exercícios: para trocar um
// vídeo era preciso sair do treino, achar o exercício numa lista de 157 e voltar. O momento
// em que se precisa do vídeo é justamente o de executar o movimento, então o botão passou a
// existir também no card.
//
// O que este teste trava:
//   - o botão existe no card e tem handler;
//   - o handler repinta SÓ os cards (api.render() apagaria as séries já marcadas);
//   - relê a biblioteca depois de gravar, senão o card repinta com o link velho;
//   - o vídeo vai para aprovação (Cloud.sugerirVideo), nunca direto no compartilhado;
//   - exercício fora da biblioteca ganha entrada, senão o link não teria onde morar;
//   - a edição pela biblioteca continua existindo.
const fs = require('fs');
const path = require('path');

const raiz = path.join(__dirname, '..');
let falhas = 0;
function ok(cond, nome) {
  console.log((cond ? '  OK    ' : '  FALHOU ') + nome);
  if (!cond) falhas++;
}

const treino = fs.readFileSync(path.join(raiz, 'js/views/treino.js'), 'utf8');
const mais = fs.readFileSync(path.join(raiz, 'js/views/mais.js'), 'utf8');

// Recorta só o corpo do handler, para não medir código vizinho.
const ini = treino.indexOf("cardsEl.querySelectorAll('[data-setvideo]')");
const handler = ini >= 0 ? treino.slice(ini, treino.indexOf('\n      });', ini)) : '';

console.log('\n--- o botão existe no card e está ligado ---');
ok(/data-setvideo="\$\{i\}"/.test(treino), 'o card renderiza o botão com o índice da linha');
ok(/(trocar link|definir link)/.test(treino), 'o rótulo diz se já existe link ou não');
ok(handler.length > 0, 'há handler para [data-setvideo]');

console.log('\n--- não pode destruir o preenchimento da tela ---');
// A tela de treino acumula estado local (séries marcadas, cargas digitadas) antes de salvar.
// api.render() reconstrói tudo e perde isso; renderCards() repinta só a lista.
ok(/renderCards\(\)/.test(handler), 'repinta com renderCards()');
ok(!/api\.render\(\)(?!:)/.test(handler.replace(/\/\/.*$/gm, '')),
  'NÃO chama api.render() (desconsiderando comentários)');
ok(handler.indexOf('syncNames()') >= 0 &&
   handler.indexOf('syncNames()') < handler.indexOf('rows[i]'),
  'syncNames() antes de ler o nome — o nome pode ter sido digitado e não estar em rows');

console.log('\n--- o card tem que enxergar o link novo ---');
ok(/biblioteca = Storage\.getAll\('exercicios_biblioteca'\)/.test(handler),
  'relê a biblioteca depois de gravar');
ok(/let biblioteca = Storage\.getAll\('exercicios_biblioteca'\)/.test(treino),
  "biblioteca é 'let' — com const a releitura nem compilaria");

console.log('\n--- vídeo compartilhado passa por aprovação ---');
// Regra do projeto: videoUrl não é compartilhado direto, vai pra pendingVideos. Gravar em
// sharedExercises daqui furaria a moderação.
ok(/Cloud\.sugerirVideo\(nome, link\)/.test(handler), 'usa Cloud.sugerirVideo');
ok(!/sharedExercises/.test(handler), 'não escreve direto na coleção compartilhada');
ok(!/aplicarVideoCompartilhado/.test(handler), 'não aplica o vídeo sem passar pela aprovação');
ok(/Cloud\.isEnabled\(\)/.test(handler), 'só tenta sugerir com a nuvem ativa');

console.log('\n--- exercício fora da biblioteca ---');
ok(/Storage\.add\('exercicios_biblioteca'/.test(handler),
  'cria a entrada quando o exercício ainda não existe');
ok(/name: nome/.test(handler), 'cria com o nome digitado');
ok(/if \(!nome\)/.test(handler), 'recusa definir vídeo em exercício sem nome');

console.log('\n--- a biblioteca continua podendo editar ---');
ok(/data-edit-link/.test(mais), 'o caminho antigo (Mais → Biblioteca) não foi removido');
ok(/Cloud\.sugerirVideo\(atual\.name, link\)/.test(mais), 'e segue passando pela aprovação');

console.log(falhas === 0 ? '\nTODOS OS TESTES PASSARAM\n' : `\n${falhas} TESTE(S) FALHARAM\n`);
process.exit(falhas === 0 ? 0 : 1);
