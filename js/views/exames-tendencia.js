// Resultados de exame de sangue ao longo do tempo.
//
// Existe porque a tela de Exames só guardava o ARQUIVO: dava pra reabrir o laudo, mas não
// pra ver que o LDL subiu 36 pontos em três anos. Um exame isolado responde "está dentro da
// faixa?"; a série responde "para onde está indo?", que é a pergunta que muda conduta.
//
// Guarda em 'exames_resultados': uma entrada por DATA de coleta, com um mapa de
// marcador -> número. Marcador ausente no laudo simplesmente não entra no mapa — nunca zero,
// que viraria um ponto falso no gráfico e uma queda que não existiu.
const ViewExamesTendencia = (() => {

  function resultados() {
    return Storage.getAll('exames_resultados')
      .slice()
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  }

  // Só o dono do app vê o próprio pacote de exames, mesma regra da ficha de treino pessoal.
  function souDono() {
    return typeof Cloud === 'undefined' || !Cloud.isEnabled()
      || (typeof Cloud.isSuperAdmin === 'function' && Cloud.isSuperAdmin());
  }

  function temPacotePessoal() {
    return souDono() && typeof EXAMES_VICTOR !== 'undefined';
  }

  // ---- Atalho pintado dentro da tela de Exames ----
  function atalhoHtml() {
    const n = resultados().length;
    return `
      <div class="card" style="padding:4px 16px">
        <div class="menu-list">
          <button class="menu-item" id="ir-exames-tendencia" style="align-items:flex-start;text-align:left">
            <span class="icon">📈</span>
            <div style="flex:1">
              <div><strong>Resultados e tendência</strong></div>
              <div class="meta">${n ? `${n} coleta(s) lançada(s) — veja a evolução de cada marcador` : 'Lance os valores do laudo e acompanhe a evolução'}</div>
            </div>
            <span class="chev">›</span>
          </button>
        </div>
      </div>`;
  }

  function bindAtalho($app, api) {
    const btn = $app.querySelector('#ir-exames-tendencia');
    if (btn) btn.addEventListener('click', () => api.goToMais('exames-tendencia'));
  }

  // ---- Tela de tendência ----
  function render($app, state, api) {
    const lista = resultados();

    if (lista.length === 0) {
      $app.innerHTML = `
        <div class="card">
          <div class="empty">Nenhum resultado lançado ainda.</div>
          <p class="meta">Lance os valores do laudo (só os que você tem — o resto fica em branco) e o app monta a evolução de cada marcador, com a faixa de referência ao lado.</p>
        </div>
        ${menuHtml(api)}
      `;
      bindMenu($app, api);
      return;
    }

    const ultimo = lista[lista.length - 1];
    const alterados = Object.keys(ultimo.valores || {})
      .map(ch => ({ ch, sit: situacaoMarcador(ch, ultimo.valores[ch]) }))
      .filter(x => x.sit === 'alto' || x.sit === 'baixo');

    // Só entra no relatório o marcador com pelo menos UM valor lançado. Grupo inteiro sem
    // dado nenhum não vira card vazio.
    const grupos = GRUPOS_MARCADOR.map(g => ({
      nome: g,
      marcadores: MARCADORES_EXAME.filter(m => m.grupo === g && lista.some(e => e.valores && e.valores[m.chave] != null)),
    })).filter(g => g.marcadores.length > 0);

    $app.innerHTML = `
      <div class="card">
        <h2 style="margin-bottom:2px">${lista.length} coleta(s)</h2>
        <p class="meta" style="margin-top:0">De ${Util.fmtDate(lista[0].date)} a ${Util.fmtDate(ultimo.date)}</p>
        ${alterados.length
          ? `<p class="meta" style="border-left:3px solid var(--danger);padding-left:8px;margin-top:10px">
               <strong>${alterados.length} marcador(es) fora da faixa na última coleta:</strong>
               ${alterados.map(x => Util.escapeHtml((marcadorPorChave(x.ch) || {}).nome || x.ch)).join(', ')}.
             </p>`
          : '<p class="meta" style="border-left:3px solid var(--good);padding-left:8px;margin-top:10px">Nenhum marcador fora da faixa na última coleta.</p>'}
        <p class="meta" style="font-size:0.74rem">As faixas são as do laboratório dos laudos (adulto masculino). Outro laboratório pode publicar faixa diferente. Isto não substitui a leitura do seu médico.</p>
      </div>

      ${grupos.map(g => `
        <div class="card">
          <h3 style="font-size:0.92rem;margin:0 0 10px">${g.nome}</h3>
          ${g.marcadores.map(m => linhaMarcadorHtml(m, lista)).join('')}
        </div>
      `).join('')}

      ${menuHtml(api)}
    `;

    // Um gráfico por marcador com pelo menos 2 pontos — com 1 ponto não há tendência,
    // e a linha reta daria uma impressão de estabilidade que o dado não sustenta.
    grupos.forEach(g => g.marcadores.forEach(m => {
      const pontos = lista.filter(e => e.valores && e.valores[m.chave] != null)
        .map(e => ({ label: Util.fmtDate(e.date).slice(0, 5), value: Number(e.valores[m.chave]) }));
      if (pontos.length < 2) return;
      const canvas = document.getElementById(`chart-ex-${m.chave}`);
      if (canvas) drawLineChart(canvas, pontos, {});
    }));

    bindMenu($app, api);
  }

  const CLASSE_SIT = { alto: 'var(--danger)', baixo: 'var(--danger)', ok: 'var(--good)' };
  const ROTULO_SIT = { alto: 'acima', baixo: 'abaixo', ok: 'na faixa' };

  function faixaTexto(m) {
    if (m.min != null && m.max != null) return `${m.min} – ${m.max}`;
    if (m.min != null) return `acima de ${m.min}`;
    if (m.max != null) return `até ${m.max}`;
    return '—';
  }

  function linhaMarcadorHtml(m, lista) {
    const comValor = lista.filter(e => e.valores && e.valores[m.chave] != null);
    const ult = comValor[comValor.length - 1];
    const v = Number(ult.valores[m.chave]);
    const sit = situacaoMarcador(m.chave, v);
    // A variação compara com a coleta anterior QUE TEM esse marcador, não com a anterior no
    // tempo: pular um laudo que não pediu o exame não é uma mudança de valor.
    const antes = comValor.length > 1 ? Number(comValor[comValor.length - 2].valores[m.chave]) : null;
    const delta = antes != null ? Math.round((v - antes) * 100) / 100 : null;

    return `
      <div style="margin-bottom:16px">
        <div class="progress-label" style="margin-bottom:2px">
          <span><strong>${Util.escapeHtml(m.nome)}</strong></span>
          <span class="val" style="color:${CLASSE_SIT[sit] || 'var(--text-muted)'}">
            ${v} ${Util.escapeHtml(m.unidade)} · ${ROTULO_SIT[sit] || '—'}
          </span>
        </div>
        <div class="meta" style="font-size:0.74rem">
          Referência ${faixaTexto(m)} ${Util.escapeHtml(m.unidade)}
          ${delta != null ? ` · ${delta > 0 ? '+' : ''}${delta} desde ${Util.fmtDate(comValor[comValor.length - 2].date)}` : ' · primeira medida'}
        </div>
        ${comValor.length >= 2 ? `<canvas id="chart-ex-${m.chave}" style="height:120px"></canvas>` : ''}
        ${m.obs ? `<p class="meta" style="font-size:0.74rem;border-left:2px solid var(--border);padding-left:6px;margin-top:4px">${Util.escapeHtml(m.obs)}</p>` : ''}
      </div>`;
  }

  function menuHtml(api) {
    const itens = [`
      <button class="menu-item" id="ir-exame-lancar" style="align-items:flex-start;text-align:left">
        <span class="icon">✏️</span>
        <div style="flex:1">
          <div><strong>Lançar resultados</strong></div>
          <div class="meta">Digite os valores de uma coleta. Deixe em branco o que o laudo não trouxe.</div>
        </div>
        <span class="chev">›</span>
      </button>`];
    if (temPacotePessoal()) {
      itens.push(`
        <button class="menu-item" id="carregar-exames-victor" style="align-items:flex-start;text-align:left">
          <span class="icon">📦</span>
          <div style="flex:1">
            <div><strong>Carregar meus exames</strong></div>
            <div class="meta">${EXAMES_VICTOR.exames.length} coletas já transcritas dos laudos.</div>
          </div>
          <span class="chev">›</span>
        </button>`);
    }
    return `<div class="card" style="padding:4px 16px"><div class="menu-list">${itens.join('')}</div></div>`;
  }

  function bindMenu($app, api) {
    const lancar = $app.querySelector('#ir-exame-lancar');
    if (lancar) lancar.addEventListener('click', () => api.goToMais('exame-lancar'));

    const carregar = $app.querySelector('#carregar-exames-victor');
    if (carregar) {
      carregar.addEventListener('click', () => {
        const atuais = Storage.getAll('exames_resultados');
        let novos = 0; let atualizados = 0;
        EXAMES_VICTOR.exames.forEach(ex => {
          // Upsert pela data da coleta: recarregar corrige uma transcrição em vez de criar
          // uma segunda cópia do mesmo exame.
          const i = atuais.findIndex(x => x.date === ex.date);
          const registro = {
            date: ex.date, lab: ex.lab, solicitante: ex.solicitante,
            valores: Object.assign({}, ex.valores), fonte: EXAMES_VICTOR.fonte,
          };
          if (i >= 0) { registro.id = atuais[i].id; atuais[i] = registro; atualizados++; }
          else { registro.id = Storage.uid(); atuais.push(registro); novos++; }
        });
        Storage.saveAll('exames_resultados', atuais);
        alert(`✅ ${novos} coleta(s) adicionada(s)` + (atualizados ? `, ${atualizados} atualizada(s).` : '.'));
        api.render();
      });
    }
  }

  // ---- Tela de lançar uma coleta ----
  function renderLancar($app, state, api) {
    const lista = resultados();
    const ultimo = lista[lista.length - 1] || null;

    $app.innerHTML = `
      <div class="card">
        <p class="meta">Preencha só o que o laudo trouxer. Campo em branco não vira zero — fica sem ponto no gráfico daquele marcador.</p>
        <label>Data da coleta</label>
        <input type="date" id="ex-data" value="${Util.escapeHtml(Util.todayISO())}">
        <label>Laboratório (opcional)</label>
        <input type="text" id="ex-lab" placeholder="Ex: Sabin" value="${Util.escapeHtml(ultimo && ultimo.lab ? ultimo.lab : '')}">
      </div>
      ${GRUPOS_MARCADOR.map(g => {
        const ms = MARCADORES_EXAME.filter(m => m.grupo === g);
        const linhas = [];
        for (let i = 0; i < ms.length; i += 2) linhas.push(ms.slice(i, i + 2));
        return `
          <div class="card">
            <h3 style="font-size:0.92rem;margin:0 0 8px">${g}</h3>
            ${linhas.map(par => `<div class="row">${par.map(m => `
              <div>
                <label style="font-size:0.74rem">${Util.escapeHtml(m.nome)} <span style="color:var(--text-muted)">(${Util.escapeHtml(m.unidade)})</span></label>
                <input type="number" step="any" id="ex-${m.chave}">
              </div>`).join('')}</div>`).join('')}
          </div>`;
      }).join('')}
      <div class="card">
        <button class="primary" id="ex-salvar">Salvar coleta</button>
        <p class="meta" id="ex-msg" style="margin-top:8px"></p>
      </div>
    `;

    document.getElementById('ex-salvar').addEventListener('click', () => {
      const msg = document.getElementById('ex-msg');
      const date = document.getElementById('ex-data').value;
      if (!date) { msg.textContent = '⚠️ Escolha a data da coleta.'; return; }
      const valores = {};
      MARCADORES_EXAME.forEach(m => {
        const el = document.getElementById(`ex-${m.chave}`);
        if (el && el.value !== '') valores[m.chave] = Number(el.value);
      });
      // Data sozinha não é exame: sem isso um toque sem querer criaria uma coleta vazia que
      // aparece na contagem e não mostra nada.
      if (Object.keys(valores).length === 0) { msg.textContent = '⚠️ Preencha ao menos um marcador.'; return; }

      const atuais = Storage.getAll('exames_resultados');
      const i = atuais.findIndex(x => x.date === date);
      const lab = document.getElementById('ex-lab').value.trim();
      if (i >= 0) {
        // Mesma data = mesma coleta. Mescla em vez de trocar, pra dar pra lançar o laudo em
        // duas partes (o de sangue hoje, o de urina quando sair).
        atuais[i] = Object.assign({}, atuais[i], {
          lab: lab || atuais[i].lab,
          valores: Object.assign({}, atuais[i].valores, valores),
        });
      } else {
        atuais.push({ id: Storage.uid(), date, lab, valores });
      }
      Storage.saveAll('exames_resultados', atuais);
      api.back();
    });
  }

  return { render, renderLancar, atalhoHtml, bindAtalho };
})();
