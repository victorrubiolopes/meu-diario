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
    content.innerHTML = `
      <div class="card">
        <h2>Evolução das medidas</h2>
        <select id="medida-field">${fields.map(f => `<option value="${f.key}">${f.label}</option>`).join('')}</select>
        <canvas id="chart-canvas" style="margin-top:14px"></canvas>
        <p class="meta" style="color:var(--text-muted);font-size:0.78rem">Linha tracejada = média móvel (tendência)</p>
      </div>
    `;
    const select = document.getElementById('medida-field');
    const draw = () => {
      const key = select.value;
      const points = all.filter(m => m[key] != null).map(m => ({ label: Util.fmtDate(m.date).slice(0, 5), value: m[key] }));
      const trend = points.length >= 3 ? Util.movingAverage(points, 5) : null;
      drawLineChart(document.getElementById('chart-canvas'), points, { trend });
    };
    select.addEventListener('change', draw);
    draw();
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
      if (!e.name || !e.weight) return;
      const key = e.name.trim().toLowerCase();
      if (!exerciseByKey.has(key)) exerciseByKey.set(key, e.name.trim());
    }));
    const namesList = [...exerciseByKey.entries()].sort((a, b) => a[1].localeCompare(b[1]));

    content.innerHTML = `
      <div class="card">
        <h2>Evolução de carga por exercício</h2>
        ${namesList.length === 0 ? '<p class="empty">Registre pesos nos exercícios para ver a evolução aqui</p>' : `
          <select id="exercicio-hist">${namesList.map(([key, label]) => `<option value="${Util.escapeHtml(key)}">${Util.escapeHtml(label)}</option>`).join('')}</select>
          <canvas id="chart-canvas-ex" style="margin-top:14px"></canvas>
          <p class="meta" style="color:var(--text-muted);font-size:0.78rem">Maior peso registrado por dia · linha tracejada = tendência</p>
        `}
      </div>
      <div class="card">
        <h2>Treinos anteriores</h2>
        ${all.length === 0 ? '<div class="empty">Nenhum treino ainda</div>' : all.map(t => {
          const plano = planos.find(p => p.id === t.planoId);
          return `
          <div class="list-item">
            <div>
              <strong>${Util.fmtDate(t.date)}</strong> ${plano ? `<span class="task-tag">${Util.escapeHtml(plano.nome)}</span>` : ''}
              <div class="meta">${(t.exercises || []).filter(e => e.name).map(e => e.weight ? `${Util.escapeHtml(e.name)} (${e.weight}kg)` : Util.escapeHtml(e.name)).join(', ') || 'sem exercícios'}</div>
            </div>
          </div>
        `;
        }).join('')}
      </div>
    `;

    if (namesList.length > 0) {
      const select = document.getElementById('exercicio-hist');
      const draw = () => {
        const key = select.value;
        const byDate = {};
        all.forEach(t => {
          (t.exercises || []).forEach(e => {
            if (e.name && e.name.trim().toLowerCase() === key && e.weight) {
              const w = Number(e.weight);
              if (!byDate[t.date] || w > byDate[t.date]) byDate[t.date] = w;
            }
          });
        });
        const dates = Object.keys(byDate).sort();
        const points = dates.map(d => ({ label: Util.fmtDate(d).slice(0, 5), value: byDate[d] }));
        const trend = points.length >= 3 ? Util.movingAverage(points, 5) : null;
        drawLineChart(document.getElementById('chart-canvas-ex'), points, { trend });
      };
      select.addEventListener('change', draw);
      draw();
    }
  }

  return { render };
})();
