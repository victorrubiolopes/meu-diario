// Estimativa de gasto de atividade — equações do ACSM e valores líquidos.
//
// Nasceu de uma revisão da fórmula antiga, que tinha três problemas somados:
//   1. corrida por regra de bolso (peso x km x 1,036), ignorando o ritmo. Pra corrida ela é
//      boa, mas pra CAMINHADA errava 46% pra cima;
//   2. musculação por MET fixo, mas em valor BRUTO;
//   3. os dois brutos, incluindo o metabolismo basal — e o relatório punha esse número ao
//      lado do TDEE, que já contém o basal, convidando à dupla contagem.
//
// O que este teste trava:
//   - as duas equações do ACSM, com o corte entre caminhada e corrida;
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

console.log('\n--- caminhada usa a outra equação, e é aí que a fórmula antiga errava ---');
// 5 km em 60 min = 83,3 m/min, abaixo do corte: VO2 líquido = 0,1 x 83,3 = 8,33.
// kcal = 8,33 x 83 / 1000 x 5 x 60 = ~207.
const caminhada = kcalCorrida(5, 60, PESO);
ok(perto(caminhada, 207, 10), `5 km em 60 min ≈ 207 kcal (deu ${caminhada.toFixed(0)})`);
const regraAntiga = PESO * 5 * 1.036;
ok(caminhada < regraAntiga * 0.65, `muito abaixo da regra antiga (${regraAntiga.toFixed(0)} kcal), que era o bug`);

console.log('\n--- o corte entre caminhada e corrida está em 134 m/min ---');
// 8,04 km/h = 134 m/min. Logo acima usa a equação de corrida, logo abaixo a de caminhada,
// e o salto entre as duas é real (o custo de correr é o dobro por metro).
const logoAcima = kcalCorrida(134 / 1000 * 60, 60, PESO);   // 8,04 km em 60 min
const logoAbaixo = kcalCorrida(133 / 1000 * 60, 60, PESO);  // 7,98 km em 60 min
ok(logoAcima > logoAbaixo * 1.7, 'cruzar o corte quase dobra o gasto, como as equações preveem');

console.log('\n--- é líquido: sem movimento, não há gasto de atividade ---');
ok(kcalCorrida(0, 60, PESO) === 0, 'distância zero não gera caloria');
ok(kcalCorrida(10, 0, PESO) === 0, 'tempo zero não gera caloria');
ok(kcalCorrida(10, 60, 0) === 0, 'sem peso não dá pra estimar');

console.log('\n--- musculação: MET líquido sobre a duração ---');
// (5 - 1) x 83 x 1h = 332 kcal. O -1 é o repouso, que sai fora.
const musc60 = kcalMusc(60, PESO);
ok(perto(musc60, 332, 5), `1 hora ≈ 332 kcal (deu ${musc60.toFixed(0)})`);
ok(perto(kcalMusc(30, PESO), musc60 / 2, 1), 'escala linear com a duração');
const bruto = 5 * PESO * 1;
ok(musc60 < bruto, `abaixo do bruto (${bruto.toFixed(0)}), porque o basal foi descontado`);

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
ok(perto(dia.musculacao, 332, 5), 'musculação separada');
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
ok(/localStorage\.setItem\('gastos_recalculados_acsm', '1'\)/.test(app), 'roda uma vez só');

console.log('\n--- o número não entra no orçamento do dia ---');
// Decisão de produto: a meta prescrita já pressupõe os treinos, e somar gasto de exercício
// por cima transformaria a prescrição em outra coisa, com um número que erra fácil 30%.
const inicio = fs.readFileSync(path.join(raiz, 'js/views/inicio.js'), 'utf8');
ok(!/meta\.kcal \+ gastoExtra|gastoExtra \+ meta\.kcal/.test(inicio),
  'o restante do dia segue sendo meta menos consumido, sem somar o treino');

console.log(falhas === 0 ? '\nTODOS OS TESTES PASSARAM\n' : `\n${falhas} TESTE(S) FALHARAM\n`);
process.exit(falhas === 0 ? 0 : 1);
