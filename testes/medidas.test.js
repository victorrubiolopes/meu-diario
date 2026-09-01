// Comportamento das duas telas de Medidas, sem DOM: o que cada botão grava.
const fs = require('fs');
const store = {};
globalThis.localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k,v)=>{store[k]=String(v)}, removeItem: k=>{delete store[k]} };
eval(fs.readFileSync(__dirname + '/../js/storage.js','utf8').replace(/^const Storage/,'globalThis.Storage'));
let f=0; const check=(c,m)=>{if(!c)f++;console.log((c?'  OK   ':'  FALHA')+'  '+m);};

console.log('\nPESAR NAO APAGA A AVALIACAO DO MESMO DIA');
// avaliação completa lançada de manhã
const a = Storage.add('medidas', { date:'2026-09-01', weight:84.3, waist:87, abdomen:95.5, hip:108.8, arm:36, bodyFat:18.5, notes:'avaliação' });
// à noite ele só pesa (tela raiz: update parcial)
Storage.update('medidas', a.id, { weight: 84.0 });
const r = Storage.getByDate('medidas','2026-09-01')[0];
check(r.weight === 84.0, 'peso atualizado: ' + r.weight);
check(r.waist === 87 && r.abdomen === 95.5 && r.arm === 36, 'cintura, abdômen e braço preservados');
check(r.bodyFat === 18.5, '% de gordura preservado');
check(r.notes === 'avaliação', 'notas preservadas');

console.log('\nO CAMINHO INVERSO: PESAR PRIMEIRO, AVALIAR DEPOIS');
Object.keys(store).forEach(k=>delete store[k]);
const b = Storage.add('medidas', { date:'2026-09-02', weight:84.1 });
check(Storage.getByDate('medidas','2026-09-02')[0].waist === undefined, 'registro só com peso não inventa campos');
// tela de avaliação grava o formulário inteiro; vazio vira null de propósito
const FIELDS = ['weight','waist','neck','abdomen','chest','hip','arm','thigh','bodyFat','leanMass'];
const form = { weight:84.1, waist:87, abdomen:95, neck:null, chest:null, hip:null, arm:null, thigh:null, bodyFat:null, leanMass:null, notes:'' };
Storage.update('medidas', b.id, form);
const r2 = Storage.getByDate('medidas','2026-09-02')[0];
check(r2.weight === 84.1, 'peso da pesagem sobrevive à avaliação: ' + r2.weight);
check(r2.waist === 87, 'medidas novas entraram');
check(r2.neck === null, 'campo deixado em branco vira null (não medi), não some');

console.log('\nCARIMBO _upd NAS DUAS TELAS');
Object.keys(store).forEach(k=>delete store[k]);
const c = Storage.add('medidas', { date:'2026-09-03', weight:84.0 });
const u1 = Storage.getByDate('medidas','2026-09-03')[0]._upd;
const alvo = Date.now()+2; while (Date.now() < alvo) {}
Storage.update('medidas', c.id, { weight: 83.8 });
check(Storage.getByDate('medidas','2026-09-03')[0]._upd > u1, 'pesar recarimba (sincroniza entre aparelhos)');

console.log('\n' + (f===0 ? 'TODOS OS TESTES PASSARAM' : f+' TESTE(S) FALHARAM'));
process.exit(f?1:0);
