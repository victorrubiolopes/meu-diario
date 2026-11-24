// Selo de quem prescreveu o combo, na tela de Combos.
//
// Nasceu de um pedido concreto: o Victor apagou todos os combos e pediu pra subir os da
// nutricionista "identificando". O 'fonte' sempre existiu no registro, mas é chave interna —
// nunca aparecia na tela, então as 16 refeições prescritas ficavam visualmente iguais às que
// ele montou na mão. Depois de três ciclos de prescrição (Matheus, meu cálculo, Gabrielle)
// isso virou um problema real de leitura.
//
// O que o teste trava:
//   1. o rótulo sai do campo 'profissional' do arquivo da prescrição, não de uma string
//      escrita na view — trocar de nutri não pode exigir mexer em mais.js;
//   2. combo sem fonte (feito na mão) NÃO leva selo: ausência de selo é o que o identifica,
//      e um selo "feito por você" em tudo só poluiria a lista;
//   3. fonte desconhecida (prescrição antiga cuja seed já saiu do repo) também não leva selo,
//      em vez de quebrar ou mostrar a chave crua.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const raiz = path.join(__dirname, '..');
const ARQS = [
  'js/util.js', 'js/data/alimentos.js', 'js/data/dietas.js',
  'js/data/dietaVictor.js', 'js/data/metaVictor.js', 'js/data/dietaGabi.js',
  'js/views/tarefas.js', 'js/views/mais.js',
];
const src = ARQS.map(f => fs.readFileSync(path.join(raiz, f), 'utf8')).join('\n;\n');
const { ViewMais, META_VICTOR, DIETA_VICTOR, DIETA_GABI } = vm.runInNewContext(
  '(function(){' + src + '; return { ViewMais, META_VICTOR, DIETA_VICTOR, DIETA_GABI };})()', { console });

let falhas = 0;
function ok(cond, nome) {
  console.log((cond ? '  OK    ' : '  FALHOU ') + nome);
  if (!cond) falhas++;
}

console.log('\n--- o arquivo da prescrição declara o profissional ---');
ok(typeof META_VICTOR.profissional === 'string' && META_VICTOR.profissional.length > 0,
  'META_VICTOR tem campo profissional');
ok(typeof DIETA_VICTOR.profissional === 'string' && DIETA_VICTOR.profissional.length > 0,
  'DIETA_VICTOR tem campo profissional (convenção que já existia)');

console.log('\n--- o rótulo vem do arquivo, não de string na view ---');
// A regra é: cada pacote é reconhecido e rotulado com o SEU PRÓPRIO campo 'profissional'.
// Antes este teste exigia que o pacote do META_VICTOR fosse "o atual" — travava QUAL era o
// vigente, não a regra, e quebrou sozinho quando entrou a prescrição da Gabi. Ciclo de
// prescrição novo não pode exigir mexer no teste.
const PACOTES = [DIETA_VICTOR, META_VICTOR, DIETA_GABI].filter(Boolean);
PACOTES.forEach(pac => {
  const o = ViewMais.origemCombo(pac.fonte);
  ok(!!o, `combo de "${pac.profissional}" é reconhecido pela fonte`);
  ok(o && o.nome === pac.profissional,
    `rótulo é exatamente o campo profissional do arquivo ("${pac.profissional}")`);
  ok(o && typeof o.atual === 'boolean', 'diz se é a prescrição vigente ou não');
});

console.log('\n--- exatamente UMA prescrição é a vigente ---');
// Duas vigentes deixaria a lista sem hierarquia; nenhuma vigente tiraria o destaque de quem
// está prescrevendo agora.
const vigentes = PACOTES.filter(pac => (ViewMais.origemCombo(pac.fonte) || {}).atual === true);
ok(vigentes.length === 1,
  vigentes.length === 1 ? `só "${vigentes[0].profissional}" está marcada como vigente`
    : `${vigentes.length} marcadas como vigentes: ${vigentes.map(p => p.profissional).join(', ')}`);

console.log('\n--- nenhum rótulo está escrito na própria view ---');
const fonteMais = fs.readFileSync(path.join(raiz, 'js/views/mais.js'), 'utf8');
ok(!/Gabrielle/.test(fonteMais), 'o nome da nutri atual não aparece hardcoded em mais.js');
ok(!/Matheus Alvarenga/.test(fonteMais), 'o nome do nutri anterior não aparece hardcoded em mais.js');

console.log('\n--- combo sem prescrição não leva selo ---');
ok(ViewMais.origemCombo(undefined) === null, 'fonte ausente (combo feito na mão) → sem selo');
ok(ViewMais.origemCombo('') === null, 'fonte vazia → sem selo');
ok(ViewMais.origemCombo(null) === null, 'fonte null → sem selo');
ok(ViewMais.origemCombo('seed-que-saiu-do-repo') === null,
  'fonte desconhecida → sem selo, em vez de mostrar a chave crua');

console.log('\n--- a lista de combos usa o selo e reaproveita o CSS existente ---');
ok(/origemCombo\(c\.fonte\)/.test(fonteMais), 'combosListHtml consulta a origem do combo');
ok(/class="badge\$\{origem\.atual \? '' : ' pr'\}"/.test(fonteMais),
  'usa as classes .badge/.badge.pr que já existem — sem CSS novo');
const css = fs.readFileSync(path.join(raiz, 'css/style.css'), 'utf8');
ok(/^\.badge \{/m.test(css) && /^\.badge\.pr \{/m.test(css),
  'as duas classes realmente existem no style.css');
ok(/Util\.escapeHtml\(origem\.nome\)/.test(fonteMais), 'o rótulo é escapado antes de ir pro HTML');

console.log('\n--- o nome do combo segue sem prefixo de autor ---');
// O nome aparece no <select> da tela de Comida e na sugestão de próxima refeição. Prefixar
// "Gabi ·" em 16 combos pouparia este selo e estragaria os dois lugares onde o nome é lido
// pra escolher comida, não pra auditar origem.
ok(META_VICTOR.combos.every(c => !/gabrielle|gabi/i.test(c.nome)),
  'nenhum dos 16 combos carrega o nome da nutri no próprio nome');

console.log(falhas === 0 ? '\nTODOS OS TESTES PASSARAM\n' : `\n${falhas} TESTE(S) FALHARAM\n`);
process.exit(falhas === 0 ? 0 : 1);
