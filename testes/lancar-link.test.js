// Refeição por link (?lancar=): trava as propriedades que fazem esse caminho ser seguro.
//
// A regra que mais importa: um link NUNCA grava no diário sozinho. Ele só deixa a lista
// montada na tela pra conferência — senão bastaria mandar uma URL pra injetar registro
// no diário de alguém.
//
// Roda sem DOM: checa o código-fonte e testa a validação dos parâmetros como função pura.
const fs = require('fs');
const path = require('path');

const raiz = path.join(__dirname, '..');
const appSrc = fs.readFileSync(path.join(raiz, 'js/app.js'), 'utf8');
const aliSrc = fs.readFileSync(path.join(raiz, 'js/views/alimentacao.js'), 'utf8');

let falhas = 0;
function ok(cond, nome) {
  console.log((cond ? '  OK    ' : '  FALHOU ') + nome);
  if (!cond) falhas++;
}
function eq(a, b, nome) {
  ok(a === b, nome + (a === b ? '' : ` (esperado ${JSON.stringify(b)}, veio ${JSON.stringify(a)})`));
}

console.log('\n--- o link não grava nada sozinho ---');

const corpoCaptura = appSrc.slice(
  appSrc.indexOf('function capturarLancamentoDaURL()'),
  appSrc.indexOf('function consumirLancamento()')
);
ok(corpoCaptura.length > 0, 'achou capturarLancamentoDaURL');
ok(!/Storage\.add|Storage\.saveAll|Storage\.update/.test(corpoCaptura), 'a captura não escreve no Storage');
ok(/history\.replaceState/.test(corpoCaptura), 'limpa os parâmetros da URL depois de ler');
ok(!/localStorage|sessionStorage/.test(corpoCaptura), 'não persiste o lançamento (uso único, não sobrevive a F5)');

// A gravação existe num lugar só, e é dentro de um addEventListener de clique.
const trechoSalvar = aliSrc.slice(aliSrc.indexOf("getElementById('link-salvar')"), aliSrc.indexOf("getElementById('link-descartar')"));
ok(/addEventListener\('click'/.test(trechoSalvar), 'a gravação está atrás de um clique');
ok(/Storage\.add\('alimentacao'/.test(trechoSalvar), 'o clique é o que grava');
ok(/lancamentoLink = null/.test(trechoSalvar), 'depois de salvar, o lançamento some (não salva duas vezes)');

console.log('\n--- a tela mostra o que vai ser gravado ---');
ok(/id="link-salvar"/.test(aliSrc), 'botão de confirmar existe');
ok(/id="link-descartar"/.test(aliSrc), 'dá pra descartar');
ok(/Nada foi salvo ainda/.test(aliSrc), 'diz que nada foi salvo ainda');
ok(/lancamentoLink\.ref/.test(aliSrc) && /lancamentoLink\.data/.test(aliSrc), 'mostra a refeição e o DIA que vai receber');
ok(/parseRefeicaoSolta/.test(aliSrc), 'usa o parser que erra alto (linha não entendida vira aviso)');
ok(/avisos\.length > 0/.test(aliSrc), 'mostra os avisos do parser');
const cardLink = aliSrc.slice(aliSrc.indexOf('function renderLancamentoLink('), aliSrc.indexOf('function renderSugestaoRefeicoes('));
ok(/Util\.escapeHtml\(lancamentoLink\.ref\)/.test(cardLink), 'escapa o tipo de refeição vindo da URL');
ok(/Util\.escapeHtml\(a\)/.test(cardLink), 'escapa os avisos');
ok(/Util\.escapeHtml\(i\.foodName\)/.test(cardLink), 'escapa o nome do alimento');

console.log('\n--- validação dos parâmetros da URL ---');
// Reproduz a validação do app.js como função pura, pra testar os limites.
const MEAL_TYPES = ['Café da manhã', 'Almoço', 'Lanche', 'Jantar', 'Outro'];
const HOJE = '2026-09-25';
function validar(params) {
  const lista = params.lancar;
  if (!lista || lista.length > 2000) return null;
  return {
    lista,
    data: /^\d{4}-\d{2}-\d{2}$/.test(params.data || '') ? params.data : HOJE,
    ref: MEAL_TYPES.includes(params.ref) ? params.ref : 'Almoço',
  };
}
// Confere que o app.js usa mesmo estes limites, pra este teste não virar ficção.
ok(/lista\.length <= 2000/.test(corpoCaptura), 'app.js limita a lista a 2000 caracteres');
ok(/\^\\d\{4\}-\\d\{2\}-\\d\{2\}\$/.test(corpoCaptura), 'app.js valida a data por regex ISO');
ok(/MEAL_TYPES_URL\.includes\(ref\)/.test(corpoCaptura), 'app.js só aceita tipo de refeição conhecido');

eq(validar({}), null, 'sem ?lancar= não faz nada');
eq(validar({ lancar: '' }), null, 'lista vazia não faz nada');
eq(validar({ lancar: 'x'.repeat(2001) }), null, 'lista gigante é recusada');
eq(validar({ lancar: 'x'.repeat(2000) }).lista.length, 2000, 'exatamente 2000 passa');
eq(validar({ lancar: 'ceviche 100g' }).ref, 'Almoço', 'sem ?ref= cai em Almoço');
eq(validar({ lancar: 'a', ref: 'Jantar' }).ref, 'Jantar', 'tipo válido é respeitado');
eq(validar({ lancar: 'a', ref: '<script>' }).ref, 'Almoço', 'tipo inventado cai no padrão');
eq(validar({ lancar: 'a' }).data, HOJE, 'sem ?data= cai em hoje');
eq(validar({ lancar: 'a', data: '2026-09-22' }).data, '2026-09-22', 'data válida é respeitada');
eq(validar({ lancar: 'a', data: '22/09/2026' }).data, HOJE, 'data em outro formato cai em hoje');
eq(validar({ lancar: 'a', data: 'javascript:1' }).data, HOJE, 'lixo na data cai em hoje');

console.log('\n--- o ?convite= não é atropelado ---');
ok(/\['lancar', 'ref', 'data'\]\.forEach\(p => params\.delete\(p\)\)/.test(corpoCaptura), 'só remove os parâmetros que consumiu');
ok(appSrc.indexOf('capturarConviteDaURL();') < appSrc.indexOf('capturarLancamentoDaURL();'), 'o convite é lido antes da limpeza da URL');

console.log(falhas === 0 ? '\nTODOS OS TESTES PASSARAM\n' : `\n${falhas} TESTE(S) FALHARAM\n`);
process.exit(falhas === 0 ? 0 : 1);
