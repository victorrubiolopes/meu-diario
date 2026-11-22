// Prévia do treino antes de começar, com ilustração de cada exercício.
//
// Antes, a tela pedia uma decisão ("qual treino você vai fazer?") mostrando só o NOME do
// plano. Nome de plano não diz o que tem dentro, e nome de exercício nem sempre diz qual é
// o movimento.
//
// A ILUSTRAÇÃO SAI DO PRÓPRIO VÍDEO já cadastrado na biblioteca — a miniatura do YouTube.
// Não há busca de imagem na web nem banco de ilustrações de terceiros, por dois motivos:
// licença, e casamento de nomes (os exercícios aqui são em português, os bancos abertos são
// em inglês, então "Agachamento búlgaro" acharia qualquer coisa ou nada).
//
// O que este teste trava:
//   - a prévia existe e lista os exercícios do plano selecionado;
//   - a miniatura vem do videoUrl da biblioteca, nunca de busca externa;
//   - exercício sem vídeo não quebra a prévia;
//   - trocar o plano no seletor repinta SÓ a prévia (api.render() desfaria a escolha).
const fs = require('fs');
const path = require('path');

const raiz = path.join(__dirname, '..');
let falhas = 0;
function ok(cond, nome) {
  console.log((cond ? '  OK    ' : '  FALHOU ') + nome);
  if (!cond) falhas++;
}

const treino = fs.readFileSync(path.join(raiz, 'js/views/treino.js'), 'utf8');
const previa = treino.slice(treino.indexOf('function previaHtml'), treino.indexOf('if (!sessao) {'));
const thumb = treino.slice(treino.indexOf('function thumbExercicio'), treino.indexOf('function previaHtml'));

console.log('\n--- a prévia existe e é mostrada antes de iniciar ---');
ok(/function previaHtml\(plano\)/.test(treino), 'há uma função de prévia');
ok(/<div id="previa-plano">\$\{previaHtml\(sugerido\)\}<\/div>/.test(treino),
  'renderiza já aberta no plano sugerido');
ok(treino.indexOf('previa-plano') < treino.indexOf('id="iniciar-treino"'),
  'aparece ANTES do botão de iniciar — é o que informa a decisão');

console.log('\n--- lista o conteúdo do treino ---');
ok(/exs\.length\} exercício/.test(previa), 'diz quantos exercícios tem');
ok(/e\.sets && e\.reps \? `\$\{e\.sets\}x\$\{e\.reps\}`/.test(previa), 'mostra séries x repetições');
ok(/e\.descanso/.test(previa), 'mostra o descanso');
ok(/Este plano está sem exercícios/.test(previa), 'plano vazio avisa em vez de sumir');
ok(/Treino livre — você monta/.test(previa), 'treino livre explica o que vem depois');

console.log('\n--- a ilustração vem do vídeo da biblioteca ---');
ok(/img\.youtube\.com\/vi\/\$\{id\}\/mqdefault\.jpg/.test(thumb), 'miniatura derivada do id do vídeo');
ok(/Util\.youtubeEmbedId\(doLib\.videoUrl\)/.test(thumb), 'o id sai do videoUrl já cadastrado');
ok(/biblioteca\.find\(e => e\.name\.trim\(\)\.toLowerCase\(\)/.test(thumb), 'casa pelo nome do exercício');
ok(/: null;\s*\}/.test(thumb), 'sem vídeo devolve null em vez de uma URL quebrada');

console.log('\n--- sem vídeo não quebra ---');
ok(/🏋️/.test(previa), 'exercício sem vídeo ganha um marcador neutro');
ok(/\$\{exs\.length - comVideo\} sem vídeo/.test(previa), 'avisa quantos ainda não têm vídeo');
ok(/loading="lazy"/.test(previa), 'as imagens carregam sob demanda, não todas de uma vez');

console.log('\n--- nenhuma busca de imagem externa ---');
// Se um dia alguém quiser mudar isso, que seja uma decisão consciente e não um acidente.
ok(!/googleusercontent|bing\.|unsplash|pexels|wger|exercisedb/i.test(treino),
  'não busca imagem em banco de terceiros');

console.log('\n--- trocar o plano repinta só a prévia ---');
const handler = treino.slice(treino.indexOf("selPlano.addEventListener('change'"), treino.indexOf("document.getElementById('iniciar-treino')"));
ok(handler.length > 0, 'o seletor tem handler de troca');
ok(/alvo\.innerHTML = previaHtml\(escolhido\)/.test(handler), 'atualiza o bloco da prévia');
ok(!/api\.render\(\)/.test(handler.replace(/\/\/.*$/gm, '')),
  'NÃO chama api.render() — devolveria o seletor ao plano sugerido e desfaria a escolha');

console.log(falhas === 0 ? '\nTODOS OS TESTES PASSARAM\n' : `\n${falhas} TESTE(S) FALHARAM\n`);
process.exit(falhas === 0 ? 0 : 1);
