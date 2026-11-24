// Protocolo de medição do GET.
//
// A nutri estimou 2.750 kcal (TMB 1.833 x fator 1,5); o histórico de peso aponta ~2.360.
// Em vez de discutir, ela montou o experimento: comer um valor fixo, registrar tudo, pesar
// todo dia, não mudar exercício. Esta tela faz a conta.
//
//   GET = média de ingestão − (variação de peso em kg/dia × 7.700)
//
// O teste monta dias SINTÉTICOS com um GET conhecido e confere se a conta o recupera. É a
// única forma de validar isso: no mundo real ninguém sabe a resposta certa de antemão — que
// é justamente o motivo da tela existir.
//
// O que este teste trava:
//   - a conta recupera um GET conhecido, nos dois sentidos (perdendo e ganhando peso);
//   - dia SEM registro alimentar fica de fora da média, nunca entra como zero;
//   - o resultado vem com intervalo, e o intervalo cresce com o ruído da balança;
//   - com poucos pontos NÃO existe estimativa (2 pontos dariam erro zero = precisão falsa);
//   - o veredito só diz "conclusivo" quando o intervalo é estreito;
//   - o resumo pra nutri nunca mostra o número sem o intervalo junto.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const raiz = path.join(__dirname, '..');
let falhas = 0;
function ok(cond, nome) {
  console.log((cond ? '  OK    ' : '  FALHOU ') + nome);
  if (!cond) falhas++;
}

const ctx = { console, window: {}, document: {}, navigator: {} };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(raiz, 'js/util.js'), 'utf8'), ctx);
vm.runInContext('var Storage = { getPerfil: () => ({}), savePerfil: () => {}, getAll: () => [] };', ctx);
vm.runInContext('var drawLineChart = () => {};', ctx);
vm.runInContext(fs.readFileSync(path.join(raiz, 'js/views/protocolo.js'), 'utf8'), ctx);
const P = vm.runInContext('ViewProtocolo', ctx);
const Util = vm.runInContext('Util', ctx);

// Gera um protocolo onde a VERDADE é conhecida: a pessoa come `ingestao` por dia e o gasto
// real é `getReal`, então o peso anda (ingestao - getReal)/7700 por dia. `ruido` imita a
// oscilação de hidratação/intestino que a balança mostra mesmo sem mudança de gordura.
function simular({ getReal, ingestao, dias, pesoInicial, ruido = 0, pularRegistro = [] }) {
  const inicio = '2026-11-24';
  const deltaDia = (ingestao - getReal) / P.KCAL_POR_KG;
  const pesos = [];
  const ingestoes = [];
  // Ruído determinístico (sem Math.random): teste que falha de vez em quando não serve.
  const onda = i => Math.sin(i * 2.399963) * ruido;
  for (let i = 0; i < dias; i++) {
    const date = Util.addDaysISO(inicio, i);
    pesos.push({ date, peso: pesoInicial + deltaDia * i + onda(i) });
    if (!pularRegistro.includes(i)) ingestoes.push({ date, kcal: ingestao });
  }
  return { inicio, pesos, ingestoes, hoje: Util.addDaysISO(inicio, dias - 1) };
}

console.log('\n--- a conta recupera um gasto conhecido ---');
{
  // Pessoa com gasto REAL de 2.360 comendo 2.400: sobra 40 kcal/dia, engorda devagar.
  const s = simular({ getReal: 2360, ingestao: 2400, dias: 14, pesoInicial: 87.9 });
  const r = P.calcular({ pesos: s.pesos, ingestoes: s.ingestoes, vet: 2400, inicio: s.inicio, dias: 14, hoje: s.hoje });
  ok(Math.abs(r.get - 2360) <= 1, `gasto real 2.360 → calculado ${r.get}`);
  ok(r.inclinacaoDia > 0, 'detecta que o peso está subindo');
}
{
  // Mesma pessoa se o gasto fosse o da fórmula: 2.750 comendo 2.400 → emagrece.
  const s = simular({ getReal: 2750, ingestao: 2400, dias: 14, pesoInicial: 87.9 });
  const r = P.calcular({ pesos: s.pesos, ingestoes: s.ingestoes, vet: 2400, inicio: s.inicio, dias: 14, hoje: s.hoje });
  ok(Math.abs(r.get - 2750) <= 1, `gasto real 2.750 → calculado ${r.get}`);
  ok(r.inclinacaoDia < 0, 'detecta que o peso está caindo');
}

console.log('\n--- peso estável significa gasto igual à ingestão ---');
{
  const s = simular({ getReal: 2400, ingestao: 2400, dias: 14, pesoInicial: 87.9 });
  const r = P.calcular({ pesos: s.pesos, ingestoes: s.ingestoes, vet: 2400, inicio: s.inicio, dias: 14, hoje: s.hoje });
  ok(Math.abs(r.get - 2400) <= 1, `peso parado → GET = ingestão (${r.get})`);
}

console.log('\n--- dia sem registro NÃO entra como zero ---');
{
  // Se um dia sem registro virasse 0 kcal, a média despencaria e o GET sairia absurdo —
  // e o erro apareceria justamente em quem esqueceu de lançar, que é a situação comum.
  const s = simular({ getReal: 2360, ingestao: 2400, dias: 14, pesoInicial: 87.9, pularRegistro: [3, 7, 11] });
  const r = P.calcular({ pesos: s.pesos, ingestoes: s.ingestoes, vet: 2400, inicio: s.inicio, dias: 14, hoje: s.hoje });
  ok(r.mediaIngestao === 2400, `média usa só os dias lançados (${r.mediaIngestao})`);
  ok(r.diasComComida === 11 && r.diasComPeso === 14, 'e a tela expõe quantos dias faltaram (11 de 14)');
  ok(Math.abs(r.get - 2360) <= 1, 'o GET continua certo apesar dos dias sem registro');
}

console.log('\n--- o resultado vem com intervalo, e o ruído alarga ele ---');
{
  const limpo = simular({ getReal: 2360, ingestao: 2400, dias: 14, pesoInicial: 87.9, ruido: 0.1 });
  const sujo = simular({ getReal: 2360, ingestao: 2400, dias: 14, pesoInicial: 87.9, ruido: 0.8 });
  const a = P.calcular({ pesos: limpo.pesos, ingestoes: limpo.ingestoes, vet: 2400, inicio: limpo.inicio, dias: 14, hoje: limpo.hoje });
  const b = P.calcular({ pesos: sujo.pesos, ingestoes: sujo.ingestoes, vet: 2400, inicio: sujo.inicio, dias: 14, hoje: sujo.hoje });
  ok(a.margem != null && b.margem != null, 'sempre acompanha margem');
  ok(b.margem > a.margem, `balança mais oscilante → intervalo maior (${a.margem} → ${b.margem} kcal)`);
  ok(a.getMin < a.get && a.get < a.getMax, 'o intervalo cerca a estimativa');
}

console.log('\n--- mais dias estreitam o intervalo ---');
{
  const curto = simular({ getReal: 2360, ingestao: 2400, dias: 14, pesoInicial: 87.9, ruido: 0.5 });
  const longo = simular({ getReal: 2360, ingestao: 2400, dias: 28, pesoInicial: 87.9, ruido: 0.5 });
  const a = P.calcular({ pesos: curto.pesos, ingestoes: curto.ingestoes, vet: 2400, inicio: curto.inicio, dias: 14, hoje: curto.hoje });
  const b = P.calcular({ pesos: longo.pesos, ingestoes: longo.ingestoes, vet: 2400, inicio: longo.inicio, dias: 28, hoje: longo.hoje });
  ok(b.margem < a.margem, `14 dias → ${a.margem} kcal; 28 dias → ${b.margem} kcal`);
  ok(!a.conclusivo, 'com esse ruído, 14 dias NÃO fecham — é o ponto que a tela precisa dizer');
  ok(a.faltamDias > 0, `e ela estima quantos dias faltam (${a.faltamDias})`);
}

console.log('\n--- poucos pontos: sem estimativa, não "precisão infinita" ---');
{
  // Com 2 pesagens a reta passa exata nos dois pontos e o erro daria ZERO: a tela anunciaria
  // um GET cravado no segundo dia de protocolo. Por isso a regressão exige 3.
  ok(P.regressao([{ x: 0, y: 88 }, { x: 1, y: 87.9 }]) === null, '2 pontos não geram reta');
  const s = simular({ getReal: 2360, ingestao: 2400, dias: 2, pesoInicial: 87.9 });
  const r = P.calcular({ pesos: s.pesos, ingestoes: s.ingestoes, vet: 2400, inicio: s.inicio, dias: 14, hoje: s.hoje });
  ok(r.get === null && r.margem === null, 'e a tela não mostra GET nenhum');
  ok(/não há dados suficientes/i.test(P.resumoTexto(r)), 'o resumo diz que faltam dados');
}

console.log('\n--- o contador de dias nunca fica menor que os dados ---');
{
  // Bug pego no navegador: a tela dizia "9 de 1". O numerador vinha dos dados lançados e o
  // denominador do calendário, então peso com data de amanhã — ou relógio do aparelho
  // atrasado — produzia uma fração impossível.
  const s = simular({ getReal: 2360, ingestao: 2400, dias: 14, pesoInicial: 87.9 });
  const r = P.calcular({ pesos: s.pesos, ingestoes: s.ingestoes, vet: 2400, inicio: s.inicio, dias: 14, hoje: s.inicio });
  ok(r.decorridos >= r.diasComPeso && r.decorridos >= r.diasComComida,
    `decorridos (${r.decorridos}) nunca menor que os dias com dado (${r.diasComPeso})`);
  ok(r.decorridos <= 14, 'e nunca passa da duração combinada');
}

console.log('\n--- as duas médias, do jeito que a nutri pediu ---');
{
  const s = simular({ getReal: 2750, ingestao: 2400, dias: 14, pesoInicial: 87.9 });
  const r = P.calcular({ pesos: s.pesos, ingestoes: s.ingestoes, vet: 2400, inicio: s.inicio, dias: 14, hoje: s.hoje });
  ok(r.semana1 != null && r.semanaFinal != null, 'calcula as duas médias semanais');
  ok(r.variacaoSemanal < 0, 'em déficit, a média da última semana é menor');
  // Déficit de 350/dia → ~0,32 kg entre médias separadas por 7 dias.
  ok(Math.abs(r.variacaoSemanal + 0.32) < 0.02, `variação ${r.variacaoSemanal.toFixed(2)} kg bate com a previsão de -0,32`);
}

console.log('\n--- aderência ao alvo é reportada, mas não entra na conta ---');
{
  // A conta usa o que foi COMIDO, não o que foi planejado. Mas comer longe do alvo muda o
  // que a conclusão significa pro plano, então o desvio aparece na tela.
  const s = simular({ getReal: 2360, ingestao: 2650, dias: 14, pesoInicial: 87.9 });
  const r = P.calcular({ pesos: s.pesos, ingestoes: s.ingestoes, vet: 2400, inicio: s.inicio, dias: 14, hoje: s.hoje });
  ok(Math.abs(r.get - 2360) <= 1, 'o GET sai certo mesmo comendo acima do alvo');
  ok(r.desvioDoAlvo === 250, `e o desvio aparece (+${r.desvioDoAlvo} kcal/dia)`);
}

console.log('\n--- o resumo nunca entrega o número sozinho ---');
{
  const s = simular({ getReal: 2360, ingestao: 2400, dias: 14, pesoInicial: 87.9, ruido: 0.5 });
  const r = P.calcular({ pesos: s.pesos, ingestoes: s.ingestoes, vet: 2400, inicio: s.inicio, dias: 14, hoje: s.hoje });
  const txt = P.resumoTexto(r);
  ok(/GET estimado: \d+ kcal\/dia \(intervalo \d+ a \d+\)/.test(txt), 'GET sempre com intervalo ao lado');
  ok(/Dias com registro alimentar: \d+/.test(txt), 'diz quantos dias foram registrados');
  ok(/7\.700/.test(txt) && /reta de tendência/.test(txt), 'explica a conta pra nutri poder conferir');
  ok(!r.conclusivo && /ainda não é confiável/.test(txt), 'e avisa quando o número ainda não vale');
}

console.log('\n--- a tela está ligada na navegação ---');
const mais = fs.readFileSync(path.join(raiz, 'js/views/mais.js'), 'utf8');
const app = fs.readFileSync(path.join(raiz, 'js/app.js'), 'utf8');
const html = fs.readFileSync(path.join(raiz, 'index.html'), 'utf8');
ok(/protocolo: 'Protocolo'/.test(app) && /'protocolo-config': 'Ajustar protocolo'/.test(app),
  'as duas subViews têm título no topbar');
ok(/case 'protocolo': return ViewProtocolo\.render/.test(mais), 'Mais despacha pra tela');
ok(/js\/views\/protocolo\.js\?v=/.test(html), 'o script entra no index com cache-bust');
ok(html.indexOf('js/views/protocolo.js') < html.indexOf('js/views/mais.js'), 'carrega antes de quem o chama');
ok(!/api\.render\(\)/.test(mais.slice(mais.indexOf("case 'protocolo'"), mais.indexOf("case 'protocolo'") + 200)),
  'o dispatch não força render');

console.log(falhas === 0 ? '\nTODOS OS TESTES PASSARAM\n' : `\n${falhas} TESTE(S) FALHARAM\n`);
process.exit(falhas === 0 ? 0 : 1);
