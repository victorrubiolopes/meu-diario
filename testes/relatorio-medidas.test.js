// Seção de peso e composição do relatório para IA/treinador.
//
// Nasceu de um caso real: o backup JSON foi mandado pra IA de um nutricionista e as medidas
// "não apareceram". Elas estavam lá — 14 registros —, mas eram 0,7% de um arquivo de 560 KB
// cujos 38% são catálogo da biblioteca. O relatório é a ferramenta certa pra isso, e a seção
// de peso dele dizia só "85,3kg → 83,6kg".
//
// Duas garantias que o teste trava:
//   1. o histórico NÃO é cortado pelo período — medição é esparsa, e o recorte de 15/30/90
//      dias joga fora justamente a janela longa, a única que vence o ruído da bioimpedância;
//   2. massa gorda e magra são calculadas — é o que diferencia "não funcionou" de
//      "recomposição", e o peso sozinho esconde isso.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const raiz = path.join(__dirname, '..');
const ARQS = ['js/util.js', 'js/data/alimentos.js', 'js/data/dietas.js', 'js/views/tarefas.js', 'js/views/mais.js'];
const src = ARQS.map(f => fs.readFileSync(path.join(raiz, f), 'utf8')).join('\n;\n');
const { ViewMais } = vm.runInNewContext('(function(){' + src + '; return { ViewMais };})()', { console });

let falhas = 0;
function ok(cond, nome) {
  console.log((cond ? '  OK    ' : '  FALHOU ') + nome);
  if (!cond) falhas++;
}

// Dados sintéticos: duas medições antigas (fora de qualquer recorte) e uma recente.
// A antiga mais velha é de 2020 de propósito — nenhum período razoável a alcançaria.
const dados = {
  perfil: { idade: 30, altura: 175, peso: 80, sexo: 'masculino', nivelAtividade: 'moderado' },
  medidas: [
    { date: '2020-01-10', weight: 90, bodyFat: 25, waist: 95, abdomen: 100 },
    { date: '2020-06-10', weight: 86, bodyFat: 22 },
    { date: '2020-11-10', weight: 84, bodyFat: 20, waist: 88, abdomen: 92, hip: 100, chest: 99, thigh: 60, arm: 35 },
    { date: '2020-12-01', waist: 87 },                    // só fita, sem peso
  ],
  alimentacao: [], treino: [], corridas: [], agua: [], gastos: [],
  tarefas: [], tarefas_conclusoes: [], dietas_custom: [],
};

const rel = ViewMais.gerarRelatorio(15, dados);
const sec = rel.slice(rel.indexOf('== Peso e composição =='), rel.indexOf('== Alimentação =='));

console.log('\n--- o histórico escapa do recorte do período ---');
ok(sec.includes('10/01/2020'), 'medição de 2020 aparece num relatório de 15 dias');
ok(sec.includes('01/12/2020'), 'medição só com fita métrica (sem peso) também aparece');
ok(/4 medições/.test(sec), 'conta todas as medições, não as do período');
ok(/fora do recorte de 15 dias de propósito/.test(sec), 'diz explicitamente que não cortou');

console.log('\n--- massa gorda e magra são calculadas ---');
// 90kg a 25% → 22,5 de gordura e 67,5 de magra. 84kg a 20% → 16,8 e 67,2.
ok(sec.includes('22.5') && sec.includes('67.5'), 'composição da primeira medição (90kg/25%)');
ok(sec.includes('16.8') && sec.includes('67.2'), 'composição da última medição (84kg/20%)');
ok(/massa gorda\s+22\.5 → 16\.8 kg \(-5\.7\)/.test(sec), 'resumo da massa gorda com a variação');
ok(/massa magra\s+67\.5 → 67\.2 kg \(-0\.3\)/.test(sec), 'resumo da massa magra com a variação');
ok(/95% da variação de peso foi gordura/.test(sec), 'calcula quanto da variação foi gordura');

console.log('\n--- campo ausente não vira zero ---');
const linha2020_06 = sec.split('\n').find(l => l.startsWith('10/06/2020'));
ok(!!linha2020_06, 'achou a linha da medição sem fita');
ok((linha2020_06.match(/—/g) || []).length === 6, 'as 6 medidas de fita ausentes saem como travessão, não 0');

console.log('\n--- a ressalva da bioimpedância vai junto ---');
ok(/bioimpedância/.test(sec), 'menciona o método');
ok(/±2-3 pontos percentuais/.test(sec), 'declara o erro típico');
ok(/só a tendência longa é sinal/.test(sec), 'avisa pra não ler ruído como mudança');
ok(/Peso\/%gordura\/magra\/gorda em kg; demais em cm/.test(sec), 'declara as unidades da tabela');

console.log('\n--- variação de peso perto de zero não vira divisão sem sentido ---');
const parado = JSON.parse(JSON.stringify(dados));
parado.medidas = [
  { date: '2020-01-10', weight: 84.0, bodyFat: 20 },
  { date: '2020-11-10', weight: 84.1, bodyFat: 19 },
];
const secParado = (r => r.slice(r.indexOf('== Peso e composição =='), r.indexOf('== Alimentação ==')))(ViewMais.gerarRelatorio(15, parado));
ok(/massa gorda/.test(secParado), 'ainda mostra a composição');
ok(!/% da variação de peso foi gordura/.test(secParado), 'omite o percentual quando o peso mal mudou');

console.log('\n--- sem medidas, não quebra ---');
const vazio = JSON.parse(JSON.stringify(dados));
vazio.medidas = [];
const secVazio = (r => r.slice(r.indexOf('== Peso e composição =='), r.indexOf('== Alimentação ==')))(ViewMais.gerarRelatorio(15, vazio));
ok(/Sem registros de peso no período/.test(secVazio), 'diz que não há registro');
ok(!/Histórico completo/.test(secVazio), 'não imprime tabela vazia');
ok(!/NaN|undefined/.test(secVazio), 'sem NaN nem undefined');

console.log('\n--- o relatório inteiro continua pequeno ---');
ok(!/NaN|undefined/.test(rel), 'relatório completo sem NaN nem undefined');
ok(rel.length < 20000, `cabe numa conversa com IA (${rel.length} caracteres)`);

console.log(falhas === 0 ? '\nTODOS OS TESTES PASSARAM\n' : `\n${falhas} TESTE(S) FALHARAM\n`);
process.exit(falhas === 0 ? 0 : 1);
