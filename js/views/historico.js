const ViewHistorico = (() => {
  const TABS = [
    { key: 'peso', label: 'Peso' },
    { key: 'medidas', label: 'Medidas' },
    { key: 'corrida', label: 'Corrida' },
    { key: 'treino', label: 'Treinos' },
  ];

  function render($app, state, api) {
    $app.innerHTML = `
      <div class="tabs-sub">
        ${TABS.map(t => `<button data-h="${t.key}" class="${state.historicoSub === t.key ? 'active' : ''}">${t.label}</button>`).join('')}
      </div>
      <div id="hist-content"></div>
    `;
    $app.querySelectorAll('[data-h]').forEach(btn => {
      btn.addEventListener('click', () => { state.historicoSub = btn.dataset.h; api.render(); });
    });
    const content = document.getElementById('hist-content');

    if (state.historicoSub === 'peso') renderPeso(content);
    else if (state.historicoSub === 'medidas') renderMedidas(content);
    else if (state.historicoSub === 'corrida') renderCorrida(content);
    else if (state.historicoSub === 'treino') renderTreino(content);
  }

  function renderPeso(content) {
    const all = Storage.getAll('medidas').filter(m => m.weight != null).sort((a, b) => a.date.localeCompare(b.date));
    const points = all.map(m => ({ label: Util.fmtDate(m.date).slice(0, 5), value: m.weight }));
    const trend = points.length >= 3 ? Util.movingAverage(points, 5) : null;
    content.innerHTML = `<div class="card"><h2>Evolução do peso</h2><canvas id="chart-canvas"></canvas><p class="meta" style="color:var(--text-muted);font-size:0.78rem">Linha tracejada = média móvel (tendência)</p></div>`;
    drawLineChart(document.getElementById('chart-canvas'), points, { trend });
  }

  function renderMedidas(content) {
    const all = Storage.getAll('medidas').sort((a, b) => a.date.localeCompare(b.date));
    const fields = ViewMedidas.FIELDS.filter(f => f.key !== 'weight');
    // Um gráfico por medida, empilhados — dá pra ver tudo rolando a tela, sem precisar
    // trocar de seleção pra comparar cintura x quadril x etc.
    const comDados = fields.filter(f => all.some(m => m[f.key] != null));
    content.innerHTML = comDados.length
      ? comDados.map(f => `
        <div class="card">
          <h2>${f.label}</h2>
          <canvas id="chart-${f.key}"></canvas>
        </div>
      `).join('') + `<p class="meta" style="color:var(--text-muted);font-size:0.78rem">Linha tracejada = média móvel (tendência)</p>`
      : `<div class="card"><p class="empty">Nenhuma medida registrada ainda.</p></div>`;
    comDados.forEach(f => {
      const points = all.filter(m => m[f.key] != null).map(m => ({ label: Util.fmtDate(m.date).slice(0, 5), value: m[f.key] }));
      const trend = points.length >= 3 ? Util.movingAverage(points, 5) : null;
      drawLineChart(document.getElementById(`chart-${f.key}`), points, { trend });
    });
  }

  function renderCorrida(content) {
    const all = Storage.getAll('corridas').filter(c => c.distanceKm && c.timeMin).sort((a, b) => a.date.localeCompare(b.date));
    const points = all.map(c => ({ label: Util.fmtDate(c.date).slice(0, 5), value: Math.round((c.timeMin / c.distanceKm) * 100) / 100 }));
    const trend = points.length >= 3 ? Util.movingAverage(points, 5) : null;
    content.innerHTML = `<div class="card"><h2>Evolução do pace (min/km)</h2><canvas id="chart-canvas"></canvas><p class="meta" style="color:var(--text-muted);font-size:0.78rem">Quanto menor, melhor · linha tracejada = média móvel (tendência)</p></div>`;
    drawLineChart(document.getElementById('chart-canvas'), points, { trend });
  }

  function renderTreino(content) {
    const all = Storage.getAll('treino').sort((a, b) => b.date.localeCompare(a.date));
    const planos = Storage.getAll('treino_planos');

    // Agrupa por nome normalizado (trim + minúsculas) pra não separar "Supino" de "supino " em exercícios distintos.
    const exerciseByKey = new Map();
    all.forEach(t => (t.exercises || []).forEach(e => {
      if (!e.name || Util.maxPesoExercicio(e) <= 0) return;
      const key = e.name.trim().toLowerCase();
      if (!exerciseByKey.has(key)) exerciseByKey.set(key, e.name.trim());
    }));
    const namesList = [...exerciseByKey.entries()].sort((a, b) => a[1].localeCompare(b[1]));

    // Maior peso de cada dia, por exercício. Calculado antes do HTML porque o gráfico de cada
    // um é montado depois que os canvas existem no DOM.
    const pontosPorExercicio = namesList.map(([key, label]) => {
      const byDate = {};
      all.forEach(t => (t.exercises || []).forEach(e => {
        if (!e.name || e.name.trim().toLowerCase() !== key) return;
        const w = Util.maxPesoExercicio(e);
        if (w > 0 && (!byDate[t.date] || w > byDate[t.date])) byDate[t.date] = w;
      }));
      const points = Object.keys(byDate).sort().map(d => ({ label: Util.fmtDate(d).slice(0, 5), value: byDate[d] }));
      return { key, label, points };
    });

    content.innerHTML = `
      ${namesList.length === 0
        ? '<div class="card"><h2>Evolução de carga por exercício</h2><p class="empty">Registre pesos nos exercícios para ver a evolução aqui</p></div>'
        : pontosPorExercicio.map((ex, idx) => `
            <div class="card">
              <h2>${Util.escapeHtml(ex.label)}</h2>
              <canvas id="chart-ex-${idx}"></canvas>
            </div>
          `).join('') + '<p class="meta" style="color:var(--text-muted);font-size:0.78rem">Maior peso registrado por dia · linha tracejada = média móvel (tendência)</p>'
      }
      <div class="card">
        <h2>Treinos anteriores</h2>
        ${all.length === 0 ? '<div class="empty">Nenhum treino ainda</div>' : all.map(t => {
          const plano = planos.find(p => p.id === t.planoId);
          return `
          <div class="list-item">
            <div>
              <strong>${Util.fmtDate(t.date)}</strong> ${plano ? `<span class="task-tag">${Util.escapeHtml(plano.nome)}</span>` : ''}
              <div class="meta">${(t.exercises || []).filter(e => e.name).map(e => { const w = Util.maxPesoExercicio(e); return w > 0 ? `${Util.escapeHtml(e.name)} (${w}kg)` : Util.escapeHtml(e.name); }).join(', ') || 'sem exercícios'}</div>
            </div>
          </div>
        `;
        }).join('')}
      </div>
    `;

    pontosPorExercicio.forEach((ex, idx) => {
      const trend = ex.points.length >= 3 ? Util.movingAverage(ex.points, 5) : null;
      drawLineChart(document.getElementById(`chart-ex-${idx}`), ex.points, { trend });
    });
  }

  return { render };
})();
