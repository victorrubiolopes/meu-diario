// Protocolo de medição do gasto energético (GET).
//
// POR QUE EXISTE: a nutri estimou o GET em 2.750 kcal (TMB 1.833 x fator de atividade 1,5).
// O histórico de peso do Victor contra o que ele registrou aponta algo perto de 2.360 — a
// diferença é o deslocamento diário de bicicleta que deixou de existir (4.518 km em 2024,
// 39 hoje). Ninguém tem como saber qual está certo discutindo. Ela montou o experimento:
// comer um valor fixo por N dias, registrar tudo, pesar todo dia nas mesmas condições, não
// mudar o exercício, e comparar a média da primeira semana com a da última.
//
// Esta tela faz essa conta sozinha, todo dia, com o que o app já guarda.
//
// A CONTA:  GET = média de ingestão − (variação de peso em kg/dia × 7.700)
//
// Peso que cai significa déficit, e déficit significa que o gasto era MAIOR que a ingestão:
// daí o sinal de menos (inclinação negativa soma).
//
// POR QUE REGRESSÃO E NÃO SÓ "SEMANA 1 vs SEMANA 2": comparar duas médias usa os 14 pesos,
// mas joga fora a informação de ORDEM dentro de cada semana. A reta de mínimos quadrados usa
// todos os pontos e ainda devolve o ERRO da inclinação — que é o que diz se o resultado já
// significa alguma coisa. As duas contas aparecem na tela: a regressão porque é melhor, e a
// das duas médias porque foi o que a nutri pediu e é o que ela vai conferir.
//
// A MARGEM NÃO É ENFEITE. Comendo 2.400, as duas hipóteses (2.750 e 2.360) preveem médias
// semanais separadas por ~0,36 kg, e o ruído de peso diário coloca a incerteza dessa
// diferença na mesma casa, ~0,37 kg. Ou seja: em 14 dias o resultado provavelmente sai
// ambíguo, e um número cravado sem intervalo seria falsa precisão — exatamente o erro que
// criou o impasse (um fator de tabela virou 2.750 kcal sem nenhuma barra de erro junto).
// Por isso a tela mostra o intervalo, diz quando ele ainda é largo demais pra decidir, e
// estima quantos dias faltam pra fechar.
const ViewProtocolo = (() => {
  // Energia de 1 kg de tecido perdido/ganho. 7.700 kcal é a convenção clínica (gordura pura
  // daria ~9.400; o tecido adiposo tem água e proteína junto).
  const KCAL_POR_KG = 7700;
  // Largura de intervalo (95%) a partir da qual o GET já serve pra prescrever.
  const PRECISAO_ALVO = 400;
  const PADRAO = { vet: 2400, dias: 14 };

  // ---- Cálculo puro (sem DOM, testável com node) ----

  // Mínimos quadrados em y = a + b*x, mais o erro padrão de b.
  // Devolve null com menos de 3 pontos: com 2 a reta passa exata nos dois e o erro seria 0,
  // o que faria a tela anunciar precisão infinita no segundo dia de protocolo.
  function regressao(pontos) {
    const n = pontos.length;
    if (n < 3) return null;
    const mx = pontos.reduce((s, p) => s + p.x, 0) / n;
    const my = pontos.reduce((s, p) => s + p.y, 0) / n;
    const sxx = pontos.reduce((s, p) => s + (p.x - mx) ** 2, 0);
    if (sxx === 0) return null; // todos os pesos no mesmo dia
    const sxy = pontos.reduce((s, p) => s + (p.x - mx) * (p.y - my), 0);
    const b = sxy / sxx;
    const a = my - b * mx;
    const sqr = pontos.reduce((s, p) => s + (p.y - (a + b * p.x)) ** 2, 0);
    const s = Math.sqrt(sqr / (n - 2));
    return { a, b, seB: s / Math.sqrt(sxx), residuo: s, n };
  }

  // Quantos dias de pesagem faltam pra margem chegar em PRECISAO_ALVO, mantendo o mesmo
  // ruído diário. Pra n pontos igualmente espaçados, Σ(x-x̄)² = n(n²-1)/12 — cresce com o
  // CUBO de n, então cada dia a mais estreita o intervalo rápido. Null se já chegou ou se
  // nem com 90 dias chegaria (ruído alto demais: aí o problema é a balança, não o prazo).
  function diasParaPrecisao(residuo, nAtual) {
    if (!residuo) return null;
    for (let n = Math.max(nAtual, 3) + 1; n <= 90; n++) {
      const se = residuo / Math.sqrt((n * (n * n - 1)) / 12);
      if (4 * se * KCAL_POR_KG <= PRECISAO_ALVO) return n - nAtual;
    }
    return null;
  }

  function media(valores) {
    return valores.length ? valores.reduce((s, v) => s + v, 0) / valores.length : null;
  }

  // pesos:     [{ date: 'YYYY-MM-DD', peso }]
  // ingestoes: [{ date: 'YYYY-MM-DD', kcal }]  — só dias COM registro
  function calcular({ pesos, ingestoes, vet, inicio, dias, hoje }) {
    const fim = Util.addDaysISO(inicio, dias - 1);
    const dentro = d => d >= inicio && d <= fim;
    const pesosNoPeriodo = (pesos || []).filter(p => dentro(p.date) && p.peso > 0)
      .sort((a, b) => a.date.localeCompare(b.date));
    const comidasNoPeriodo = (ingestoes || []).filter(i => dentro(i.date) && i.kcal > 0)
      .sort((a, b) => a.date.localeCompare(b.date));

    // Dias decorridos = o que o calendário diz, mas NUNCA menos que o último dia com dado
    // lançado. Sem esse piso, lançar peso com a data de amanhã (ou abrir o app com o relógio
    // do aparelho atrasado) fazia a tela dizer "9 de 1", porque o numerador vinha dos dados
    // e o denominador do calendário.
    const ultimoDado = [...pesosNoPeriodo, ...comidasNoPeriodo]
      .reduce((max, x) => Math.max(max, Util.daysBetween(inicio, x.date)), -1);
    const decorridos = Math.min(dias, Math.max(Util.daysBetween(inicio, hoje) + 1, ultimoDado + 1));
    const r = {
      inicio, fim, dias, vet,
      decorridos: Math.max(0, decorridos),
      terminou: hoje >= fim,
      diasComPeso: pesosNoPeriodo.length,
      diasComComida: comidasNoPeriodo.length,
      mediaIngestao: media(comidasNoPeriodo.map(i => i.kcal)),
      // Aderência: o quanto a ingestão média ficou do alvo. Protocolo com ingestão longe do
      // alvo não invalida a conta (a conta usa o que foi comido, não o que foi planejado),
      // mas invalida a conclusão sobre O PLANO.
      desvioDoAlvo: null,
      semana1: null, semanaFinal: null, variacaoSemanal: null,
      get: null, getMin: null, getMax: null, margem: null,
      conclusivo: false, faltamDias: null, inclinacaoDia: null,
    };
    if (r.mediaIngestao != null) r.desvioDoAlvo = r.mediaIngestao - vet;

    // As duas médias, do jeito que a nutri pediu: 7 primeiros dias contra 7 últimos DECORRIDOS.
    const s1 = pesosNoPeriodo.filter(p => Util.daysBetween(inicio, p.date) < 7);
    const inicioFinal = Math.max(7, r.decorridos - 7);
    const sF = pesosNoPeriodo.filter(p => Util.daysBetween(inicio, p.date) >= inicioFinal);
    r.semana1 = media(s1.map(p => p.peso));
    r.semanaFinal = media(sF.map(p => p.peso));
    if (r.semana1 != null && r.semanaFinal != null) r.variacaoSemanal = r.semanaFinal - r.semana1;

    // A regressão, que é a conta boa.
    const reg = regressao(pesosNoPeriodo.map(p => ({ x: Util.daysBetween(inicio, p.date), y: p.peso })));
    if (reg && r.mediaIngestao != null) {
      r.inclinacaoDia = reg.b;
      r.get = Math.round(r.mediaIngestao - reg.b * KCAL_POR_KG);
      // Intervalo de ~95% (b ± 2 erros padrão). O sinal de menos inverte as pontas.
      const d = 2 * reg.seB * KCAL_POR_KG;
      r.getMin = Math.round(r.get - d);
      r.getMax = Math.round(r.get + d);
      r.margem = Math.round(2 * d);
      r.conclusivo = r.margem <= PRECISAO_ALVO;
      if (!r.conclusivo) r.faltamDias = diasParaPrecisao(reg.residuo, reg.n);
    }
    return r;
  }

  // Texto pronto pra mandar pra nutri. Fica aqui junto da conta, não no HTML, pra não haver
  // duas versões do mesmo número.
  function resumoTexto(r) {
    const n = (v, d = 0) => (v == null ? '—' : v.toFixed(d).replace('.', ','));
    const linhas = [
      `Protocolo ${Util.fmtDate(r.inicio)} a ${Util.fmtDate(r.fim)} (${r.dias} dias)`,
      `Alvo combinado: ${r.vet} kcal/dia`,
      '',
      `Dias decorridos: ${r.decorridos} de ${r.dias}`,
      `Dias com registro alimentar: ${r.diasComComida}`,
      `Dias com pesagem: ${r.diasComPeso}`,
      '',
      `Média de ingestão: ${n(r.mediaIngestao)} kcal/dia`,
    ];
    if (r.desvioDoAlvo != null) {
      linhas.push(`Desvio do alvo: ${r.desvioDoAlvo > 0 ? '+' : ''}${n(r.desvioDoAlvo)} kcal/dia`);
    }
    linhas.push('');
    linhas.push(`Média de peso, 7 primeiros dias: ${n(r.semana1, 2)} kg`);
    linhas.push(`Média de peso, 7 últimos dias: ${n(r.semanaFinal, 2)} kg`);
    if (r.variacaoSemanal != null) {
      linhas.push(`Variação entre as médias: ${r.variacaoSemanal > 0 ? '+' : ''}${n(r.variacaoSemanal, 2)} kg`);
    }
    linhas.push('');
    if (r.get != null) {
      linhas.push(`GET estimado: ${r.get} kcal/dia (intervalo ${r.getMin} a ${r.getMax})`);
      linhas.push(r.conclusivo
        ? 'O intervalo já está estreito o suficiente para servir de base.'
        : `Intervalo ainda largo (${r.margem} kcal) — o número do meio ainda não é confiável.${r.faltamDias ? ` Estimativa: mais ${r.faltamDias} dias de pesagem para fechar.` : ''}`);
      linhas.push('');
      linhas.push('Conta: GET = média de ingestão − (variação de peso em kg/dia × 7.700),');
      linhas.push('com a variação tirada da reta de tendência de todas as pesagens.');
    } else {
      linhas.push('Ainda não há dados suficientes para estimar o GET (faltam pesagens ou registros).');
    }
    return linhas.join('\n');
  }

  // ---- Tela ----

  function config() {
    const p = Storage.getPerfil();
    const c = p.protocolo || {};
    return { inicio: c.inicio || null, vet: c.vet || PADRAO.vet, dias: c.dias || PADRAO.dias };
  }

  function salvarConfig(novo) {
    const p = Storage.getPerfil();
    Storage.savePerfil({ ...p, protocolo: { ...(p.protocolo || {}), ...novo } });
  }

  function dadosDoPeriodo() {
    const pesos = Storage.getAll('medidas')
      .filter(m => m.weight != null && m.weight > 0)
      .map(m => ({ date: m.date, peso: m.weight }));
    // Um dia conta como registrado quando tem comida lançada. Dia SEM registro fica de fora
    // da média em vez de entrar como zero — zero afundaria a média e inventaria um déficit
    // que não houve. Quantos dias ficaram de fora é justamente o que a tela mostra.
    const porDia = {};
    Storage.getAll('alimentacao').forEach(e => {
      if (!e.kcal) return;
      porDia[e.date] = (porDia[e.date] || 0) + e.kcal;
    });
    const ingestoes = Object.keys(porDia).map(date => ({ date, kcal: porDia[date] }));
    return { pesos, ingestoes };
  }

  function render($app, state, api) {
    const c = config();
    if (!c.inicio) return renderConfig($app, state, api, c);

    const { pesos, ingestoes } = dadosDoPeriodo();
    const r = calcular({ ...c, pesos, ingestoes, hoje: Util.todayISO() });
    const n = (v, d = 0) => (v == null ? '—' : v.toFixed(d).replace('.', ','));
    const pct = r.dias ? Math.round((r.decorridos / r.dias) * 100) : 0;

    // Cobertura do registro. É a variável que decide se o resultado presta: registro faltando
    // em dia de exagero puxa a média pra baixo e o GET calculado sai menor que o real.
    const cobertura = r.decorridos ? Math.round((r.diasComComida / r.decorridos) * 100) : 0;

    $app.innerHTML = `
      <div class="card">
        <h2>${r.terminou ? 'Protocolo concluído' : `Dia ${r.decorridos} de ${r.dias}`}</h2>
        <p class="meta">${Util.fmtDate(r.inicio)} a ${Util.fmtDate(r.fim)} · alvo ${r.vet} kcal/dia</p>
        <div class="prot-barra"><div class="prot-barra-fill" style="width:${pct}%"></div></div>
      </div>

      ${r.get != null ? `
        <div class="card prot-destaque">
          <div class="meta">Gasto energético estimado</div>
          <div class="prot-get">${r.get} <span>kcal/dia</span></div>
          <div class="meta">intervalo de confiança: <strong>${r.getMin} a ${r.getMax}</strong></div>
          <p class="meta prot-veredito ${r.conclusivo ? 'ok' : 'espera'}" style="margin-top:10px">
            ${r.conclusivo
              ? '✓ O intervalo está estreito o suficiente. Esse número já serve de base para o ajuste.'
              : `⏳ Intervalo de ${r.margem} kcal — ainda largo demais para decidir. O número do meio é o palpite central, não uma medida.${r.faltamDias ? ` Estimativa: mais <strong>${r.faltamDias} dia(s)</strong> de pesagem para fechar.` : ' Com a oscilação atual, nem prolongando muito o intervalo fecha — confira se a pesagem está sendo sempre nas mesmas condições.'}`}
          </p>
        </div>
      ` : `
        <div class="card">
          <p class="empty">Ainda sem dados suficientes. São necessárias ao menos 3 pesagens e 1 dia de registro alimentar dentro do período.</p>
        </div>
      `}

      <div class="card">
        <h2>Registro</h2>
        <div class="prot-linha"><span>Dias com registro alimentar</span><strong>${r.diasComComida} de ${r.decorridos}</strong></div>
        <div class="prot-linha"><span>Dias com pesagem</span><strong>${r.diasComPeso} de ${r.decorridos}</strong></div>
        <div class="prot-linha"><span>Média de ingestão</span><strong>${n(r.mediaIngestao)} kcal/dia</strong></div>
        ${r.desvioDoAlvo != null ? `<div class="prot-linha"><span>Desvio do alvo</span><strong>${r.desvioDoAlvo > 0 ? '+' : ''}${n(r.desvioDoAlvo)} kcal/dia</strong></div>` : ''}
        ${cobertura < 100 && r.decorridos > 0 ? `
          <p class="meta prot-alerta">⚠ Faltam ${r.decorridos - r.diasComComida} dia(s) de registro. Isso não é detalhe: se os dias que ficaram de fora foram os de maior ingestão, a média sai baixa e o gasto calculado sai menor que o real — e o ajuste iria para o lado errado.</p>
        ` : ''}
      </div>

      <div class="card">
        <h2>Médias semanais</h2>
        <p class="meta">Do jeito que foi combinado: 7 primeiros dias contra 7 últimos.</p>
        <div class="prot-linha"><span>Primeiros 7 dias</span><strong>${n(r.semana1, 2)} kg</strong></div>
        <div class="prot-linha"><span>Últimos 7 dias</span><strong>${n(r.semanaFinal, 2)} kg</strong></div>
        <div class="prot-linha"><span>Variação</span><strong>${r.variacaoSemanal == null ? '—' : `${r.variacaoSemanal > 0 ? '+' : ''}${n(r.variacaoSemanal, 2)} kg`}</strong></div>
        ${r.inclinacaoDia != null ? `<p class="meta" style="margin-top:8px">Pela reta de tendência de todas as pesagens: ${r.inclinacaoDia > 0 ? '+' : ''}${n(r.inclinacaoDia * 1000, 0)} g/dia. É essa inclinação que entra na conta do gasto, e não a diferença entre as duas médias — ela aproveita todas as pesagens em vez de só a posição dos dois blocos.</p>` : ''}
        <canvas id="prot-chart" style="height:180px;margin-top:10px"></canvas>
      </div>

      <div class="card">
        <h2>Resumo para a consulta</h2>
        <textarea id="prot-resumo" readonly style="min-height:260px;font-family:monospace;font-size:0.78rem">${Util.escapeHtml(resumoTexto(r))}</textarea>
        <button class="secondary" id="prot-copiar" style="margin-top:8px">Copiar resumo</button>
      </div>

      <div class="menu-list">
        <div class="menu-item" id="prot-editar">
          <div><div>Ajustar protocolo</div><div class="meta">Início, alvo de calorias e duração</div></div>
          <span class="chev">›</span>
        </div>
      </div>
    `;

    const canvas = document.getElementById('prot-chart');
    const pontos = pesos
      .filter(p => p.date >= r.inicio && p.date <= r.fim)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(p => ({ label: Util.fmtDate(p.date).slice(0, 5), value: p.peso }));
    if (canvas) drawLineChart(canvas, pontos, { trend: pontos.length >= 3 ? Util.movingAverage(pontos, 5) : null });

    document.getElementById('prot-copiar').addEventListener('click', () => {
      const ta = document.getElementById('prot-resumo');
      ta.select();
      navigator.clipboard.writeText(ta.value).then(
        () => alert('✅ Resumo copiado.'),
        () => alert('Não consegui copiar sozinho — o texto já está selecionado, use copiar.')
      );
    });
    document.getElementById('prot-editar').addEventListener('click', () => api.goToSub('protocolo-config'));
  }

  function renderConfig($app, state, api, c) {
    const atual = c || config();
    $app.innerHTML = `
      <div class="card">
        <h2>Protocolo de medição do gasto</h2>
        <p class="meta">Come um valor fixo por alguns dias, registra tudo, pesa todo dia nas mesmas condições e não muda o exercício. No fim, o quanto o peso andou revela o gasto real — sem depender de fórmula nem de fator de atividade de tabela.</p>
        <label>Primeiro dia</label>
        <input type="date" id="prot-inicio" value="${atual.inicio || Util.todayISO()}">
        <label>Alvo de calorias por dia</label>
        <input type="number" id="prot-vet" value="${atual.vet}">
        <label>Duração (dias)</label>
        <input type="number" id="prot-dias" value="${atual.dias}">
        <p class="meta">A tela avisa se a duração escolhida não foi suficiente para fechar um intervalo confiável, e estima quantos dias ainda faltam.</p>
        <button class="primary" id="prot-salvar" style="margin-top:12px">Salvar</button>
      </div>
    `;
    document.getElementById('prot-salvar').addEventListener('click', () => {
      const inicio = document.getElementById('prot-inicio').value;
      if (!inicio) { alert('Escolha o primeiro dia.'); return; }
      salvarConfig({
        inicio,
        vet: Number(document.getElementById('prot-vet').value) || PADRAO.vet,
        dias: Number(document.getElementById('prot-dias').value) || PADRAO.dias,
      });
      // Volta pra raiz do protocolo. Quando ainda não havia protocolo nenhum, a config FOI a
      // tela raiz, então não há o que desempilhar — aí re-renderiza no lugar.
      if (state.subView === 'protocolo-config') api.back(); else api.render();
    });
  }

  return { render, renderConfig, calcular, regressao, diasParaPrecisao, resumoTexto, KCAL_POR_KG, PRECISAO_ALVO };
})();
