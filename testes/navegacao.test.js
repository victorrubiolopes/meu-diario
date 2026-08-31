// Checagens estáticas do roteamento de subtelas. Roda com `node` puro, sem DOM.
//
// Nasceram de dois bugs reais da mesma família: uma subtela sem entrada em SUB_TITLES
// aparecia com o título errado no topbar, e uma subtela aberta sem ajustar a aba deixava o
// roteador renderizando a tela anterior. Os dois só apareciam usando o app, e os dois são
// verificáveis lendo o código.
const fs = require('fs');
const path = require('path');
const raiz = path.join(__dirname, '..');

const app = fs.readFileSync(path.join(raiz, 'js/app.js'), 'utf8');
const views = fs.readdirSync(path.join(raiz, 'js/views'))
  .filter(f => f.endsWith('.js'))
  .map(f => ({ nome: f, src: fs.readFileSync(path.join(raiz, 'js/views', f), 'utf8') }));

let falhas = 0;
const check = (cond, msg) => {
  if (!cond) falhas++;
  console.log((cond ? '  OK   ' : '  FALHA') + '  ' + msg);
};

// Recorta um literal de objeto pelo nome, contando chaves.
function objeto(src, nome) {
  const i = src.indexOf('const ' + nome);
  if (i < 0) return '';
  let d = 0;
  const ini = src.indexOf('{', i);
  for (let k = ini; k < src.length; k++) {
    if (src[k] === '{') d++;
    else if (src[k] === '}') { d--; if (d === 0) return src.slice(ini, k + 1); }
  }
  return '';
}

const titulos = new Set([...objeto(app, 'SUB_TITLES').matchAll(/'?([\w-]+)'?\s*:/g)].map(m => m[1]));
const donos = new Set([...objeto(app, 'SUB_TAB').matchAll(/'?([\w-]+)'?\s*:/g)].map(m => m[1]));
const abas = new Set([...objeto(app, 'TITLES').matchAll(/'?([\w-]+)'?\s*:/g)].map(m => m[1]));

const chamadas = [];
views.forEach(v => {
  [...v.src.matchAll(/goToSub\(\s*'([\w-]+)'/g)].forEach(m => chamadas.push({ view: m[1], arquivo: v.nome }));
  // goToSub(variavel) — não dá pra resolver estaticamente, mas o alvo vem de um data-attr
  // cujos valores estão no mesmo arquivo; só registra pra não dar falsa sensação de cobertura.
  [...v.src.matchAll(/goToSub\(\s*([a-zA-Z][\w.]*)\s*[,)]/g)].forEach(m => chamadas.push({ view: null, dinamico: m[1], arquivo: v.nome }));
});

const estaticas = [...new Set(chamadas.filter(c => c.view).map(c => c.view))];
const dinamicas = chamadas.filter(c => !c.view);

console.log('\nSUBTELAS');
console.log('  ' + estaticas.length + ' chamadas literais, ' + dinamicas.length + ' dinâmicas ('
  + [...new Set(dinamicas.map(d => d.dinamico))].join(', ') + ')');

console.log('\nTODA SUBTELA PRECISA DE TÍTULO');
const semTitulo = estaticas.filter(v => !titulos.has(v));
check(semTitulo.length === 0, semTitulo.length ? 'sem entrada em SUB_TITLES: ' + semTitulo.join(', ') : 'todas as ' + estaticas.length + ' têm entrada em SUB_TITLES');

console.log('\nTODO DONO DECLARADO PRECISA SER UMA ABA REAL');
const donoInvalido = [...donos].filter(v => {
  const m = objeto(app, 'SUB_TAB').match(new RegExp("'?" + v + "'?\\s*:\\s*'([\\w-]+)'"));
  return m && !abas.has(m[1]);
});
check(donoInvalido.length === 0, donoInvalido.length ? 'aba inexistente para: ' + donoInvalido.join(', ') : 'todos os donos em SUB_TAB apontam pra aba existente');

console.log('\nNINGUÉM AJUSTA A ABA NA MÃO ANTES DE goToSub');
// Era assim que o bug entrava: quem esquecia, abria a subtela na aba errada.
const naMao = [];
views.forEach(v => {
  const linhas = v.src.split('\n');
  linhas.forEach((l, i) => {
    if (!/state\.tab\s*=/.test(l)) return;
    const janela = linhas.slice(i, i + 4).join('\n');
    if (/goToSub\(/.test(janela)) naMao.push(v.nome + ':' + (i + 1));
  });
});
check(naMao.length === 0, naMao.length ? 'ajuste manual de aba junto de goToSub em: ' + naMao.join(', ') : 'nenhum — goToSub resolve a aba sozinho por SUB_TAB');

console.log('\nO TOPBAR NÃO PODE VOLTAR A DEPENDER DA ABA "mais"');
check(!/state\.tab === 'mais' && state\.subView/.test(app), 'título e botão voltar olham só subView, não a aba');

console.log('\n' + (falhas === 0 ? 'TODOS OS TESTES PASSARAM' : falhas + ' TESTE(S) FALHARAM'));
process.exit(falhas ? 1 : 0);
