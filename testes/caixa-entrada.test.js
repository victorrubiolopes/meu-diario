// Caixa de entrada: refeição depositada por um agente externo entra no diário sozinha.
//
// É o único caminho do app que grava comida SEM a pessoa tocar em nada, então as garantias
// que o tornam aceitável precisam estar travadas:
//  1. o agente deposita e NÃO LÊ — a conta dele não pode ter 'read' em lugar nenhum;
//  2. aplicar duas vezes o mesmo depósito não duplica a refeição;
//  3. todo lançamento é desfazível PELOS IDS, nunca por data (senão o "desfazer" levaria
//     junto o que a pessoa lançou na mão no mesmo almoço).
const fs = require('fs');
const path = require('path');

const raiz = path.join(__dirname, '..');
const rules = fs.readFileSync(path.join(raiz, 'firestore.rules'), 'utf8');
const cloudSrc = fs.readFileSync(path.join(raiz, 'js/cloud.js'), 'utf8');
const maisSrc = fs.readFileSync(path.join(raiz, 'js/views/mais.js'), 'utf8');

let falhas = 0;
function ok(cond, nome) {
  console.log((cond ? '  OK    ' : '  FALHOU ') + nome);
  if (!cond) falhas++;
}
function eq(a, b, nome) {
  ok(a === b, nome + (a === b ? '' : ` (esperado ${JSON.stringify(b)}, veio ${JSON.stringify(a)})`));
}

console.log('\n--- regras: o agente deposita e não lê ---');
const blocoCaixa = rules.slice(rules.indexOf('match /caixaEntrada/{doc}'), rules.indexOf('match /sharedFoods/'));
ok(blocoCaixa.length > 0, 'achou o bloco da caixaEntrada');
ok(/allow create: if ehAgente\(\)/.test(blocoCaixa), 'só o agente cria');
ok(!/allow read[^:]*:[^;]*ehAgente/.test(blocoCaixa), 'o agente NÃO tem leitura');
ok(/allow read, delete: if request\.auth != null && request\.auth\.uid == resource\.data\.uid/.test(blocoCaixa),
  'só o dono lê e apaga a própria caixa');
ok(/allow update: if false/.test(blocoCaixa), 'depósito não pode ser editado');
ok(/hasOnly\(\['uid', 'date', 'mealType', 'itens', 'criadoEm', 'origem'\]\)/.test(blocoCaixa), 'campos fixos');
ok(/itens\.size\(\) <= 40/.test(blocoCaixa), 'limite de itens por depósito');
ok(/itens\.size\(\) > 0/.test(blocoCaixa), 'depósito vazio é recusado');

// A regra que NÃO pode ter mudado: o diário continua gravável só pelo dono.
const blocoUsers = rules.slice(rules.indexOf('match /users/{userId}'), rules.indexOf('match /profiles/'));
ok(/allow write: if request\.auth != null && request\.auth\.uid == userId/.test(blocoUsers),
  'users/{uid} continua gravável SÓ pelo dono (o agente não alcança o diário)');
ok(!/ehAgente/.test(blocoUsers), 'o agente não aparece nas regras do diário');

console.log('\n--- o UID do agente vem em branco de propósito ---');
ok(/COLE_AQUI_O_UID_DA_CONTA_DO_AGENTE/.test(rules), 'placeholder do UID presente');
ok(!/uid == '[A-Za-z0-9]{20,}'/.test(rules), 'nenhum UID real versionado no repositório');

console.log('\n--- cloud.js: não duplica e não derruba o login ---');
const fn = cloudSrc.slice(cloudSrc.indexOf('async function aplicarCaixaEntrada()'), cloudSrc.indexOf('async function aplicarPrescricao()'));
ok(fn.length > 0, 'achou aplicarCaixaEntrada');
ok(/where\('uid', '==', user\.uid\)/.test(fn), 'busca só os depósitos do próprio usuário');
ok(/vistos\.has\(doc\.id\)/.test(fn), 'guarda o que já aplicou (não duplica se o delete falhar)');
ok(/doc\.ref\.delete\(\)/.test(fn), 'apaga o depósito depois de aplicar');
ok(/catch/.test(fn) && /return false/.test(fn), 'falha na caixa não derruba o login');
ok(/desfazer: ids/.test(fn), 'a notificação carrega os ids pro desfazer');
ok(/Storage\.add\('notificacoes'/.test(fn), 'todo lançamento vira aviso no sino');
ok(cloudSrc.indexOf('await aplicarCaixaEntrada();') > 0, 'roda no login');

console.log('\n--- desfazer apaga por id, nunca por data ---');
const undo = maisSrc.slice(maisSrc.indexOf("querySelectorAll('[data-desfazer]')"), maisSrc.indexOf("querySelectorAll('[data-ir]')"));
ok(undo.length > 0, 'achou o handler do desfazer');
ok(/n\.desfazer\.forEach\(id => Storage\.remove\('alimentacao', id\)\)/.test(undo), 'apaga exatamente os ids guardados');
ok(!/getByDate|mealType/.test(undo), 'não apaga por data nem por refeição');
ok(/window\.confirm/.test(undo), 'pede confirmação antes de apagar');
ok(/refeicaoRecebida: '📥'/.test(maisSrc), 'tem ícone próprio no sino');

console.log('\n--- forma do depósito (o que eu preciso escrever lá) ---');
// Reproduz a validação da regra, pra eu não montar um depósito que o Firestore vai recusar.
const CAMPOS = ['uid', 'date', 'mealType', 'itens', 'criadoEm', 'origem'];
function aceita(doc) {
  const ks = Object.keys(doc);
  if (!ks.every(k => CAMPOS.includes(k))) return false;
  if (typeof doc.uid !== 'string' || typeof doc.date !== 'string' || typeof doc.mealType !== 'string') return false;
  if (!Array.isArray(doc.itens) || doc.itens.length === 0 || doc.itens.length > 40) return false;
  return true;
}
const base = { uid: 'u1', date: '2026-09-25', mealType: 'Almoço', itens: [{ foodName: 'Ceviche', kcal: 100 }], criadoEm: 1, origem: 'claude' };
eq(aceita(base), true, 'depósito bem formado passa');
eq(aceita({ ...base, itens: [] }), false, 'sem itens é recusado');
eq(aceita({ ...base, itens: new Array(41).fill({}) }), false, '41 itens é recusado');
eq(aceita({ ...base, itens: new Array(40).fill({}) }), true, '40 itens passa');
eq(aceita({ ...base, extra: 'x' }), false, 'campo a mais é recusado');
eq(aceita({ ...base, date: 20260925 }), false, 'data não-string é recusada');


console.log('\n--- ferramenta de depósito ---');
const ferr = fs.readFileSync(path.join(raiz, 'ferramentas/depositar-refeicao.js'), 'utf8');
ok(/avisos\.length/.test(ferr) && /NÃO depositei/.test(ferr), 'recusa depositar se o parser não entendeu alguma linha');
ok(/itens\.length > 40/.test(ferr), 'recusa acima do limite de 40 itens da regra');
ok(/CAMPOS_ITEM\.forEach/.test(ferr), 'manda só os campos que a regra aceita');
ok(/process\.env\.DIARIO_AGENTE_SENHA/.test(ferr), 'lê a senha do ambiente');
ok(!/AIza[0-9A-Za-z_-]{30,}/.test(ferr), 'não tem chave embutida (lê de firebase-config.js)');
ok(!/senha\s*=\s*['"][^'"]+['"]/.test(ferr), 'nenhuma senha escrita no arquivo');
ok(/origem: 'claude'/.test(ferr), 'marca a origem do depósito');
ok(/dry-run|dryRun/.test(ferr), 'tem modo de conferência sem enviar');

console.log(falhas === 0 ? '\nTODOS OS TESTES PASSARAM\n' : `\n${falhas} TESTE(S) FALHARAM\n`);
process.exit(falhas === 0 ? 0 : 1);
