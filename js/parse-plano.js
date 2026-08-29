// Leitura de treino e plano alimentar escritos em texto solto.
//
// Existe pra que a nutri não precise digitar exercício por exercício e alimento por
// alimento no painel: ela cola o plano como já escreveu (no WhatsApp, no caderno, no PDF)
// e o app monta as estruturas. O resultado NUNCA vai direto pro paciente — cai na mesma
// lista de montagem que já existia, pra ela conferir e mandar no botão de sempre.
//
// Duas regras que guiaram o desenho:
// 1. Erra alto, não silencioso. Linha que não dá pra entender, ou alimento que não existe
//    na biblioteca, vira aviso na tela — nunca some. Comer a linha de um plano alimentar
//    de paciente seria muito pior que recusar o texto.
// 2. Aceita o que a pessoa já escreve. Acento, maiúscula, "4x10" ou "4 x 10", "90s" ou
//    "1m30", "100g" ou "2 porções" — tudo isso é a mesma coisa.
const ParsePlano = (() => {

  // "Pão" e "PAO" têm que casar com "pao": tira acento, caixa e espaço sobrando.
  // O intervalo ̀-ͯ é o bloco de acentos combinantes que o NFD separa das letras.
  function normalizar(s) {
    return (s || '')
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toLowerCase().replace(/\s+/g, ' ').trim();
  }

  // Um bloco = um plano de treino ou uma refeição. Separados por linha em branco; a
  // primeira linha do bloco é o cabeçalho (nome, e horário no caso da refeição).
  function blocos(texto) {
    return (texto || '')
      .split(/\n\s*\n+/)
      .map(b => b.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('//')))
      .filter(b => b.length > 0);
  }

  // Tira marcador de lista ("- ", "1. ", "• ") do começo da linha.
  function semMarcador(l) {
    return l.replace(/^\s*(?:[-*•]|\d+[.)])\s+/, '').trim();
  }

  // ---------------- TREINO ----------------
  // Linha de exercício: nome + "4x10" + peso + descanso + observação. O que sobra depois
  // de extrair os padrões reconhecidos é o nome do exercício.
  //
  // Exemplos que precisam funcionar:
  //   Supino reto com barra 4x10 20kg 90s
  //   Agachamento livre 3 x 8-12 // desce devagar
  //   Prancha 3x30s
  //   Remada curvada 4x10 descanso 1m30s obs: pegada pronada
  function parseExercicio(linha) {
    let resto = ` ${linha} `;
    const ex = { name: '', sets: '', reps: '', weight: '', descanso: '', obs: '' };

    // Observação primeiro: tudo depois de "//", "#" ou "obs:" é texto livre e não deve
    // ser garimpado por número nenhum.
    const mObs = resto.match(/(?:\/\/|#|\bobs\s*:)\s*(.+)$/i);
    if (mObs) { ex.obs = mObs[1].trim(); resto = resto.slice(0, mObs.index) + ' '; }

    // Séries x reps. Reps pode ser faixa ("8-12"), tempo ("30s") ou palavra ("falha").
    // "3x até a falha" e "3x falha" são a mesma instrução — o "até a" no meio não pode
    // fazer a linha inteira deixar de ser reconhecida.
    const mSets = resto.match(/(\d+)\s*[xX]\s*(\d+\s*-\s*\d+|\d+\s*s\b|\d+|(?:at[ée]\s+a\s+)?falha|m[aá]xi?m?o?)/i);
    if (mSets) {
      ex.sets = mSets[1];
      ex.reps = /falha/i.test(mSets[2]) ? 'falha' : mSets[2].replace(/\s+/g, '');
      resto = resto.slice(0, mSets.index) + ' ' + resto.slice(mSets.index + mSets[0].length);
    }

    // Peso. Aceita vírgula decimal e ignora "kg" colado ou solto.
    const mPeso = resto.match(/(\d+(?:[.,]\d+)?)\s*kgs?\b/i);
    if (mPeso) {
      ex.weight = mPeso[1].replace(',', '.');
      resto = resto.slice(0, mPeso.index) + ' ' + resto.slice(mPeso.index + mPeso[0].length);
    }

    // Descanso: "90s", "1m30s", "1min30", "2 min". A palavra "descanso" é opcional.
    const mDesc = resto.match(/(?:descanso\s*:?\s*)?(\d+\s*m(?:in)?\s*\d*\s*s?|\d+\s*s(?:eg)?)\b/i);
    if (mDesc) {
      ex.descanso = mDesc[1].replace(/\s+/g, '').replace(/min/i, 'm').replace(/seg/i, 's');
      resto = resto.slice(0, mDesc.index) + ' ' + resto.slice(mDesc.index + mDesc[0].length);
    }

    ex.name = resto.replace(/\bdescanso\b/i, '').replace(/[-–—:,]+\s*$/, '').replace(/\s+/g, ' ').trim();
    return ex;
  }

  // Devolve { planos, avisos }. Avisos são linhas que não viraram exercício — quem chama
  // mostra na tela em vez de engolir.
  function parseTreino(texto) {
    const planos = [];
    const avisos = [];
    blocos(texto).forEach(linhas => {
      const nome = linhas[0].replace(/[:：]\s*$/, '').trim();
      const exercises = [];
      linhas.slice(1).forEach(l => {
        const limpa = semMarcador(l);
        if (!limpa) return;
        const ex = parseExercicio(limpa);
        if (!ex.name) { avisos.push(`Linha sem nome de exercício, ignorada: "${l}"`); return; }
        exercises.push(ex);
      });
      if (!nome) { avisos.push('Bloco sem nome de treino na primeira linha, ignorado.'); return; }
      if (exercises.length === 0) { avisos.push(`Treino "${nome}" ficou sem exercícios, ignorado.`); return; }
      planos.push({ nome, exercises });
    });
    if (planos.length === 0 && avisos.length === 0) avisos.push('Nada reconhecido no texto.');
    return { planos, avisos };
  }

  // ---------------- PLANO ALIMENTAR ----------------
  // Cabeçalho da refeição: "Café da manhã 07:00" ou "Almoço - 12h" ou só "Jantar".
  function parseCabecalhoRefeicao(linha) {
    const m = linha.match(/(\d{1,2})\s*[:h]\s*(\d{2})?/);
    let nome = linha, horario = null;
    if (m && Number(m[1]) <= 23 && Number(m[2] || 0) <= 59) {
      horario = `${String(Number(m[1])).padStart(2, '0')}:${(m[2] || '00').padStart(2, '0')}`;
      nome = linha.slice(0, m.index) + linha.slice(m.index + m[0].length);
    }
    nome = nome.replace(/[-–—:：,]\s*$/, '').replace(/^\s*[-–—]\s*/, '').replace(/\s+/g, ' ').trim();
    return { nome, horario };
  }

  // Quantidade + nome do alimento. Devolve { gramas, porcoes, nome } — no máximo um dos
  // dois primeiros vem preenchido; nenhum dos dois significa "1 porção".
  //
  // A ordem das tentativas importa. Um número solto no meio do nome NÃO é quantidade:
  // "Requeijão light 61% menos gordura" tem que sair inteiro, com o 61 preservado. Por
  // isso número sem unidade só conta quando está isolado no começo ou no fim da linha.
  function parseQuantidade(linha) {
    let resto = semMarcador(linha);
    let gramas = null, porcoes = null;

    // 1. Unidade explícita em qualquer posição: "150g", "300 ml", "2 porções", "1un", "2x".
    const mUnid = resto.match(/(\d+(?:[.,]\d+)?)\s*(gramas?|gr|g|mls?|ml|por[çc][õo]es|por[çc][ãa]o|unidades?|und|un|x)\b/i);
    if (mUnid) {
      const valor = Number(mUnid[1].replace(',', '.'));
      if (/^(g|gr|gramas?|ml|mls?)$/i.test(mUnid[2])) gramas = valor;
      else porcoes = valor;
      resto = resto.slice(0, mUnid.index) + ' ' + resto.slice(mUnid.index + mUnid[0].length);
    } else {
      // 2. Número isolado no começo ("2 ovos cozidos") ou no fim ("Ovos cozidos 2").
      const mIni = resto.match(/^(\d+(?:[.,]\d+)?)\s+/);
      const mFim = resto.match(/\s+(\d+(?:[.,]\d+)?)$/);
      if (mIni) { porcoes = Number(mIni[1].replace(',', '.')); resto = resto.slice(mIni[0].length); }
      else if (mFim) { porcoes = Number(mFim[1].replace(',', '.')); resto = resto.slice(0, mFim.index); }
    }

    const nome = resto
      .replace(/^\s*de\s+/i, '').replace(/\s+de\s*$/i, '')
      .replace(/^[\s,;:-]+|[\s,;:-]+$/g, '')
      .replace(/\s+/g, ' ').trim();
    return { gramas, porcoes, nome };
  }

  // Casa o nome escrito com um alimento da biblioteca. Exato primeiro; só depois "contém",
  // e apenas se houver UM candidato — dois candidatos viram aviso, porque escolher a
  // esmo entre "Arroz branco cozido" e "Arroz integral cozido" muda a dieta da paciente.
  function acharAlimento(nome, biblioteca) {
    const alvo = normalizar(nome);
    if (!alvo) return { erro: 'vazio' };
    const exato = (biblioteca || []).filter(f => normalizar(f.name) === alvo);
    if (exato.length >= 1) return { food: exato[0] };
    const contem = (biblioteca || []).filter(f => normalizar(f.name).includes(alvo));
    if (contem.length === 1) return { food: contem[0] };
    if (contem.length > 1) return { erro: 'ambiguo', candidatos: contem.slice(0, 4).map(f => f.name) };
    return { erro: 'ausente' };
  }

  const NUTRI = ['kcal', 'carbs', 'sugars', 'protein', 'fat', 'satFat', 'transFat', 'fiber', 'sodium'];

  // Mesma conta que o painel já faz ao adicionar um item na mão: qty é o número de
  // porções do rótulo, e os macros escalam por ele.
  function montarItem(food, gramas, porcoes) {
    const qty = gramas != null
      ? Math.round((gramas / (food.portionGrams || 100)) * 1000) / 1000
      : (porcoes != null ? porcoes : 1);
    const item = { foodName: food.name, qty };
    NUTRI.forEach(f => { item[f] = Math.round((food[f] || 0) * qty * 10) / 10; });
    return item;
  }

  function parsePlanoAlimentar(texto, biblioteca) {
    const refeicoes = [];
    const avisos = [];
    blocos(texto).forEach(linhas => {
      const { nome, horario } = parseCabecalhoRefeicao(linhas[0]);
      const itens = [];
      linhas.slice(1).forEach(l => {
        const q = parseQuantidade(l);
        if (!q.nome) { avisos.push(`Linha sem alimento, ignorada: "${l}"`); return; }
        const achado = acharAlimento(q.nome, biblioteca);
        if (achado.erro === 'ambiguo') {
          avisos.push(`"${q.nome}" casa com mais de um alimento (${achado.candidatos.join(', ')}). Escreva o nome completo.`);
          return;
        }
        if (achado.erro) {
          avisos.push(`"${q.nome}" não está na biblioteca de alimentos — cadastre antes ou corrija o nome.`);
          return;
        }
        itens.push(montarItem(achado.food, q.gramas, q.porcoes));
      });
      if (!nome) { avisos.push('Bloco sem nome de refeição na primeira linha, ignorado.'); return; }
      if (itens.length === 0) { avisos.push(`Refeição "${nome}" ficou sem alimentos válidos, ignorada.`); return; }
      refeicoes.push({ nome, horario, itens });
    });
    if (refeicoes.length === 0 && avisos.length === 0) avisos.push('Nada reconhecido no texto.');
    return { refeicoes, avisos };
  }

  // ---------------- MEDIDAS DA CONSULTA ----------------
  // A nutri anota as circunferências no papel durante a consulta e depois redigita uma a
  // uma no painel. Aqui ela cola a folha inteira.
  //
  // Cada termo é escrito como a pessoa escreve mesmo (sem acento no dicionário porque a
  // comparação é normalizada). 'altura' não é medida — não muda com o tempo e vai pro
  // perfil — mas é reconhecida aqui porque aparece na mesma folha.
  const MEDIDA_TERMOS = [
    { key: 'weight', termos: ['peso atual', 'peso'] },
    { key: 'waist', termos: ['cintura'] },
    { key: 'neck', termos: ['pescoco'] },
    { key: 'abdomen', termos: ['abdomen', 'barriga'] },
    { key: 'chest', termos: ['peito', 'torax', 'busto'] },
    { key: 'hip', termos: ['quadril'] },
    { key: 'arm', termos: ['braco relaxado', 'braco contraido', 'braco'] },
    { key: 'thigh', termos: ['coxa'] },
    { key: 'bodyFat', termos: ['percentual de gordura', 'gordura corporal', 'gordura', 'bf'] },
    { key: 'leanMass', termos: ['massa magra'] },
    { key: 'altura', termos: ['altura'] },
  ];

  // Faixas de plausibilidade. Existem por um motivo concreto: peso e altura daqui também
  // atualizam o CADASTRO do paciente, então um 15 digitado no lugar de 105 corromperia o
  // gráfico e o perfil dele em silêncio. Fora da faixa vira aviso e o valor não entra.
  const MEDIDA_FAIXAS = {
    weight: [25, 350], waist: [30, 250], neck: [20, 80], abdomen: [30, 250],
    chest: [40, 250], hip: [40, 250], arm: [15, 120], thigh: [20, 120],
    bodyFat: [3, 70], leanMass: [15, 150], altura: [100, 250],
  };

  const MEDIDA_UNIDADE = { weight: 'kg', leanMass: 'kg', bodyFat: '%', altura: 'cm' };

  function unidadeDe(key) { return MEDIDA_UNIDADE[key] || 'cm'; }

  // Data solta na folha: "28/08/2026", "28-08-26" ou já em ISO.
  function parseDataMedida(linha) {
    const iso = linha.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (iso) return iso[0];
    const br = linha.match(/(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})/);
    if (!br) return null;
    const dia = Number(br[1]), mes = Number(br[2]);
    let ano = Number(br[3]);
    if (ano < 100) ano += 2000;
    if (dia < 1 || dia > 31 || mes < 1 || mes > 12) return null;
    return `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
  }

  // Devolve { medida, avisos }. medida traz só os campos reconhecidos e plausíveis, mais
  // 'date' se a folha trouxer uma. Uma linha nunca some calada.
  function parseMedidas(texto) {
    const medida = {};
    const avisos = [];
    const vistos = {};

    (texto || '').split('\n').forEach(bruta => {
      const linha = semMarcador(bruta.trim());
      if (!linha || linha.startsWith('//')) return;

      // O valor é o PRIMEIRO número da linha, e o rótulo é o que vem antes dele. Pegar o
      // último quebraria em "IMC: 39,2 kg/m2", onde o 2 do m² viraria o valor.
      const m = linha.match(/(-?\d+(?:[.,]\d+)?)/);
      if (!m) { avisos.push(`Linha sem número, ignorada: "${bruta.trim()}"`); return; }

      const rotulo = normalizar(linha.slice(0, m.index).replace(/[:=–—-]+\s*$/, ''));
      const valor = Number(m[1].replace(',', '.'));

      if (!rotulo) {
        const data = parseDataMedida(linha);
        if (data) { medida.date = data; return; }
        avisos.push(`Linha sem nome de medida, ignorada: "${bruta.trim()}"`);
        return;
      }
      if (/^data\b/.test(rotulo)) {
        const data = parseDataMedida(linha);
        if (data) medida.date = data;
        else avisos.push(`Não entendi a data em "${bruta.trim()}". Use dia/mês/ano.`);
        return;
      }

      const achado = MEDIDA_TERMOS.find(t => t.termos.some(termo => rotulo.includes(termo)));
      if (!achado) { avisos.push(`"${linha.slice(0, m.index).trim()}" não é um campo de medida conhecido — ignorada.`); return; }

      const [min, max] = MEDIDA_FAIXAS[achado.key];
      if (!(valor >= min && valor <= max)) {
        avisos.push(`${valor} está fora do esperado para ${achado.key} (${min}–${max}${unidadeDe(achado.key)}) — confira, não foi importado.`);
        return;
      }
      // Folha com "Braço relaxado" e "Braço contraído" traz o mesmo campo duas vezes.
      // Fica o primeiro, e o segundo é avisado em vez de sobrescrever calado.
      if (medida[achado.key] != null) {
        avisos.push(`"${linha.slice(0, m.index).trim()}" repete ${achado.key}, que já tinha ${medida[achado.key]}${unidadeDe(achado.key)} de "${vistos[achado.key]}". Mantido o primeiro.`);
        return;
      }
      medida[achado.key] = valor;
      vistos[achado.key] = linha.slice(0, m.index).trim();
    });

    const campos = Object.keys(medida).filter(k => k !== 'date');
    if (campos.length === 0 && avisos.length === 0) avisos.push('Nada reconhecido no texto.');
    return { medida, avisos };
  }

  return {
    parseTreino, parsePlanoAlimentar, parseMedidas, parseDataMedida,
    parseExercicio, parseQuantidade, parseCabecalhoRefeicao, acharAlimento,
    normalizar, blocos, montarItem,
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = ParsePlano;
