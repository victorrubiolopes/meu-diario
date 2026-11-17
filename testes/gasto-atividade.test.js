// Estimativa de gasto de atividade — equações do ACSM e valores líquidos.
//
// Nasceu de uma revisão da fórmula antiga, que tinha três problemas somados:
//   1. corrida por regra de bolso (peso x km x 1,036), ignorando o ritmo. Pra corrida ela é
//      boa, mas pra CAMINHADA errava 46% pra cima;
//   2. musculação por MET fixo, mas em valor BRUTO;
//   3. os dois brutos, incluindo o metabolismo basal — e o relatório punha esse número ao
//      lado do TDEE, que já contém o basal, convidando à dupla contagem.
//
// Depois, a exportação do relógio (Garmin, 30/10 a 17/11) mediu caloria, FC média e duração
// de 12 sessões reais e reprovou duas escolhas da primeira versão:
//   - o corte por velocidade MÉDIA em 134 m/min subestimava pela metade os intervalados,
//     porque o descanso parado derruba a média sem mudar o custo por km;
//   - MET 5 pra musculação era vigoroso demais: o medido dá 3,6-3,9 BRUTO (FC média de 86 a
//     100 bpm, um terço da sessão em movimento), ou seja o 3,5 moderado do Compêndio.
//
// O que este teste trava:
//   - a equação de corrida do ACSM e a invariância do custo por km, contra os 4 casos medidos;
//   - que o ramo de caminhada não voltou (é ele que quebra o intervalado);
//   - o MET de musculação contra as 8 sessões de força medidas;
//   - que o resultado é LÍQUIDO (zera quando não há movimento acima do repouso);
//   - que treino sem duração informada não vira caloria inventada;
//   - a separação por modalidade que o relatório usa.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const raiz = path.join(__dirname, '..');
let falhas = 0;
function ok(cond, nome) {
  console.log((cond ? '  OK    ' : '  FALHOU ') + nome);
  if (!cond) falhas++;
}
function perto(a, b, tol) { return Math.abs(a - b) <= tol; }

const ctx = { Storage: { getByDate: () => [], getAll: () => [] }, Util: { getPesoAtual: () => null }, console };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(raiz, 'js/data/dietas.js'), 'utf8'), ctx);
const kcalCorrida = vm.runInContext('kcalCorridaLiquido', ctx);
const kcalMusc = vm.runInContext('kcalMusculacaoLiquido', ctx);
const detalhar = vm.runInContext('detalharGastoEstimado', ctx);

const PESO = 83;

console.log('\n--- corrida: equação do ACSM, não regra de bolso ---');
// 10 km em 60 min = 166,7 m/min. VO2 líquido = 0,2 x 166,7 = 33,3 mL/kg/min.
// kcal = 33,3 x 83 / 1000 x 5 x 60 = ~830.
//
// Na equação do ACSM o termo da velocidade cancela com a distância, então o custo LÍQUIDO
// da corrida dá exatamente 1,0 kcal/kg/km, qualquer que seja o ritmo — é essa invariância
// que faz a regra de bolso antiga funcionar pra corrida e desandar pra caminhada, onde o
// coeficiente é a metade.
const corrida10k = kcalCorrida(10, 60, PESO);
ok(perto(corrida10k, 830, 15), `10 km em 60 min ≈ 830 kcal (deu ${corrida10k.toFixed(0)})`);
ok(perto(corrida10k / (PESO * 10), 1.0, 0.02), 'dá 1,0 kcal por kg por km, o líquido da corrida');
const corridaRapida = kcalCorrida(10, 45, PESO);
ok(perto(corridaRapida / (PESO * 10), 1.0, 0.02), 'o mesmo 1,0 kcal/kg/km correndo mais rápido — o custo por km não muda');

console.log('\n--- NÃO existe mais ramo de caminhada: era ele o bug do intervalado ---');
// A versão anterior escolhia entre caminhada (0,1 x velocidade) e corrida (0,2) pela
// velocidade MÉDIA, com corte em 134 m/min. Os treinos intervalados da ficha do Victor têm
// descanso PARADO: o tempo parado soma minuto e não soma distância, então a média cai abaixo
// do corte e o gasto caía pela metade, embora o custo por km seja o de corrida.
//
// Os quatro casos medidos pelo relógio. O de 12/11 é o que caía no ramo errado.
const MEDIDOS = [
  { data: '17/11', km: 5.20, min: 35.6, kcalKmRelogio: 91.3 },
  { data: '10/11', km: 5.88, min: 43.1, kcalKmRelogio: 93.7 },
  { data: '07/11', km: 3.15, min: 22.7, kcalKmRelogio: 85.7 },
  { data: '12/11', km: 3.93, min: 31.2, kcalKmRelogio: 91.9 },  // 126 m/min: abaixo do corte
];
MEDIDOS.forEach(m => {
  const porKm = kcalCorrida(m.km, m.min, PESO) / m.km;
  ok(perto(porKm, PESO * 1.0, 1),
    `${m.data} (${Math.round(m.km * 1000 / m.min)} m/min): ${porKm.toFixed(0)} kcal/km — o mesmo em qualquer ritmo`);
});
// O relógio dá o BRUTO (inclui o basal do tempo da sessão); o nosso é líquido, então o nosso
// tem que ficar ABAIXO do medido, e por pouco.
MEDIDOS.forEach(m => {
  const porKm = kcalCorrida(m.km, m.min, PESO) / m.km;
  ok(porKm < m.kcalKmRelogio && porKm > m.kcalKmRelogio * 0.85,
    `${m.data}: ${porKm.toFixed(0)} kcal/km líquido fica logo abaixo dos ${m.kcalKmRelogio} brutos do relógio`);
});
// E o caso que antes quebrava: 12/11 não pode mais valer metade de uma corrida mais rápida.
const lenta = kcalCorrida(3.93, 31.2, PESO) / 3.93;
const rapida = kcalCorrida(5.20, 35.6, PESO) / 5.20;
ok(perto(lenta, rapida, 0.5), 'a corrida de média baixa custa por km o mesmo que a rápida');

console.log('\n--- a fonte da equação não pode voltar a olhar velocidade média ---');
const dietas = fs.readFileSync(path.join(raiz, 'js/data/dietas.js'), 'utf8');
ok(!/VEL_CORRIDA_MIN/.test(dietas), 'a constante do corte saiu do arquivo');
ok(!/0\.1 \* velocidade/.test(dietas), 'o coeficiente de caminhada não é mais aplicado a corrida');

console.log('\n--- é líquido: sem movimento, não há gasto de atividade ---');
ok(kcalCorrida(0, 60, PESO) === 0, 'distância zero não gera caloria');
ok(kcalCorrida(10, 0, PESO) === 0, 'tempo zero não gera caloria');
ok(kcalCorrida(10, 60, 0) === 0, 'sem peso não dá pra estimar');

console.log('\n--- musculação: MET 3,5 do Compêndio, calibrado contra o relógio ---');
// (3,5 - 1) x 83 x 1h = 207,5 kcal. O -1 é o repouso, que sai fora.
const musc60 = kcalMusc(60, PESO);
ok(perto(musc60, 207.5, 5), `1 hora ≈ 208 kcal (deu ${musc60.toFixed(0)})`);
ok(perto(kcalMusc(30, PESO), musc60 / 2, 1), 'escala linear com a duração');
const bruto = 3.5 * PESO * 1;
ok(musc60 < bruto, `abaixo do bruto (${bruto.toFixed(0)}), porque o basal foi descontado`);

// Antes era MET 5, que dava 332 kcal/h líquidas. As 8 sessões de força medidas pelo relógio
// (BRUTAS, com basal dentro) mostram que aquilo era alto: a nossa estimativa líquida ficava
// ACIMA do bruto medido, o que é impossível. Com 3,5 ela fica entre 50% e 90% do bruto —
// a faixa que sobra depois de tirar o basal, e que o MET 5 estourava.
const FORCA_MEDIDA = [
  { data: '01/11', min: 43.3, kcalRelogio: 257 },
  { data: '11/11', min: 46.5, kcalRelogio: 264 },
  { data: '03/11', min: 38.3, kcalRelogio: 213 },
  { data: '30/10', min: 50.9, kcalRelogio: 278 },
  { data: '05/11', min: 40.0, kcalRelogio: 212 },
  { data: '08/11', min: 47.1, kcalRelogio: 248 },
  { data: '15/11', min: 38.9, kcalRelogio: 167 },
  { data: '13/11', min: 69.6, kcalRelogio: 286 },
];
FORCA_MEDIDA.forEach(s => {
  const nosso = kcalMusc(s.min, PESO);
  const r = nosso / s.kcalRelogio;
  ok(r > 0.5 && r < 0.9,
    `${s.data}: ${nosso.toFixed(0)} líquidas contra ${s.kcalRelogio} brutas do relógio (${(r * 100).toFixed(0)}%)`);
});
ok(/const MET_MUSCULACAO = 3\.5;/.test(dietas), 'o MET está documentado como 3,5 na fonte');

console.log('\n--- treino sem duração não vira caloria inventada ---');
ok(kcalMusc(0, PESO) === 0, 'duração zero não gera caloria');
ok(kcalMusc(undefined, PESO) === 0, 'duração ausente não gera caloria');
const semDuracao = detalhar('2026-11-17', { peso: PESO, corridas: [], treino: [{ date: '2026-11-17' }] });
ok(semDuracao.musculacao === 0, 'um treino registrado sem duração soma zero, não um chute');

console.log('\n--- separação por modalidade, que o relatório usa ---');
const dia = detalhar('2026-11-17', {
  peso: PESO,
  corridas: [{ date: '2026-11-17', distanceKm: 10, timeMin: 60 }],
  treino: [{ date: '2026-11-17', duracaoMin: 60 }],
});
ok(perto(dia.corrida, 830, 15), 'corrida separada');
ok(perto(dia.musculacao, 207.5, 5), 'musculação separada');
ok(dia.total === dia.corrida + dia.musculacao, 'o total é a soma das duas');
const outroDia = detalhar('2026-11-18', {
  peso: PESO,
  corridas: [{ date: '2026-11-17', distanceKm: 10, timeMin: 60 }],
  treino: [],
});
ok(outroDia.total === 0, 'só conta o que é do dia pedido');
ok(detalhar('2026-11-17', { peso: null, corridas: [], treino: [] }).total === 0, 'sem peso, devolve zero em vez de NaN');

console.log('\n--- o relatório conta certo e diz a origem certa ---');
const mais = fs.readFileSync(path.join(raiz, 'js/views/mais.js'), 'utf8');
ok(/const gastoMedio = dias > 0 \? gastoTotal \/ dias : null;/.test(mais),
  'divide pelos dias do PERÍODO, não só pelos dias com registro');
ok(!/Calorias extras gastas \(manual\)/.test(mais),
  'não rotula mais como "manual" um número que quase sempre é estimado');
ok(/Houve atividade em \$\{diasComAtividade\} de \$\{dias\} dias/.test(mais),
  'separa a média do período da média dos dias com treino');
ok(/LÍQUIDOS \(acima do repouso\)/.test(mais),
  'avisa que o valor é líquido, pra quem for somar ao TDEE');

console.log('\n--- a migração recalcula o histórico, sem pisar no manual ---');
const app = fs.readFileSync(path.join(raiz, 'js/app.js'), 'utf8');
const mig = app.slice(app.indexOf('gastos_recalculados_acsm'));
ok(/if \(g\.source === 'manual'/.test(mig), 'pula os valores ajustados à mão');
ok(/localStorage\.setItem\('gastos_recalculados_acsm_v2', '1'\)/.test(app), 'roda uma vez só');
// A chave tem que mudar quando a fórmula muda, senão quem já migrou fica com a régua velha.
ok(!/getItem\('gastos_recalculados_acsm'\)/.test(app), 'a chave da v1 não é mais consultada');

console.log('\n--- o número não entra no orçamento do dia ---');
// Decisão de produto: a meta prescrita já pressupõe os treinos, e somar gasto de exercício
// por cima transformaria a prescrição em outra coisa, com um número que erra fácil 30%.
const inicio = fs.readFileSync(path.join(raiz, 'js/views/inicio.js'), 'utf8');
ok(!/meta\.kcal \+ gastoExtra|gastoExtra \+ meta\.kcal/.test(inicio),
  'o restante do dia segue sendo meta menos consumido, sem somar o treino');

console.log(falhas === 0 ? '\nTODOS OS TESTES PASSARAM\n' : `\n${falhas} TESTE(S) FALHARAM\n`);
process.exit(falhas === 0 ? 0 : 1);
