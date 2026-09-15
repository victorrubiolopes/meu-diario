// parseRefeicaoSolta: lista de alimentos colada na tela de Comida, sem cabeçalho.
// Roda com `node` puro, sem DOM — mesma ideia do resto do ParsePlano.
const path = require('path');
const fs = require('fs');
const raiz = path.join(__dirname, '..');
const P = require(path.join(raiz, 'js/parse-plano.js'));
let s = fs.readFileSync(path.join(raiz, 'js/data/alimentos.js'), 'utf8').replace(/^\s*(const|var|let)\s+/gm, 'globalThis.');
eval(s);
const lib = globalThis.ALIMENTOS_PADRAO.map((a, i) => ({ ...a, id: 'x' + i }));

let falhas = 0;
const check = (c, m) => { if (!c) falhas++; console.log((c ? '  OK   ' : '  FALHA') + '  ' + m); };
const soma = (itens, campo) => Math.round(itens.reduce((s, i) => s + (i[campo] || 0), 0) * 10) / 10;

console.log('\nO PRATO DO BUFFET (caso que originou a tela)');
const r1 = P.parseRefeicaoSolta(
  'batata inglesa assada 190g\ncostela suína assada 53g\nceviche 115g\ncenoura cozida 80g\nazeite de oliva 5g', lib);
check(r1.itens.length === 5, 'os 5 alimentos entraram');
check(r1.avisos.length === 0, 'nenhum aviso');
check(Math.round(soma(r1.itens, 'kcal')) === 569, 'kcal = ' + Math.round(soma(r1.itens, 'kcal')) + ' (esperado 569)');
check(soma(r1.itens, 'satFat') === 6, 'saturada = ' + soma(r1.itens, 'satFat') + 'g — o campo que o "Só macros" zeraria');

console.log('\nFORMATOS QUE A PESSOA ESCREVE DE VERDADE');
[['Ceviche 115 g', 'espaço antes da unidade'], ['- ceviche 115g', 'com marcador de lista'],
 ['ceviche 1,15 porções', 'porções com vírgula'], ['CEVICHE 115G', 'maiúsculas'],
 ['ceviche 115gr', 'gr em vez de g']].forEach(([txt, rot]) => {
  const r = P.parseRefeicaoSolta(txt, lib);
  check(r.itens.length === 1 && r.itens[0].foodName === 'Ceviche', rot + ': "' + txt + '"');
});

console.log('\nPLURAL (biblioteca guarda no singular)');
const r2 = P.parseRefeicaoSolta('2 ovos cozidos\n3 bananas prata', lib);
check(r2.itens.length === 2, 'casou os dois: ' + r2.itens.map(i => i.foodName + ' ' + i.qty + 'x').join(', '));
check(r2.itens[0].qty === 2 && r2.itens[1].qty === 3, 'e manteve as quantidades');

console.log('\nERRA ALTO: linha ruim vira aviso, o resto continua valendo');
const r3 = P.parseRefeicaoSolta('cenoura cozida 80g\nxisdoisdemaio 50g\nceviche 115g', lib);
check(r3.itens.length === 2, 'os 2 válidos entraram mesmo com uma linha ruim no meio');
check(r3.avisos.some(a => /xisdoisdemaio/.test(a)), 'e a linha ruim virou aviso, não sumiu');

console.log('\nAMBIGUIDADE NÃO É CHUTADA');
const r4 = P.parseRefeicaoSolta('arroz 100g', lib);
check(r4.itens.length === 0, '"arroz" não entra sozinho');
check(/mais de um/.test(r4.avisos[0] || ''), 'vira aviso listando os candidatos');

console.log('\nQUANTIDADE AUSENTE AVISA EM VEZ DE ASSUMIR EM SILÊNCIO');
const r5 = P.parseRefeicaoSolta('ceviche', lib);
check(r5.itens.length === 1 && r5.itens[0].qty === 1, 'entra como 1 porção');
check(r5.avisos.some(a => /1 porção/.test(a)), 'mas avisa que assumiu — 100g silencioso é erro que só aparece no fim do mês');

console.log('\nTEXTO VAZIO');
check(P.parseRefeicaoSolta('', lib).avisos.length === 1, 'devolve aviso, não quebra');
check(P.parseRefeicaoSolta('\n\n  \n', lib).itens.length === 0, 'linhas em branco são ignoradas');

console.log('\nNÃO QUEBROU O PAINEL DA NUTRI (parsePlanoAlimentar usa o mesmo acharAlimento)');
const r6 = P.parsePlanoAlimentar('Almoço 12:30\narroz branco cozido 150g\nceviche 100g', lib);
check(r6.refeicoes.length === 1 && r6.refeicoes[0].itens.length === 2, 'plano alimentar segue funcionando');
check(r6.refeicoes[0].nome === 'Almoço', 'cabeçalho de refeição ainda é lido');

console.log('\n' + (falhas === 0 ? 'TODOS OS TESTES PASSARAM' : falhas + ' TESTE(S) FALHARAM'));
process.exit(falhas ? 1 : 0);
