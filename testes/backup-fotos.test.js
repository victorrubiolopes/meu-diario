// Backup com fotos: garante o desenho que mantém a rede de segurança de pé.
//
// A regra que este teste protege: 'exportAll()' NÃO pode incluir fotos. Ela é usada por
// 'salvarCopiaSeguranca', que grava o retorno DENTRO do localStorage — fotos são dataURL
// de megabytes e estourariam a cota, derrubando justamente a proteção contra perda de
// dados criada depois do episódio de 31/08/2026.
//
// Roda sem DOM e sem IndexedDB: checa o código-fonte e testa as funções puras.
const fs = require('fs');
const path = require('path');

const raiz = path.join(__dirname, '..');
const storageSrc = fs.readFileSync(path.join(raiz, 'js/storage.js'), 'utf8');
const dbSrc = fs.readFileSync(path.join(raiz, 'js/db.js'), 'utf8');
const maisSrc = fs.readFileSync(path.join(raiz, 'js/views/mais.js'), 'utf8');

let falhas = 0;
function ok(cond, nome) {
  console.log((cond ? '  OK    ' : '  FALHOU ') + nome);
  if (!cond) falhas++;
}
function eq(a, b, nome) {
  ok(a === b, nome + (a === b ? '' : ` (esperado ${JSON.stringify(b)}, veio ${JSON.stringify(a)})`));
}

console.log('\n--- exportAll fica sem fotos (cota do localStorage) ---');

const corpoExportAll = storageSrc.slice(
  storageSrc.indexOf('function exportAll()'),
  storageSrc.indexOf('function importAll(')
);
ok(corpoExportAll.length > 0, 'achou o corpo de exportAll');
ok(!/PhotoDB/.test(corpoExportAll), 'exportAll não toca em PhotoDB');
ok(!/_fotos/.test(corpoExportAll), 'exportAll não escreve a chave _fotos');
ok(!/await|async/.test(corpoExportAll), 'exportAll continua síncrona');

const corpoCopia = storageSrc.slice(
  storageSrc.indexOf('function salvarCopiaSeguranca('),
  storageSrc.indexOf('function restaurarCopiaSeguranca(')
);
ok(/exportAll\(\)/.test(corpoCopia), 'a cópia de segurança usa exportAll (a versão sem fotos)');
ok(!/PhotoDB/.test(corpoCopia), 'a cópia de segurança não guarda fotos');

console.log('\n--- PhotoDB ganhou o que o backup precisa ---');
['allPhotos', 'totalBytes', 'putMany'].forEach(fn => {
  ok(new RegExp('function ' + fn + '\\b').test(dbSrc), `db.js define ${fn}`);
  ok(new RegExp('\\b' + fn + '\\b').test(dbSrc.slice(dbSrc.lastIndexOf('return {'))), `${fn} está exportado`);
});
// put sobrescreve pela keyPath; add estouraria em id repetido. O que importa é que
// reimportar o mesmo backup duas vezes não duplique nem exploda.
const corpoPutMany = dbSrc.slice(dbSrc.indexOf('async function putMany('), dbSrc.lastIndexOf('return {'));
ok(/\.put\(/.test(corpoPutMany), 'putMany usa put (reimportar não duplica)');
ok(!/\.add\(/.test(corpoPutMany), 'putMany não usa add (quebraria em id repetido)');
ok(/filter\(r => r && r\.id\)/.test(corpoPutMany), 'putMany descarta registro sem id');

console.log('\n--- a tela usa os dois caminhos separados ---');
ok(/id="export-json"/.test(maisSrc), 'botão do backup comum existe');
ok(/id="export-fotos"/.test(maisSrc), 'botão do backup com fotos existe');
ok(/PhotoDB\.totalBytes\(\)/.test(maisSrc), 'avisa o tamanho antes de montar o arquivo');
ok(/data\._fotos = await PhotoDB\.allPhotos\(\)/.test(maisSrc), 'o backup com fotos anexa _fotos');
ok(/Array\.isArray\(data\._fotos\)/.test(maisSrc), 'a importação aceita backup SEM _fotos (compatível com os antigos)');
ok(/diario-backup-com-fotos-/.test(maisSrc), 'o arquivo com fotos tem nome próprio');

console.log('\n--- Util.formatarTamanho ---');
const utilSrc = fs.readFileSync(path.join(raiz, 'js/util.js'), 'utf8');
const formatarTamanho = new Function(
  utilSrc.slice(utilSrc.indexOf('function formatarTamanho('), utilSrc.indexOf('return { escolhaHtml')) +
  '; return formatarTamanho;'
)();

eq(formatarTamanho(0), '0 KB', 'zero');
eq(formatarTamanho(-5), '0 KB', 'negativo não quebra');
eq(formatarTamanho(null), '0 KB', 'null não quebra');
eq(formatarTamanho(NaN), '0 KB', 'NaN não quebra');
eq(formatarTamanho(512), '512 B', 'bytes');
eq(formatarTamanho(2048), '2 KB', 'kilobytes');
eq(formatarTamanho(5 * 1024 * 1024), '5,0 MB', 'megabytes com vírgula decimal');
eq(formatarTamanho(1.5 * 1024 * 1024 * 1024), '1,5 GB', 'gigabytes');
ok(!formatarTamanho(3 * 1024 * 1024).includes('.'), 'não usa ponto decimal (pt-BR)');

console.log(falhas === 0 ? '\nTODOS OS TESTES PASSARAM\n' : `\n${falhas} TESTE(S) FALHARAM\n`);
process.exit(falhas === 0 ? 0 : 1);
