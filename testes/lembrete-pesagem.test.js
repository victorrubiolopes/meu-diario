// lembrarPesagem(): aviso no sininho nos dias de pesagem escolhidos no perfil.
// Extrai a função do app.js e roda sem DOM, com localStorage simulado.
const fs = require('fs');
const path = require('path');
const raiz = path.join(__dirname, '..');
const store = {};
globalThis.localStorage = {
  getItem: k => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: k => { delete store[k]; },
};
eval(fs.readFileSync(path.join(raiz, 'js/storage.js'), 'utf8').replace(/^const Storage/, 'globalThis.Storage'));

// Util só precisa das três funções que lembrarPesagem usa.
let HOJE = '2026-09-21'; // segunda
globalThis.Util = {
  todayISO: () => HOJE,
  weekdayOf: d => { const [y, m, dd] = d.split('-').map(Number); return new Date(y, m - 1, dd).getDay(); },
};

const app = fs.readFileSync(path.join(raiz, 'js/app.js'), 'utf8');
const i = app.indexOf('function lembrarPesagem');
let d = 0;
let fim = i;
for (let k = app.indexOf('{', i); k < app.length; k++) {
  if (app[k] === '{') d++;
  else if (app[k] === '}') { d--; if (d === 0) { fim = k + 1; break; } }
}
eval('globalThis.lembrarPesagem = ' + app.slice(i, fim).replace(/^function /, 'function '));

let falhas = 0;
const check = (c, m) => { if (!c) falhas++; console.log((c ? '  OK   ' : '  FALHA') + '  ' + m); };
const reset = () => { Object.keys(store).forEach(k => delete store[k]); };
const avisos = () => Storage.getAll('notificacoes').filter(n => n.tipo === 'peso');

console.log('\nDIA MARCADO E SEM PESO -> CRIA AVISO');
reset(); Storage.savePerfil({ diasPesagem: [1, 4] }); HOJE = '2026-09-21';
lembrarPesagem();
check(avisos().length === 1, 'criou 1 aviso na segunda');
check(avisos()[0].titulo === 'Dia de pesagem', 'com o título certo');

console.log('\nABRIR O APP DE NOVO NÃO DUPLICA');
lembrarPesagem(); lembrarPesagem(); lembrarPesagem();
check(avisos().length === 1, 'continua 1 depois de 4 aberturas');

console.log('\nDIA NÃO MARCADO -> NADA');
reset(); Storage.savePerfil({ diasPesagem: [1, 4] }); HOJE = '2026-09-22'; // terça
lembrarPesagem();
check(avisos().length === 0, 'terça não gera aviso');

console.log('\nJÁ PESOU HOJE -> NADA');
reset(); Storage.savePerfil({ diasPesagem: [1, 4] }); HOJE = '2026-09-21';
Storage.add('medidas', { date: HOJE, weight: 84.1 });
lembrarPesagem();
check(avisos().length === 0, 'peso já registrado não gera aviso');

console.log('\nREGISTRO DE MEDIDA SEM PESO NÃO CONTA COMO PESAGEM');
reset(); Storage.savePerfil({ diasPesagem: [1, 4] }); HOJE = '2026-09-21';
Storage.add('medidas', { date: HOJE, waist: 87 });
lembrarPesagem();
check(avisos().length === 1, 'só cintura lançada -> ainda avisa pra pesar');

console.log('\nAVISO FALSO SE DESFAZ QUANDO A SINCRONIZAÇÃO TRAZ O PESO');
reset(); Storage.savePerfil({ diasPesagem: [1, 4] }); HOJE = '2026-09-21';
lembrarPesagem();                                   // boot: ainda não sincronizou
check(avisos().length === 1, 'boot criou o aviso (aparelho ainda não sabe do peso)');
Storage.add('medidas', { date: HOJE, weight: 84.1 }); // chega da nuvem
lembrarPesagem();                                   // roda de novo pós-sync
check(avisos().length === 0, 'pós-sync o aviso sumiu, em vez de mentir o dia inteiro');

console.log('\nNENHUM DIA MARCADO -> RECURSO DESLIGADO');
reset(); Storage.savePerfil({ diasPesagem: [] }); HOJE = '2026-09-21';
lembrarPesagem();
check(avisos().length === 0, 'lista vazia não avisa');
reset(); Storage.savePerfil({}); lembrarPesagem();
check(avisos().length === 0, 'perfil sem o campo não quebra nem avisa');

console.log('\nAVISO DE ONTEM NÃO SEGURA O DE HOJE');
reset(); Storage.savePerfil({ diasPesagem: [1, 4] });
HOJE = '2026-09-17'; lembrarPesagem();              // quinta
HOJE = '2026-09-21'; lembrarPesagem();              // segunda seguinte
check(avisos().length === 2, 'cada dia tem o seu: ' + avisos().map(a => a.data).join(', '));

console.log('\n' + (falhas === 0 ? 'TODOS OS TESTES PASSARAM' : falhas + ' TESTE(S) FALHARAM'));
process.exit(falhas ? 1 : 0);
