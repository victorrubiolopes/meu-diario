const ViewTreino = (() => {
  function maxWeightHistorico(name, excludeId) {
    const all = Storage.getAll('treino');
    let max = 0;
    all.forEach(entry => {
      (entry.exercises || []).forEach(ex => {
        if (entry.id === excludeId) return;
        if (ex.name && ex.name.trim().toLowerCase() === name.trim().toLowerCase() && ex.weight) {
          max = Math.max(max, Number(ex.weight));
        }
      });
    });
    return max;
  }

  function melhorPaceHistorico(excludeId) {
    const all = Storage.getAll('corridas').filter(c => c.id !== excludeId && c.distanceKm && c.timeMin);
    if (all.length === 0) return null;
    return Math.min(...all.map(c => c.timeMin / c.distanceKm));
  }

  function render($app, state, api) {
    $app.innerHTML = `
      <div class="tabs-sub">
        <button data-sub="musculacao" class="${state.treinoSub === 'musculacao' ? 'active' : ''}">Musculação</button>
        <button data-sub="corrida" class="${state.treinoSub === 'corrida' ? 'active' : ''}">Corrida</button>
      </div>
      <div id="treino-content"></div>
    `;
    $app.querySelectorAll('[data-sub]').forEach(btn => {
      btn.addEventListener('click', () => { state.treinoSub = btn.dataset.sub; api.render(); });
    });
    const content = document.getElementById('treino-content');
    if (state.treinoSub === 'musculacao') renderMusculacao(content, state, api);
    else renderCorrida(content, state, api);
  }

  function renderMusculacao(content, state, api) {
    const existing = Storage.getByDate('treino', state.date)[0];
    const exercises = existing ? existing.exercises : [{ name: '', sets: '', reps: '', weight: '' }];
    const biblioteca = Storage.getAll('exercicios_biblioteca');
    const planos = Storage.getAll('treino_planos').sort((a, b) => a.ordem - b.ordem);
    const sugerido = Util.planoSugerido();
    let planoIdAtual = existing ? existing.planoId || null : null;

    content.innerHTML = `
      <datalist id="exercicios-datalist">
        ${biblioteca.map(e => `<option value="${Util.escapeHtml(e.name)}">`).join('')}
      </datalist>
      ${planos.length > 0 ? `
        <div class="card">
          <h2>Treino sugerido hoje</h2>
          <p><strong>${sugerido ? Util.escapeHtml(sugerido.nome) : '—'}</strong> <span class="meta">(baseado no último treino registrado)</span></p>
          <button class="secondary" id="usar-sugerido" ${!sugerido ? 'disabled' : ''}>Usar este plano</button>
          <label style="margin-top:12px">Ou escolha outro plano</label>
          <select id="escolher-plano">
            <option value="">Nenhum (treino livre)</option>
            ${planos.map(p => `<option value="${p.id}" ${planoIdAtual === p.id ? 'selected' : ''}>${Util.escapeHtml(p.nome)}</option>`).join('')}
          </select>
        </div>
      ` : ''}
      <div class="card">
        <h2>Treino do dia</h2>
        <div id="exercise-list"></div>
        <button class="secondary" id="add-exercise">+ Adicionar exercício</button>
        <label>Duração (min) — opcional, usada para estimar calorias gastas</label>
        <input type="number" id="treino-duracao" placeholder="Ex: 50" value="${existing && existing.duracaoMin ? existing.duracaoMin : ''}">
        <label>Notas</label>
        <textarea id="treino-notes" placeholder="Sensação, observações...">${Util.escapeHtml(existing ? existing.notes : '')}</textarea>
        <button class="primary" id="save-treino">Salvar treino</button>
      </div>
    `;
    const list = document.getElementById('exercise-list');
    let rows = exercises.map(e => ({ ...e }));
    const expandedVideos = new Set();

    function aplicarPlano(plano) {
      if (!plano) return;
      planoIdAtual = plano.id;
      rows = (plano.exercises || []).map(e => ({ ...e }));
      if (rows.length === 0) rows.push({ name: '', sets: '', reps: '', weight: '' });
      renderRows();
    }

    if (planos.length > 0) {
      document.getElementById('usar-sugerido').addEventListener('click', () => aplicarPlano(sugerido));
      document.getElementById('escolher-plano').addEventListener('change', e => {
        const plano = planos.find(p => p.id === e.target.value);
        if (plano) aplicarPlano(plano);
        else planoIdAtual = null;
      });
    }

    function renderRows() {
      list.innerHTML = rows.map((r, i) => {
        const isPR = r.weight && r.name && Number(r.weight) > maxWeightHistorico(r.name, existing ? existing.id : null) && maxWeightHistorico(r.name, existing ? existing.id : null) > 0;
        return `
        <div class="exercise-row" data-i="${i}">
          <input type="text" class="ex-name" list="exercicios-datalist" placeholder="Exercício" value="${Util.escapeHtml(r.name)}">
          <input type="number" class="small ex-sets" placeholder="Séries" value="${Util.escapeHtml(r.sets)}">
          <input type="number" class="small ex-reps" placeholder="Reps" value="${Util.escapeHtml(r.reps)}">
          <input type="number" class="small ex-weight" placeholder="Kg" value="${Util.escapeHtml(r.weight)}">
          <button class="link" data-remove="${i}">✕</button>
          ${isPR ? '<span class="badge pr">🏆 PR</span>' : ''}
          ${r.name.trim() ? (() => {
            const doLib = biblioteca.find(e => e.name.trim().toLowerCase() === r.name.trim().toLowerCase());
            const videoUrl = doLib && doLib.videoUrl;
            const embedId = Util.youtubeEmbedId(videoUrl);
            if (embedId) {
              const isOpen = expandedVideos.has(i);
              return `
                <button type="button" class="link" data-togglevideo="${i}" style="color:var(--accent);flex-basis:100%;text-align:left">${isOpen ? '▲ Ocultar vídeo' : '▶ Ver vídeo do exercício'}</button>
                ${isOpen ? `<div style="flex-basis:100%;aspect-ratio:16/9;margin-top:6px"><iframe width="100%" height="100%" src="https://www.youtube.com/embed/${embedId}" title="Vídeo do exercício" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>` : ''}
              `;
            }
            const url = videoUrl || Util.youtubeSearchUrl(r.name);
            return `<a href="${url}" target="_blank" rel="noopener" class="meta" style="color:var(--accent);flex-basis:100%">▶ Ver vídeo do exercício</a>`;
          })() : ''}
        </div>
      `;
      }).join('');
      list.querySelectorAll('[data-remove]').forEach(btn => {
        btn.addEventListener('click', () => {
          rows.splice(Number(btn.dataset.remove), 1);
          if (rows.length === 0) rows.push({ name: '', sets: '', reps: '', weight: '' });
          syncFromInputs();
          renderRows();
        });
      });
      list.querySelectorAll('.ex-weight, .ex-name').forEach(inp => {
        inp.addEventListener('change', () => { syncFromInputs(); renderRows(); });
      });
      list.querySelectorAll('[data-togglevideo]').forEach(btn => {
        btn.addEventListener('click', () => {
          const i = Number(btn.dataset.togglevideo);
          if (expandedVideos.has(i)) expandedVideos.delete(i); else expandedVideos.add(i);
          syncFromInputs();
          renderRows();
        });
      });
    }

    function syncFromInputs() {
      const names = list.querySelectorAll('.ex-name');
      const sets = list.querySelectorAll('.ex-sets');
      const reps = list.querySelectorAll('.ex-reps');
      const weights = list.querySelectorAll('.ex-weight');
      rows = rows.map((r, i) => ({
        name: names[i] ? names[i].value : r.name,
        sets: sets[i] ? sets[i].value : r.sets,
        reps: reps[i] ? reps[i].value : r.reps,
        weight: weights[i] ? weights[i].value : r.weight,
      }));
    }

    renderRows();

    document.getElementById('add-exercise').addEventListener('click', () => {
      syncFromInputs();
      rows.push({ name: '', sets: '', reps: '', weight: '' });
      renderRows();
    });

    document.getElementById('save-treino').addEventListener('click', () => {
      syncFromInputs();
      const cleaned = rows.filter(r => r.name.trim() !== '');
      const notes = document.getElementById('treino-notes').value.trim();
      const duracaoMin = Number(document.getElementById('treino-duracao').value) || null;
      if (existing) {
        Storage.update('treino', existing.id, { exercises: cleaned, notes, planoId: planoIdAtual, duracaoMin });
      } else {
        Storage.add('treino', { date: state.date, exercises: cleaned, notes, planoId: planoIdAtual, duracaoMin });
      }
      atualizarGastoAuto(state.date);
      api.render();
    });
  }

  function renderCorrida(content, state, api) {
    const runs = Storage.getByDate('corridas', state.date).sort((a, b) => (a.order || 0) - (b.order || 0));
    content.innerHTML = `
      <div class="card">
        <h2>Registrar corrida</h2>
        <div class="row">
          <div>
            <label>Distância (km)</label>
            <input type="number" step="0.01" id="run-distance" placeholder="5">
          </div>
          <div>
            <label>Tempo (minutos)</label>
            <input type="number" step="0.1" id="run-time" placeholder="20">
          </div>
        </div>
        <label>Notas</label>
        <textarea id="run-notes" placeholder="Percurso, sensação..."></textarea>
        <button class="primary" id="save-run">Registrar</button>
      </div>
      <div class="card">
        <h2>Corridas do dia</h2>
        <div id="run-list">
          ${runs.length === 0 ? '<div class="empty">Nenhuma corrida registrada ainda</div>' : runs.map(r => runItemHtml(r)).join('')}
        </div>
      </div>
    `;
    document.getElementById('save-run').addEventListener('click', () => {
      const distanceKm = Number(document.getElementById('run-distance').value);
      const timeMin = Number(document.getElementById('run-time').value);
      const notes = document.getElementById('run-notes').value.trim();
      if (!distanceKm || !timeMin) return;
      Storage.add('corridas', { date: state.date, distanceKm, timeMin, notes, order: Date.now() });
      atualizarGastoAuto(state.date);
      api.render();
    });
    content.querySelectorAll('[data-remove]').forEach(btn => {
      btn.addEventListener('click', () => {
        Storage.remove('corridas', btn.dataset.remove);
        atualizarGastoAuto(state.date);
        api.render();
      });
    });
  }

  function runItemHtml(r) {
    const pace = r.timeMin / r.distanceKm;
    const isPR = pace <= melhorPaceHistorico(r.id) + 0.0001 && melhorPaceHistorico(r.id) !== null;
    const min = Math.floor(pace);
    const sec = Math.round((pace - min) * 60);
    return `
      <div class="list-item" data-id="${r.id}">
        <div>
          <strong>${r.distanceKm}km em ${r.timeMin}min</strong> ${isPR ? '<span class="badge pr">🏆 PR</span>' : ''}
          <div class="meta">Pace: ${min}:${String(sec).padStart(2, '0')} min/km ${r.notes ? '· ' + Util.escapeHtml(r.notes) : ''}</div>
        </div>
        <button class="link" data-remove="${r.id}">✕</button>
      </div>
    `;
  }

  return { render };
})();
