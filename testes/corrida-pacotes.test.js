// Pacote de corrida carregável — Mais → Planos de Treino → Pacotes de corrida.
//
// A musculação já tinha esse caminho (TREINOS_PREDEFINIDOS → treino_planos). Corrida não:
// a coleção 'corrida_planos' existia e a aba Treino → Corrida já listava, mas só a nutri
// conseguia gravar lá, pela nuvem. Este teste trava o mecanismo novo.
//
// O que ele protege:
//   1. os planos têm exatamente os campos que 'corrida_planos' usa — um campo a menos e o
//      card aparece sem protocolo, que é a única coisa que importa num intervalado;
//   2. distanceKm e timeMin são NULOS de propósito. Num intervalado o total depende do dia,
//      e um número inventado aqui viraria "meta" na tela de registro;
//   3. a numeração é a DA FICHA, com buracos (3, 6 e 9 são longões que não entram).
//      Renumerar de 1 a 8 faria o app e o aplicativo da MFIT discordarem na hora de
//      escolher o treino do dia;
//   4. o registro é separado do de musculação, e os scripts carregam na ordem certa.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const raiz = path.join(__dirname, '..');
let falhas = 0;
function ok(cond, nome) {
  console.log((cond ? '  OK    ' : '  FALHOU ') + nome);
  if (!cond) falhas++;
}

// carrega na mesma ordem do index.html
const ctx = {};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(raiz, 'js/data/corridasPredefinidas.js'), 'utf8'), ctx);
vm.runInContext(fs.readFileSync(path.join(raiz, 'js/data/corridaMfit.js'), 'utf8'), ctx);
const REG = vm.runInContext('CORRIDAS_PREDEFINIDAS', ctx);
const PACOTE = vm.runInContext('CORRIDA_MFIT', ctx);

console.log('\n--- o pacote se registra ---');
ok(!!REG[PACOTE.fonte], 'a ficha aparece no registro sob o próprio fonte');
const entrada = REG[PACOTE.fonte] || {};
ok(typeof entrada.label === 'string' && entrada.label.length > 0, 'tem label pro card');
ok(typeof entrada.descricao === 'string' && entrada.descricao.length > 0, 'tem descrição');
ok(entrada.pessoal === true, 'marcado como pessoal — não aparece pra quem não é o dono');
ok(entrada.planos === PACOTE.planos, 'o registro aponta pros mesmos planos, sem cópia solta');

console.log('\n--- cada plano tem os campos que corrida_planos usa ---');
const CAMPOS = ['nome', 'tipo', 'distanceKm', 'timeMin', 'descricao'];
let faltando = 0;
PACOTE.planos.forEach(p => CAMPOS.forEach(c => { if (!(c in p)) { console.log('    falta', c, 'em', p.nome); faltando++; } }));
ok(faltando === 0, 'todos os planos têm nome, tipo, distanceKm, timeMin e descricao');
ok(PACOTE.planos.every(p => p.nome && p.nome.trim()), 'nenhum plano sem nome (o upsert casa por nome)');
ok(PACOTE.planos.every(p => p.descricao && p.descricao.trim().length > 30), 'todos trazem o protocolo escrito');
ok(PACOTE.planos.every(p => p.tipo && p.tipo.trim()), 'todos têm tipo, que é o resumo do card');

console.log('\n--- distância e tempo ficam nulos de propósito ---');
ok(PACOTE.planos.every(p => p.distanceKm === null), 'distanceKm null em todos');
ok(PACOTE.planos.every(p => p.timeMin === null), 'timeMin null em todos');
// A tela só mostra o botão "Usar" quando um dos dois existe — é isso que impede o app de
// sugerir um total inventado como se fosse a meta do treino.
const treino = fs.readFileSync(path.join(raiz, 'js/views/treino.js'), 'utf8');
ok(/\(p\.distanceKm \|\| p\.timeMin\) \?/.test(treino), 'o botão "Usar" depende de haver distância ou tempo');

console.log('\n--- a numeração é a da ficha, com os buracos ---');
const nums = PACOTE.planos.map(p => Number((p.nome.match(/Corrida (\d+)/) || [])[1]));
ok(nums.every(n => Number.isInteger(n)), 'todo plano traz o número da ficha no nome');
ok(JSON.stringify(nums) === JSON.stringify([1, 2, 4, 5, 7, 8, 10, 11]),
  'são os treinos 1,2,4,5,7,8,10,11 — 3, 6 e 9 são longões e ficaram de fora');
ok(nums.length === new Set(nums).size, 'sem número repetido');

console.log('\n--- a recuperação está dita em cada treino ---');
// Regra que a ficha não escreve e o Victor confirmou: recuperação só com tempo é PARADA;
// com distância ou ritmo é correndo leve. Sem isso no texto, dois treinos muito diferentes
// (o 8 e o 4) ficam indistinguíveis na tela.
ok(PACOTE.planos.every(p => /PARADO|CORRENDO/.test(p.descricao)),
  'toda descrição diz se a recuperação é parada ou correndo');

console.log('\n--- registro separado do de musculação ---');
const semMusc = vm.runInContext('typeof TREINOS_PREDEFINIDOS', ctx);
ok(semMusc === 'undefined', 'corridasPredefinidas.js não depende do registro de musculação');
const decl = fs.readFileSync(path.join(raiz, 'js/data/corridasPredefinidas.js'), 'utf8');
ok(/const CORRIDAS_PREDEFINIDAS = \{\};/.test(decl), 'o registro nasce vazio, sem pacote genérico inventado');

console.log('\n--- a tela e o roteamento existem ---');
const mais = fs.readFileSync(path.join(raiz, 'js/views/mais.js'), 'utf8');
const app = fs.readFileSync(path.join(raiz, 'js/app.js'), 'utf8');
ok(/case 'corrida-pacotes': return renderCorridaPacotes/.test(mais), 'a subtela está no roteador de Mais');
ok(/'corrida-pacotes': 'Pacotes de corrida'/.test(app), 'tem título em SUB_TITLES, senão o topbar cai no da aba');
ok(/goToSub\('corrida-pacotes'\)/.test(mais), 'há um caminho que abre a tela');
ok(/pacotesCorridaVisiveis\(\)\.length > 0/.test(mais), 'a entrada some quando não há pacote visível');

console.log('\n--- o carregamento grava em corrida_planos, por upsert ---');
const tela = mais.slice(mais.indexOf('function renderCorridaPacotes'), mais.indexOf('function renderTreinoPacotes'));
ok(/Storage\.saveAll\('corrida_planos'/.test(tela), 'grava na coleção de corrida, não na de musculação');
ok(/findIndex\(x => \(x\.nome \|\| ''\)\.trim\(\)\.toLowerCase\(\)/.test(tela), 'casa por nome: recarregar atualiza em vez de duplicar');
ok(/plano\.ordem = locais\[j\]\.ordem/.test(tela), 'quem já existia mantém a posição na lista');
ok(/fonte: id/.test(tela), 'grava de qual pacote veio');
ok(/api\.back\(\)/.test(tela), 'volta pra raiz depois de carregar, onde o resultado aparece');

console.log('\n--- os scripts entram no index.html, na ordem certa ---');
const html = fs.readFileSync(path.join(raiz, 'index.html'), 'utf8');
const iReg = html.indexOf('js/data/corridasPredefinidas.js');
const iPac = html.indexOf('js/data/corridaMfit.js');
ok(iReg > 0, 'corridasPredefinidas.js está no index');
ok(iPac > 0, 'corridaMfit.js está no index');
ok(iReg < iPac, 'o registro carrega ANTES do pacote, senão ele não teria onde se registrar');

console.log(falhas === 0 ? '\nTODOS OS TESTES PASSARAM\n' : `\n${falhas} TESTE(S) FALHARAM\n`);
process.exit(falhas === 0 ? 0 : 1);
