// Desfazer a remoção de exercício no meio do treino, e a restauração de cópia que JUNTA.
//
// Os dois nasceram do mesmo acidente: o Victor estava fazendo o treino e apagou alguns
// exercícios sem querer. O ✕ fica a um toque do campo do nome, e o persist() reescreve o
// registro do dia na hora — não havia de onde voltar.
//
// E o pior: o caminho que parecia ser a saída, "Restaurar cópia de segurança", prometia
// "o que você registrou depois continua lá" e fazia saveAll(copia), substituição total.
// Quem usasse pra recuperar um exercício apagado perderia o treino do dia inteiro, em
// silêncio. A perda era maior do que a que a pessoa estava consertando.
//
// O que este teste trava:
//   - a pilha de desfazer guarda a linha inteira e o índice, e devolve no lugar;
//   - linha sem nome não entra na pilha;
//   - a pilha não vai pro localStorage (é de uso imediato);
//   - restaurar JUNTA: id só na cópia volta, id repetido fica com a versão atual;
//   - o perfil só preenche o que falta, não sobrescreve a pesagem de hoje;
//   - os textos da tela dizem o que a função faz de verdade.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const raiz = path.join(__dirname, '..');
let falhas = 0;
function ok(cond, nome) {
  console.log((cond ? '  OK    ' : '  FALHOU ') + nome);
  if (!cond) falhas++;
}

const treino = fs.readFileSync(path.join(raiz, 'js/views/treino.js'), 'utf8');
const storageSrc = fs.readFileSync(path.join(raiz, 'js/storage.js'), 'utf8');
const mais = fs.readFileSync(path.join(raiz, 'js/views/mais.js'), 'utf8');
const css = fs.readFileSync(path.join(raiz, 'css/style.css'), 'utf8');

console.log('\n--- a pilha de desfazer existe e guarda o suficiente pra devolver ---');
ok(/const removidos = \[\]/.test(treino), 'há uma pilha de removidos');
ok(/removidos\.push\(\{ i, row: removida, placeholder \}\)/.test(treino),
  'guarda a linha INTEIRA e o índice — não só o nome');
ok(/if \(removida && removida\.name && removida\.name\.trim\(\) !== ''\)/.test(treino),
  'linha sem nome não entra na pilha');
ok(/rows\.splice\(Math\.min\(ult\.i, rows\.length\), 0, ult\.row\)/.test(treino),
  'devolve no índice de origem, e no fim se a lista encurtou');
ok(/const ult = removidos\.pop\(\)/.test(treino), 'desfaz do mais recente pro mais antigo');

console.log('\n--- a pilha é de uso imediato, não persiste ---');
// Sobreviver ao F5 significaria oferecer "desfazer" de um exercício apagado de propósito
// semanas atrás, em treino de outro dia.
const blocoRemovidos = treino.slice(treino.indexOf('const removidos = []'), treino.indexOf('content.innerHTML'));
ok(!/localStorage|Storage\.(add|update|saveAll)/.test(blocoRemovidos),
  'a pilha não é gravada em lugar nenhum');

console.log('\n--- a barra só aparece depois de remover algo ---');
ok(/if \(!removidos\.length\) return ''/.test(treino), 'sem remoção, não ocupa espaço na tela');
ok(/cardsEl\.innerHTML = desfazerHtml\(\) \+ rows\.map/.test(treino),
  'a barra é repintada junto com os cards');
ok(/\.ex-undo \{/.test(css), 'a barra tem estilo');
ok(!/var\(--warning/.test(css), 'usa só tokens de tema que existem');

console.log('\n--- remover não pode deixar a tela sem nenhum card ---');
const handlerRemove = treino.slice(treino.indexOf("cardsEl.querySelectorAll('[data-remove]')"), treino.indexOf("const undoBtn"));
ok(/rows\.push\(\{ name: '', sets: '', reps: '', weight: '', done: \[\] \}\)/.test(handlerRemove),
  'lista vazia ganha um card em branco');
ok(/ult\.placeholder && rows\.length === 1/.test(treino),
  'e esse card em branco é descartado quando o exercício volta');

console.log('\n--- restaurar cópia JUNTA, não substitui ---');
const ctx = { console, localStorage: criarLocalStorage() };
vm.createContext(ctx);
vm.runInContext(storageSrc, ctx);
const St = vm.runInContext('Storage', ctx);

// Estado 1: dois treinos. É daqui que a cópia é tirada.
const t1 = St.add('treino', { date: '2026-11-20', exercises: [{ name: 'Supino' }] });
const t2 = St.add('treino', { date: '2026-11-21', exercises: [{ name: 'Agachamento' }] });
St.savePerfil({ peso: 86.5, altura: 178, objetivo: 'emagrecer' });
const copia = St.salvarCopiaSeguranca('teste');
ok(!!copia, 'a cópia foi criada');

// Depois da cópia: apaga um treino (o acidente) e lança outro (o que não pode se perder).
St.remove('treino', t1.id);
const t3 = St.add('treino', { date: '2026-11-22', exercises: [{ name: 'Terra' }] });
// E muda o peso — a pesagem de hoje não pode voltar pro valor antigo.
St.savePerfil({ ...St.getPerfil(), peso: 85.2 });

ok(St.restaurarCopiaSeguranca(copia.id), 'restaurou');
const idsDepois = St.getAll('treino').map(t => t.id);
ok(idsDepois.includes(t1.id), 'o treino apagado por acidente VOLTOU');
ok(idsDepois.includes(t3.id), 'o treino lançado depois da cópia CONTINUA LÁ');
ok(idsDepois.filter(id => id === t2.id).length === 1,
  'treino que estava nos dois lados não duplicou');
ok(St.getPerfil().peso === 85.2, 'a pesagem de hoje não foi sobrescrita pela da cópia');
ok(St.getPerfil().objetivo === 'emagrecer', 'campo que só existia na cópia foi preenchido');

console.log('\n--- id repetido: vale a versão de agora ---');
const ctx2 = { console, localStorage: criarLocalStorage() };
vm.createContext(ctx2);
vm.runInContext(storageSrc, ctx2);
const St2 = vm.runInContext('Storage', ctx2);
const e1 = St2.add('treino', { date: '2026-11-21', exercises: [{ name: 'Supino', weight: '60' }] });
const c2 = St2.salvarCopiaSeguranca('teste');
St2.update('treino', e1.id, { exercises: [{ name: 'Supino', weight: '70' }] });
St2.restaurarCopiaSeguranca(c2.id);
const atual = St2.getAll('treino').find(t => t.id === e1.id);
ok(atual.exercises[0].weight === '70',
  'registro editado depois da cópia mantém o valor novo (restaurar não desfaz edição)');

console.log('\n--- antes de restaurar, guarda o estado atual ---');
ok(/salvarCopiaSeguranca\('antes de restaurar uma cópia'\)/.test(storageSrc),
  'restaurar a cópia errada também é perda — o atual fica guardado');

console.log('\n--- a tela diz o que a função faz de verdade ---');
// A versão antiga dizia "a sincronização junta os dois", o que terceirizava pra nuvem uma
// garantia que o código local não dava — e que não existia pra quem não está logado.
ok(!/a sincronização junta os dois/.test(mais), 'a promessa falsa saiu do confirm');
ok(/Restaurar <strong>junta<\/strong>/.test(mais), 'o card diz que junta');
ok(/desfazer uma <em>edição<\/em>/.test(mais), 'e diz o que NÃO faz');
// O texto do confirm é quebrado em duas strings concatenadas no fonte; junta antes de olhar.
const maisJuntado = mais.replace(/'\s*\+\s*'/g, '').replace(/\s+/g, ' ');
ok(/Nada do que você registrou depois é apagado/.test(maisJuntado),
  'o confirm afirma que nada do que veio depois é apagado');

function criarLocalStorage() {
  const m = new Map();
  return {
    getItem: k => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: k => m.delete(k),
  };
}

console.log(falhas === 0 ? '\nTODOS OS TESTES PASSARAM\n' : `\n${falhas} TESTE(S) FALHARAM\n`);
process.exit(falhas === 0 ? 0 : 1);
