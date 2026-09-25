#!/usr/bin/env node
// Deposita uma refeição já calculada na caixa de entrada do app (coleção 'caixaEntrada').
// Quem aplica no diário é o próprio app, no navegador do dono, quando ele abre — ver
// 'aplicarCaixaEntrada' em js/cloud.js. Esta ferramenta só deposita.
//
// Existe pra fechar o caminho "mando a foto do prato no chat e a refeição aparece no app":
// o cálculo acontece fora, e o resultado chega sem a pessoa precisar copiar, colar ou tocar.
//
// O QUE ELA NÃO CONSEGUE FAZER, por desenho das regras do Firestore:
//   - ler o diário, as medidas, os exames ou qualquer outra coisa (a conta do agente não tem
//     'allow read' em lugar nenhum);
//   - editar ou apagar um depósito já feito;
//   - escrever em 'users/{uid}', que continua gravável só pelo próprio dono.
// Credencial vazada insere refeição indevida — visível no sino e desfazível — e nada além.
//
// USO:
//   node ferramentas/depositar-refeicao.js --uid <UID> --data 2026-09-25 --ref Almoço \
//        --itens "ceviche 105g
//   batata inglesa assada 115g
//   miolo de alcatra grelhado 100g"
//
//   --dry-run  monta e mostra o depósito sem enviar (confere o parse antes de gastar rede)
//
// VARIÁVEIS DE AMBIENTE (nunca no repositório, nunca no chat):
//   DIARIO_AGENTE_EMAIL  e-mail da conta dedicada do agente
//   DIARIO_AGENTE_SENHA  senha dessa conta

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAIZ = path.join(__dirname, '..');
const CONFIG = vm.runInNewContext(
  fs.readFileSync(path.join(RAIZ, 'js/firebase-config.js'), 'utf8') + '; FIREBASE_CONFIG', {}
);
const ParsePlano = require(path.join(RAIZ, 'js/parse-plano.js'));

// Mesma biblioteca que o app usa. Ler daqui garante que o item depositado tem exatamente os
// mesmos números que apareceriam se a pessoa digitasse o alimento na tela.
function bibliotecaPadrao() {
  const src = fs.readFileSync(path.join(RAIZ, 'js/data/alimentos.js'), 'utf8');
  return vm.runInNewContext('(function(){' + src + '; return ALIMENTOS_PADRAO;})()', { console });
}

const MEAL_TYPES = ['Café da manhã', 'Almoço', 'Lanche', 'Jantar', 'Outro'];
const CAMPOS_ITEM = ['foodName', 'qty', 'kcal', 'carbs', 'sugars', 'protein', 'fat', 'satFat', 'transFat', 'fiber', 'sodium'];

function args() {
  const a = process.argv.slice(2);
  const o = { dryRun: a.includes('--dry-run') };
  for (let i = 0; i < a.length; i++) {
    if (a[i] === '--uid') o.uid = a[++i];
    else if (a[i] === '--data') o.data = a[++i];
    else if (a[i] === '--ref') o.ref = a[++i];
    else if (a[i] === '--itens') o.itens = a[++i];
  }
  return o;
}

// Firestore REST quer os valores tipados. Só os tipos que o depósito usa.
function paraFirestore(v) {
  if (typeof v === 'string') return { stringValue: v };
  if (typeof v === 'number') return { doubleValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(paraFirestore) } };
  if (v && typeof v === 'object') {
    const fields = {};
    Object.keys(v).forEach(k => { fields[k] = paraFirestore(v[k]); });
    return { mapValue: { fields } };
  }
  return { nullValue: null };
}

async function entrar(email, senha) {
  const r = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${CONFIG.apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: senha, returnSecureToken: true }),
    }
  );
  const d = await r.json();
  if (!r.ok) throw new Error(`Login do agente falhou: ${(d.error && d.error.message) || r.status}`);
  return d.idToken;
}

async function depositar(idToken, doc) {
  const url = `https://firestore.googleapis.com/v1/projects/${CONFIG.projectId}/databases/(default)/documents/caixaEntrada`;
  const fields = {};
  Object.keys(doc).forEach(k => { fields[k] = paraFirestore(doc[k]); });
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ fields }),
  });
  const d = await r.json();
  if (!r.ok) {
    const msg = (d.error && d.error.message) || r.status;
    // 403 aqui quase sempre é a regra ainda não publicada no Console, ou o UID do agente
    // ainda no valor de exemplo dentro do firestore.rules.
    throw new Error(`Depósito recusado: ${msg}`);
  }
  return d.name.split('/').pop();
}

(async () => {
  const o = args();
  if (!o.uid || !o.itens) {
    console.error('Faltou --uid ou --itens. Veja o cabeçalho deste arquivo.');
    process.exit(2);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(o.data || '')) {
    console.error('--data precisa ser AAAA-MM-DD.');
    process.exit(2);
  }
  if (!MEAL_TYPES.includes(o.ref)) {
    console.error(`--ref precisa ser um de: ${MEAL_TYPES.join(', ')}`);
    process.exit(2);
  }

  const { itens, avisos } = ParsePlano.parseRefeicaoSolta(o.itens, bibliotecaPadrao());

  // Aviso do parser é alimento que não entrou. Depositar assim mandaria uma refeição
  // incompleta pro diário sem ninguém perceber — é o oposto da regra "erra alto, nunca some".
  if (avisos.length) {
    console.error('NÃO depositei. O parser não entendeu estas linhas:');
    avisos.forEach(a => console.error('  ⚠️  ' + a));
    process.exit(1);
  }
  if (!itens.length) { console.error('NÃO depositei: nenhum alimento reconhecido.'); process.exit(1); }
  if (itens.length > 40) { console.error(`NÃO depositei: ${itens.length} itens, o limite da regra é 40.`); process.exit(1); }

  // Só os campos que a regra aceita: um item com chave extra faria o Firestore recusar
  // o depósito inteiro.
  const limpos = itens.map(i => {
    const x = {};
    CAMPOS_ITEM.forEach(c => { if (i[c] !== undefined) x[c] = i[c]; });
    return x;
  });

  const doc = {
    uid: o.uid, date: o.data, mealType: o.ref,
    itens: limpos, criadoEm: Date.now(), origem: 'claude',
  };

  const total = limpos.reduce((s, i) => s + (i.kcal || 0), 0);
  const prot = limpos.reduce((s, i) => s + (i.protein || 0), 0);
  console.log(`${o.ref} de ${o.data} — ${limpos.length} itens`);
  limpos.forEach(i => console.log(`  ${i.foodName} (${i.qty}x) — ${Math.round(i.kcal)} kcal`));
  console.log(`  TOTAL ${Math.round(total)} kcal · P ${prot.toFixed(1)}g`);

  if (o.dryRun) { console.log('\n--dry-run: nada foi enviado.'); return; }

  const email = process.env.DIARIO_AGENTE_EMAIL;
  const senha = process.env.DIARIO_AGENTE_SENHA;
  if (!email || !senha) {
    console.error('\nFaltam DIARIO_AGENTE_EMAIL e DIARIO_AGENTE_SENHA no ambiente.');
    process.exit(3);
  }

  const idToken = await entrar(email, senha);
  const id = await depositar(idToken, doc);
  console.log(`\n✅ Depositado (${id}). Entra no diário quando o app abrir, com aviso no sino.`);
})().catch(e => { console.error('\n' + e.message); process.exit(1); });
