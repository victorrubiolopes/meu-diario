// Simula localStorage e roda storage.js + a mesclagem do cloud.js
const fs = require('fs');
const store = {};
globalThis.localStorage = {
  getItem: k => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: k => { delete store[k]; },
};
eval(fs.readFileSync(__dirname + '/../js/storage.js', 'utf8').replace(/^const Storage/, 'globalThis.Storage'));

// extrai só as funções de mesclagem do cloud.js
const src = fs.readFileSync(__dirname + '/../js/cloud.js', 'utf8');
const SYNC_KEYS = ['treino','corridas','alimentacao','medidas','tarefas','tarefas_conclusoes',
  'dietas_custom','treino_planos','corrida_planos','combos','agua','gastos','refeicao_fotos',
  'refeicoes_livres','exames_resultados','notificacoes'];
const corta = (nome) => {
  const i = src.indexOf('function ' + nome);
  let d = 0, j = src.indexOf('{', i);
  for (let k = j; k < src.length; k++) {
    if (src[k] === '{') d++;
    else if (src[k] === '}') { d--; if (d === 0) return src.slice(i, k + 1); }
  }
};
eval('globalThis.mesclarListas = ' + corta('mesclarListas'));
eval('globalThis.mesclarSnapshot = ' + corta('mesclarSnapshot'));

const ok = (cond, msg) => console.log((cond ? '  OK   ' : '  FALHA') + '  ' + msg);
let falhas = 0;
const check = (cond, msg) => { if (!cond) falhas++; ok(cond, msg); };

// ---------- CENÁRIO REAL: café da manhã de 31/08 ----------
console.log('\nCENARIO 1 — o que aconteceu de verdade em 31/08');
// Celular: registra o cafe
Storage.add('alimentacao', { date: '2026-08-31', mealType: 'cafe', foodName: 'Tapioca 50g', kcal: 89 });
Storage.add('alimentacao', { date: '2026-08-31', mealType: 'cafe', foodName: 'Ovo 100g', kcal: 146 });
const celular = JSON.parse(JSON.stringify({ alimentacao: Storage.getAll('alimentacao'), _apagados: [] }));
console.log('  celular registrou ' + celular.alimentacao.length + ' itens de cafe');

// PC: copia velha, SEM o cafe (so tem um registro antigo de ontem)
Object.keys(store).forEach(k => delete store[k]);
Storage.add('alimentacao', { date: '2026-08-30', mealType: 'jantar', foodName: 'Marmita', kcal: 492 });
console.log('  PC tinha ' + Storage.getAll('alimentacao').length + ' registro antigo, nenhum de 31/08');

// PC abre e mescla com a nuvem (que tem o snapshot do celular)
const mesclado = mesclarSnapshot(celular);
const hoje = mesclado.alimentacao.filter(a => a.date === '2026-08-31');
check(hoje.length === 2, 'o cafe da manha SOBREVIVE no PC (' + hoje.length + ' itens de 31/08)');
check(mesclado.alimentacao.length === 3, 'e o registro antigo do PC tambem fica (total ' + mesclado.alimentacao.length + ')');

// ---------- EDICAO CONCORRENTE ----------
console.log('\nCENARIO 2 — mesmo registro editado nos dois lados');
Object.keys(store).forEach(k => delete store[k]);
const r = Storage.add('medidas', { date: '2026-08-31', weight: 84.3 });
const idMedida = r.id;
const nuvem = { medidas: [{ ...r, weight: 99.9, _upd: r._upd + 5000 }], _apagados: [] };
const m2 = mesclarSnapshot(nuvem);
check(m2.medidas.length === 1, 'nao duplica o registro');
check(m2.medidas[0].weight === 99.9, 'a versao MAIS NOVA (nuvem) vence: ' + m2.medidas[0].weight);

console.log('\nCENARIO 3 — versao local mais nova vence a da nuvem');
Object.keys(store).forEach(k => delete store[k]);
const r3 = Storage.add('medidas', { date: '2026-08-31', weight: 84.3 });
Storage.update('medidas', r3.id, { weight: 85.0 });
const nuvem3 = { medidas: [{ ...r3, weight: 70.0 }], _apagados: [] };
const m3 = mesclarSnapshot(nuvem3);
check(m3.medidas[0].weight === 85.0, 'fica a local mais nova: ' + m3.medidas[0].weight);

// ---------- EXCLUSAO NAO RESSUSCITA ----------
console.log('\nCENARIO 4 — item apagado nao volta a vida');
Object.keys(store).forEach(k => delete store[k]);
const a1 = Storage.add('alimentacao', { date: '2026-08-31', foodName: 'Pizza', kcal: 972 });
const copiaNuvem = { alimentacao: [JSON.parse(JSON.stringify(a1))], _apagados: [] };
Storage.remove('alimentacao', a1.id);
check(Storage.getAll('alimentacao').length === 0, 'apagou localmente');
const m4 = mesclarSnapshot(copiaNuvem);
check(m4.alimentacao.length === 0, 'a nuvem ainda tinha o item, mas a lapide impede o retorno');

console.log('\nCENARIO 5 — exclusao feita no OUTRO aparelho chega aqui');
Object.keys(store).forEach(k => delete store[k]);
const a5 = Storage.add('alimentacao', { date: '2026-08-31', foodName: 'Pipoca', kcal: 540 });
const nuvem5 = { alimentacao: [], _apagados: [{ key: 'alimentacao', id: a5.id, ts: Date.now() }] };
const m5 = mesclarSnapshot(nuvem5);
check(m5.alimentacao.length === 0, 'o item some tambem neste aparelho');
check(Storage.apagados().some(t => t.id === a5.id), 'e a lapide fica guardada localmente');

// ---------- REGISTRO LEGADO SEM _upd ----------
console.log('\nCENARIO 6 — registros antigos, de antes do carimbo _upd');
Object.keys(store).forEach(k => delete store[k]);
Storage.saveAll('alimentacao', [{ id: 'velho1', date: '2026-08-01', kcal: 100 }]);
const nuvem6 = { alimentacao: [{ id: 'velho2', date: '2026-08-02', kcal: 200 }], _apagados: [] };
const m6 = mesclarSnapshot(nuvem6);
check(m6.alimentacao.length === 2, 'os dois entram, nenhum e descartado por falta de _upd');

console.log('\nCENARIO 7 — mesclar duas vezes nao duplica (idempotente)');
Object.keys(store).forEach(k => delete store[k]);
Storage.add('alimentacao', { date: '2026-08-31', foodName: 'Whey', kcal: 120 });
const n7 = { alimentacao: Storage.getAll('alimentacao'), _apagados: [] };
const p1 = mesclarSnapshot(n7);
Storage.saveAll('alimentacao', p1.alimentacao);
const p2 = mesclarSnapshot(n7);
check(p2.alimentacao.length === 1, 'continua 1 registro depois de duas mesclagens');

// ---------- COPIA DE SEGURANCA ----------
console.log('\nCENARIO 8 — copia de seguranca');
Object.keys(store).forEach(k => delete store[k]);
Storage.add('alimentacao', { date: '2026-08-31', foodName: 'Cafe', kcal: 326 });
const c = Storage.salvarCopiaSeguranca('teste');
check(!!c && c.registros === 1, 'guardou a copia com 1 registro');
Storage.saveAll('alimentacao', []);
check(Storage.getAll('alimentacao').length === 0, 'diario esvaziado');
Storage.restaurarCopiaSeguranca(c.id);
check(Storage.getAll('alimentacao').length === 1, 'restaurou o registro');
check(Storage.copiasSeguranca().length === 1, 'nao gastou um slot guardando o estado VAZIO que foi substituido');
// mas se o estado atual tiver algo, ele vira copia antes de ser substituido
Storage.add('alimentacao', { date: '2026-09-01', foodName: 'Novo', kcal: 50 });
Storage.restaurarCopiaSeguranca(c.id);
check(Storage.copiasSeguranca().length === 2, 'estado NAO vazio vira copia antes de restaurar (da pra desfazer)');
check(Storage.copiasSeguranca()[0].registros === 2, 'e a copia guardada tem os 2 registros que existiam');
Object.keys(store).forEach(k => delete store[k]);
check(Storage.salvarCopiaSeguranca('vazio') === null, 'nao guarda copia de diario vazio');

// ---------- CARIMBO EM ESCRITA QUE NAO PASSA POR add/update ----------
console.log('\nCENARIO 9 — saveAll direto (tela que monta a lista na mao) carimba _upd');
Object.keys(store).forEach(k => delete store[k]);
const n9 = Storage.add('notificacoes', { texto: 'oi', lida: false });
const updAntes = Storage.getAll('notificacoes')[0]._upd;
// simula "marcar todas como lidas" do mais.js:313 — saveAll direto, sem update()
const depois = Storage.getAll('notificacoes').map(x => ({ ...x, lida: true }));
// garante que o relogio andou, senao o teste nao distingue
const alvo = Date.now() + 2; while (Date.now() < alvo) { /* espera 2ms */ }
Storage.saveAll('notificacoes', depois);
const updDepois = Storage.getAll('notificacoes')[0]._upd;
check(updDepois > updAntes, 'mudou o conteudo -> _upd novo (' + updAntes + ' -> ' + updDepois + ')');

console.log('\nCENARIO 10 — saveAll sem mudanca NAO mexe no carimbo');
const iguais = Storage.getAll('notificacoes');
const alvo2 = Date.now() + 2; while (Date.now() < alvo2) { /* espera 2ms */ }
Storage.saveAll('notificacoes', iguais);
check(Storage.getAll('notificacoes')[0]._upd === updDepois, 'conteudo igual -> _upd preservado');

console.log('\nCENARIO 11 — sem o carimbo do saveAll, a edicao do outro aparelho era desfeita');
Object.keys(store).forEach(k => delete store[k]);
const c11 = Storage.add('combos', { nome: 'R2 Cafe', itens: ['antigo'] });
const copiaB = JSON.parse(JSON.stringify(Storage.getAll('combos')));  // aparelho B, versao antiga
const alvo3 = Date.now() + 2; while (Date.now() < alvo3) { /* espera 2ms */ }
// aparelho A recarrega a meta: monta o combo na mao e grava com saveAll (mais.js:894)
Storage.saveAll('combos', [{ ...c11, itens: ['novo'] }]);
const nuvemA = JSON.parse(JSON.stringify({ combos: Storage.getAll('combos'), _apagados: [] }));
// Aparelho B abre. A versao velha dele JA ESTAVA no disco — escrever de volta pelo saveAll
// carimbaria como recente (e estaria certo: reescrever conteudo diferente E uma edicao).
// Pra simular "ja estava la", grava direto no localStorage, sem passar pelo saveAll.
localStorage.setItem(Storage.KEYS.combos, JSON.stringify(copiaB));
check(Storage.getAll('combos')[0].itens[0] === 'antigo', 'B esta com a versao antiga antes de mesclar');
const m11 = mesclarSnapshot(nuvemA);
check(m11.combos[0].itens[0] === 'novo', 'a versao editada em A vence em B: ' + m11.combos[0].itens[0]);

console.log('\n' + (falhas === 0 ? 'TODOS OS TESTES PASSARAM' : falhas + ' TESTE(S) FALHARAM'));
process.exit(falhas ? 1 : 0);
