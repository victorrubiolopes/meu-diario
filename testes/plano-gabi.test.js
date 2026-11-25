// Plano alimentar da Gabi (23/11/2026) como PACOTE CARREGÁVEL, e os dois alimentos que
// faltavam na biblioteca.
//
// ONDE ISSO QUASE DEU ERRADO: a primeira versão entrou como combos em js/data/combos.js —
// o catálogo semente, que vai pra todo mundo. O projeto já tinha um molde pra prescrição
// (DIETA_VICTOR): pacote que só o dono vê, carregado à mão por um botão, com 'fonte' e
// 'profissional' pra marcar quem prescreveu. Prescrição de uma pessoa não é semente de app.
//
// POR QUE IMPORTA MAIS QUE O NORMAL: começou um protocolo de 14 dias que mede o gasto
// energético pela diferença entre o que foi comido e o que o peso andou. A conta depende da
// ingestão registrada ser verdadeira, e lançar item a item dá erro e dá preguiça.
//
// O que este teste trava:
//   - o plano NÃO é semeado: não entra em COMBOS_PADRAO;
//   - todo item aponta pra um alimento que existe (nome errado = item sem macro nenhum);
//   - os macros são exatamente biblioteca × qty — nenhum número digitado à mão nem
//     "ajustado" pra fechar com o relatório do PDF;
//   - as gramas são as que o plano prescreve;
//   - a divergência de ~80 kcal contra o PDF está escrita, não escondida nem forçada;
//   - os dois alimentos novos têm schema completo e procedência citada.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const raiz = path.join(__dirname, '..');
let falhas = 0;
function ok(cond, nome) {
  console.log((cond ? '  OK    ' : '  FALHOU ') + nome);
  if (!cond) falhas++;
}

const ctx = { console };
vm.createContext(ctx);
const fonteAlimentos = fs.readFileSync(path.join(raiz, 'js/data/alimentos.js'), 'utf8');
const fonteGabi = fs.readFileSync(path.join(raiz, 'js/data/dietaGabi.js'), 'utf8');
vm.runInContext(fonteAlimentos, ctx);
vm.runInContext(fs.readFileSync(path.join(raiz, 'js/data/combos.js'), 'utf8'), ctx);
vm.runInContext(fonteGabi, ctx);
const LIB = vm.runInContext('ALIMENTOS_PADRAO', ctx);
const COMBOS_PADRAO = vm.runInContext('COMBOS_PADRAO', ctx);
const G = vm.runInContext('DIETA_GABI', ctx);
const porNome = new Map(LIB.map(a => [a.name, a]));
const mais = fs.readFileSync(path.join(raiz, 'js/views/mais.js'), 'utf8');
const html = fs.readFileSync(path.join(raiz, 'index.html'), 'utf8');

console.log('\n--- prescrição é pacote, não semente ---');
ok(!COMBOS_PADRAO.some(c => /Gabi/i.test(c.nome)),
  'o plano NÃO está em COMBOS_PADRAO (aquilo vai pra todo mundo)');
ok(G.fonte === 'dieta-gabi-2026-11-23' && G.profissional === 'Gabrielle',
  'tem fonte e profissional, como os outros pacotes');
ok(/js\/data\/dietaGabi\.js\?v=/.test(html), 'entra no index com cache-bust');
ok(html.indexOf('js/data/dietaGabi.js') < html.indexOf('js/views/mais.js'), 'carrega antes de quem usa');

console.log('\n--- dá pra carregar, e recarregar não duplica ---');
ok(/id="carregar-dieta-gabi"/.test(mais), 'tem botão na tela de dietas prontas');
const handler = mais.slice(mais.indexOf("const btnGabi ="), mais.indexOf("const btnPacote ="));
ok(/combos\.findIndex\(x => \(x\.nome \|\| ''\)\.trim\(\)\.toLowerCase\(\)/.test(handler),
  'upsert por nome: recarregar atualiza em vez de criar segunda cópia');
ok(/fonte: DIETA_GABI\.fonte/.test(handler), 'carimba a fonte nos combos criados');
// O combo gravado leva só os 5 campos de lançamento. pdfPorRefeicao é documentação do
// arquivo e poluiria o registro do diário — mas a palavra aparece no COMENTÁRIO que explica
// isso, então a asserção olha o objeto construído, não o texto do arquivo.
const objCombo = handler.slice(handler.indexOf('const novo = {'), handler.indexOf('const j ='));
ok(/^const novo = \{ nome: c\.nome, horario: c\.horario, itens: c\.itens\.map\(i => \(\{ \.\.\.i \}\)\), fonte: DIETA_GABI\.fonte \};/.test(objCombo.trim()),
  'o combo gravado leva só nome, horário, itens e fonte — nada de dado de conferência');

console.log('\n--- o selo mostra quem prescreveu ---');
const origem = mais.slice(mais.indexOf('function origemCombo'), mais.indexOf('function combosListHtml'));
ok(/DIETA_GABI\.profissional/.test(origem), 'a Gabi aparece no selo');
ok(/fonte === DIETA_GABI\.fonte && DIETA_GABI\.profissional\) \{\s*return \{ nome: DIETA_GABI\.profissional, atual: true \}/.test(origem),
  'e é a prescrição ATUAL');
const trechoMeta = origem.slice(origem.indexOf('META_VICTOR'));
ok(/atual: false/.test(trechoMeta), 'o pacote anterior deixou de ser o atual');

console.log('\n--- os dois alimentos que faltavam ---');
const CAMPOS = ['portionLabel', 'portionGrams', 'kcal', 'carbs', 'sugars', 'protein', 'fat', 'satFat', 'transFat', 'fiber', 'sodium'];
['Leite de vaca desnatado em pó', 'Suco de uva integral (envasado)'].forEach(nome => {
  const f = porNome.get(nome);
  ok(!!f, `"${nome}" está na biblioteca`);
  if (!f) return;
  ok(CAMPOS.every(c => f[c] !== undefined), 'schema completo');
  ok(['proteina', 'carboidrato', 'fruta', 'legume', 'outro'].includes(f.categoria), 'categoria válida');
  // Coerência interna: as calorias têm que bater com os macros. Pega número digitado errado
  // melhor do que reler o valor.
  const porMacro = f.protein * 4 + f.carbs * 4 + f.fat * 9;
  ok(Math.abs(porMacro - f.kcal) / f.kcal < 0.12,
    `kcal coerente com os macros (${f.kcal} declarado vs ${porMacro.toFixed(0)} pelos macros)`);
  ok(f.sugars <= f.carbs && f.satFat <= f.fat, 'açúcares ≤ carboidratos e saturada ≤ gordura');
});

console.log('\n--- procedência: valor sem fonte é valor inventado ---');
ok(/TACO \(NEPA\/UNICAMP\)/.test(fonteAlimentos), 'o leite em pó cita a TACO');
ok(/rótulo do fabricante/.test(fonteAlimentos), 'o suco cita o rótulo do fabricante');
ok(/CONFERIR O RÓTULO/.test(fonteAlimentos), 'e manda conferir, porque suco de uva varia por marca');

console.log('\n--- as 6 refeições ---');
ok(G.combos.length === 6, `${G.combos.length} refeições`);
ok(JSON.stringify(G.combos.map(c => c.horario)) === JSON.stringify(['05:30', '08:00', '11:00', '12:00', '16:00', '19:00']),
  'nos horários do plano');

console.log('\n--- todo item existe na biblioteca ---');
const orfaos = [];
G.combos.forEach(c => c.itens.forEach(i => { if (!porNome.has(i.foodName)) orfaos.push(`${c.nome}: ${i.foodName}`); }));
ok(orfaos.length === 0, orfaos.length === 0 ? 'nenhum item órfão' : `órfãos: ${orfaos.join(' | ')}`);

console.log('\n--- nenhum macro foi digitado à mão ---');
const divergentes = [];
G.combos.forEach(c => c.itens.forEach(i => {
  const f = porNome.get(i.foodName);
  if (!f) return;
  ['kcal', 'carbs', 'sugars', 'protein', 'fat', 'satFat', 'transFat', 'fiber', 'sodium'].forEach(campo => {
    const esperado = Math.round((f[campo] || 0) * i.qty * 100) / 100;
    if (Math.abs(esperado - i[campo]) > 0.02) divergentes.push(`${i.foodName}.${campo}: ${i[campo]} ≠ ${esperado}`);
  });
}));
ok(divergentes.length === 0,
  divergentes.length === 0 ? 'todo item é biblioteca × qty' : `divergem: ${divergentes.slice(0, 4).join(' | ')}`);

console.log('\n--- as gramas batem com o PDF ---');
const PRESCRITO = {
  '05:30': { 'Banana nanica': 65, 'Doce de leite': 15 },
  '08:00': { 'Ovo cozido': 150, 'Pão de forma integral': 75, 'Mel de abelha': 15, 'Banana nanica': 65, 'Azeite de oliva': 8 },
  '11:00': { Uva: 120 },
  '12:00': { 'Peito de frango grelhado': 150, 'Arroz branco cozido': 180, 'Beterraba cozida': 120, 'Suco de uva integral (envasado)': 200, 'Azeite de oliva': 8 },
  '16:00': { 'Whey protein (pó)': 30, 'Banana nanica': 65, 'Leite de vaca desnatado em pó': 20, 'Farelo de aveia': 20 },
  '19:00': { 'Peito de frango grelhado': 150, 'Arroz branco cozido': 180, 'Brócolis cozido': 120, 'Azeite de oliva': 8 },
};
const gramasErradas = [];
G.combos.forEach(c => {
  const esp = PRESCRITO[c.horario] || {};
  if (c.itens.length !== Object.keys(esp).length) gramasErradas.push(`${c.horario}: ${c.itens.length} itens, esperado ${Object.keys(esp).length}`);
  c.itens.forEach(i => {
    const f = porNome.get(i.foodName);
    if (!f) return;
    const g = i.qty * f.portionGrams;
    if (Math.abs(g - esp[i.foodName]) > 0.5) gramasErradas.push(`${c.horario}/${i.foodName}: ${g.toFixed(0)}g ≠ ${esp[i.foodName]}g`);
  });
});
ok(gramasErradas.length === 0, gramasErradas.length === 0 ? 'todas as gramas conferem' : gramasErradas.join(' | '));

console.log('\n--- a divergência contra o PDF está registrada, não escondida ---');
// O ponto central: nenhum valor foi forçado pra fechar com outra tabela. A diferença fica
// documentada no arquivo E aparece na tela de carregamento.
const somaApp = G.combos.reduce((s, c) => s + c.itens.reduce((t, i) => t + i.kcal, 0), 0);
ok(Math.abs(somaApp - G.appTotal.kcal) < 2, `appTotal (${G.appTotal.kcal}) confere com a soma real (${somaApp.toFixed(0)})`);
ok(G.pdfTotal.kcal === 2425 && G.dieta.kcal === 2425, 'o total do PDF está registrado');
ok(G.appTotal.kcal < G.pdfTotal.kcal, 'e a conta do app dá menos — a diferença é conhecida');
ok(/NOTA DO FRANGO/.test(fonteGabi), 'o arquivo explica de onde vem a diferença');
ok(/inventar dado/.test(fonteGabi), 'e registra que nada foi forçado pra bater');
ok(/prot-alerta/.test(mais.slice(mais.indexOf('temGabi ?'), mais.indexOf('temPacote ? `'))),
  'a tela de carregamento avisa da diferença antes de carregar');
G.combos.forEach(c => ok(!!c.pdfPorRefeicao, `${c.horario} guarda o total do PDF pra conferência`));

console.log('\n--- o whey é o produto real, não o prescrito ---');
// O PDF pede whey ISOLADO; o que o Victor tem é concentrado (21g de proteína por dose
// contra ~27g de um isolado). O pacote leva o produto real, porque a conta do protocolo usa
// o que foi comido — mas a troca tem que estar documentada, já que a meta proteica está
// pendente de confirmação pelo histórico renal.
const lanche = G.combos.find(c => c.horario === '16:00');
const whey = lanche.itens.find(i => /whey/i.test(i.foodName));
ok(!!whey && /Dark Lab/.test(whey.foodName), 'o lanche da tarde usa o whey que ele tem de verdade');
ok(whey && whey.protein === 21, `21g de proteína por dose, do rótulo (não os 24 do genérico)`);
ok(/CONCENTRADO, não isolado/.test(fonteGabi) || /é CONCENTRADO/.test(fonteGabi),
  'o arquivo registra que é concentrado e não o isolado do PDF');
ok(/6g de proteína\/dia a menos/.test(fonteGabi),
  'e quantifica a diferença contra o que a nutri planejou');

console.log('\n--- as orientações do protocolo vieram junto ---');
ok(G.observacoes.length >= 6, `${G.observacoes.length} observações`);
ok(G.observacoes.some(o => /não são equivalentes em caloria/i.test(o)),
  'avisa que as substituições do PDF não são equivalentes');
ok(G.observacoes.some(o => /renal/i.test(o)), 'registra a pendência da meta proteica');
ok(G.protocolo.vet === 2400 && G.protocolo.dias === 14, 'guarda o alvo e a duração do protocolo');

console.log(falhas === 0 ? '\nTODOS OS TESTES PASSARAM\n' : `\n${falhas} TESTE(S) FALHARAM\n`);
process.exit(falhas === 0 ? 0 : 1);
