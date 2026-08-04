const ViewTreino = (() => {
  // Sessão de edição aberta por data (permite mais de um treino no mesmo dia).
  // Valor: { editId: string|null, plano: object|null } — editId=null significa "treino novo".
  const treinoSessaoPorData = new Map();
  // Histórico de treinos: recolhido por padrão, mostra só os mais recentes até expandir.
  let historicoAberto = false;
  const HISTORICO_RESUMO = 3;

  // Ícones inline reutilizados nos cards de exercício
  const ICON_DUMBBELL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 12h12"/><rect x="2.5" y="9" width="3" height="6" rx="1"/><rect x="18.5" y="9" width="3" height="6" rx="1"/><rect x="5.5" y="7" width="2" height="10" rx="1"/><rect x="16.5" y="7" width="2" height="10" rx="1"/></svg>';
  const ICON_REPEAT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 2l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>';
  const ICON_WEIGHT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 8h10l1.2 11a1 1 0 0 1-1 1.1H6.8a1 1 0 0 1-1-1.1L7 8z"/><path d="M9 8a3 3 0 0 1 6 0"/></svg>';

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
    const historico = Util.historicoTreinos(15);
    $app.innerHTML = `
      <div class="tabs-sub">
        <button data-sub="musculacao" class="${state.treinoSub === 'musculacao' ? 'active' : ''}">Musculação</button>
        <button data-sub="corrida" class="${state.treinoSub === 'corrida' ? 'active' : ''}">Corrida</button>
      </div>
      <div id="treino-content"></div>
      <div class="card dashboard-section">
        <div class="row" style="align-items:center;justify-content:space-between">
          <h2 style="margin:0">Histórico de treinos</h2>
          ${historico.length > HISTORICO_RESUMO ? `
            <button type="button" class="link" data-toggle-historico style="font-size:0.8rem">${historicoAberto ? '▲ Minimizar' : `▾ Ver todos (${historico.length})`}</button>
          ` : ''}
        </div>
        ${historico.length === 0 ? '<div class="empty">Nenhum treino registrado ainda</div>' : (historicoAberto ? historico : historico.slice(0, HISTORICO_RESUMO)).map(h => `
          <div class="list-item">
            <div>
              <strong>${Util.fmtDate(h.date)}</strong>
              <div class="meta">${Util.escapeHtml(h.resumo)}</div>
            </div>
            <button class="link" data-del-historico="${h.tipo}:${h.id}" aria-label="Excluir">✕</button>
          </div>
        `).join('')}
      </div>
    `;
    $app.querySelectorAll('[data-sub]').forEach(btn => {
      btn.addEventListener('click', () => { state.treinoSub = btn.dataset.sub; api.render(); });
    });
    const toggleHistoricoBtn = $app.querySelector('[data-toggle-historico]');
    if (toggleHistoricoBtn) {
      toggleHistoricoBtn.addEventListener('click', () => {
        historicoAberto = !historicoAberto;
        api.render();
      });
    }
    $app.querySelectorAll('[data-del-historico]').forEach(btn => {
      btn.addEventListener('click', () => {
        const sep = btn.dataset.delHistorico.indexOf(':');
        const tipo = btn.dataset.delHistorico.slice(0, sep);
        const id = btn.dataset.delHistorico.slice(sep + 1);
        if (!confirm('Excluir este treino do histórico? Esta ação não pode ser desfeita.')) return;
        const item = Storage.getAll(tipo).find(x => x.id === id);
        Storage.remove(tipo, id);
        if (item && typeof atualizarGastoAuto === 'function') atualizarGastoAuto(item.date);
        api.render();
      });
    });
    const content = document.getElementById('treino-content');
    if (state.treinoSub === 'musculacao') renderMusculacao(content, state, api);
    else renderCorrida(content, state, api);
  }

  function renderMusculacao(content, state, api) {
    const todosHoje = Storage.getByDate('treino', state.date);
    const biblioteca = Storage.getAll('exercicios_biblioteca');
    const planos = Storage.getAll('treino_planos').sort((a, b) => a.ordem - b.ordem);
    const sugerido = Util.planoSugerido();
    const ultimoFeito = Util.ultimoTreinoFeito();
    const sessao = treinoSessaoPorData.get(state.date);

    if (!sessao) {
      const planoPromptHtml = `
        <div class="card">
          <h2>${todosHoje.length > 0 ? 'Adicionar outro treino' : 'Treino de hoje'}</h2>
          ${ultimoFeito ? `<p class="meta">Último feito: <strong>${Util.escapeHtml(ultimoFeito.nome)}</strong> em ${Util.fmtDate(ultimoFeito.date)}</p>` : ''}
          ${planos.length > 0 ? `
            <label>Qual treino você vai fazer?</label>
            <select id="prompt-plano-select">
              ${planos.map(p => `<option value="${p.id}" ${sugerido && p.id === sugerido.id ? 'selected' : ''}>${Util.escapeHtml(p.nome)}</option>`).join('')}
              <option value="">Treino livre (sem plano)</option>
            </select>
            ${sugerido ? `<p class="meta" style="margin-top:4px">Sugestão baseada no último treino registrado — troque acima se não for o certo.</p>` : ''}
          ` : '<p><strong>Treino livre</strong></p>'}
          <button class="primary" id="iniciar-treino" style="width:100%;margin-top:10px">▶ Iniciar treino</button>
        </div>
      `;
      content.innerHTML = `
        ${todosHoje.map(t => {
          const planoNome = t.planoId ? (planos.find(p => p.id === t.planoId) || {}).nome : null;
          return `
            <div class="card">
              <h2>✅ Treino concluído</h2>
              <p><strong>${planoNome ? Util.escapeHtml(planoNome) : 'Treino livre'}</strong> — ${(t.exercises || []).length} exercício${(t.exercises || []).length === 1 ? '' : 's'}${t.duracaoMin ? ` · ${t.duracaoMin} min` : ''}</p>
              <button class="secondary" data-editar-treino="${t.id}">Editar treino</button>
              <button class="danger-btn" data-delete-treino="${t.id}">Excluir este treino</button>
            </div>
          `;
        }).join('')}
        ${planoPromptHtml}
      `;
      content.querySelectorAll('[data-editar-treino]').forEach(btn => {
        btn.addEventListener('click', () => {
          treinoSessaoPorData.set(state.date, { editId: btn.dataset.editarTreino, plano: null });
          api.render();
        });
      });
      content.querySelectorAll('[data-delete-treino]').forEach(btn => {
        btn.addEventListener('click', () => {
          if (!confirm('Excluir este treino registrado? Esta ação não pode ser desfeita.')) return;
          Storage.remove('treino', btn.dataset.deleteTreino);
          if (typeof atualizarGastoAuto === 'function') atualizarGastoAuto(state.date);
          api.render();
        });
      });
      document.getElementById('iniciar-treino').addEventListener('click', () => {
        const sel = document.getElementById('prompt-plano-select');
        const escolhido = sel ? (planos.find(p => p.id === sel.value) || null) : null;
        treinoSessaoPorData.set(state.date, { editId: null, plano: escolhido });
        api.render();
      });
      return;
    }

    const existing = sessao.editId ? todosHoje.find(t => t.id === sessao.editId) : null;
    let planoIdAtual = existing ? existing.planoId || null : (sessao.plano ? sessao.plano.id : null);
    const planoParaPrefill = existing ? null : sessao.plano;
    let rows = (existing ? existing.exercises : (planoParaPrefill ? planoParaPrefill.exercises.map(e => ({ ...e })) : [{ name: '', sets: '', reps: '', weight: '', done: [] }])).map(e => ({ ...e }));
    if (rows.length === 0) rows = [{ name: '', sets: '', reps: '', weight: '', done: [] }];
    // Id da entrada sendo editada nesta sessão — começa null se for um treino novo, e passa a
    // apontar pro registro assim que o primeiro persist() o cria.
    let entryId = existing ? existing.id : null;
    // Estado transitório de edição por card (não é persistido)
    const ui = { scheme: {}, weight: {} };
    const expandedVideos = new Set();

    content.innerHTML = `
      <datalist id="exercicios-datalist">
        ${biblioteca.map(e => `<option value="${Util.escapeHtml(e.name)}">`).join('')}
      </datalist>
      ${planos.length > 0 ? `
        <div class="card">
          <h2>Treino sugerido hoje</h2>
          ${ultimoFeito ? `<p class="meta">Último feito: <strong>${Util.escapeHtml(ultimoFeito.nome)}</strong> em ${Util.fmtDate(ultimoFeito.date)}</p>` : ''}
          <p><strong>${sugerido ? Util.escapeHtml(sugerido.nome) : '—'}</strong> <span class="meta">(baseado no último treino registrado)</span></p>
          <button class="secondary" id="usar-sugerido" ${!sugerido ? 'disabled' : ''}>Usar este plano</button>
          <label style="margin-top:12px">Ou escolha outro plano</label>
          <select id="escolher-plano">
            <option value="">Nenhum (treino livre)</option>
            ${planos.map(p => `<option value="${p.id}" ${planoIdAtual === p.id ? 'selected' : ''}>${Util.escapeHtml(p.nome)}</option>`).join('')}
          </select>
          ${existing ? `
            <p class="meta" style="font-size:0.7rem;margin-top:4px">⚠️ Trocar o plano acima substitui os exercícios pelo modelo do plano escolhido.</p>
            <label style="margin-top:10px">Rótulo deste treino (não mexe nos exercícios já preenchidos)</label>
            <select id="corrigir-rotulo-plano">
              <option value="">Treino livre</option>
              ${planos.map(p => `<option value="${p.id}" ${planoIdAtual === p.id ? 'selected' : ''}>${Util.escapeHtml(p.nome)}</option>`).join('')}
            </select>
          ` : ''}
        </div>
      ` : ''}
      <div id="ex-cards"></div>
      <button class="secondary" id="add-exercise" style="width:100%;padding:12px;margin-bottom:14px">+ Adicionar exercício</button>
      <div class="card">
        <label>Duração (min) — opcional, usada para estimar calorias gastas</label>
        <input type="number" id="treino-duracao" placeholder="Ex: 50" value="${existing && existing.duracaoMin ? existing.duracaoMin : ''}">
        <label>Notas do treino</label>
        <textarea id="treino-notes" placeholder="Sensação, observações...">${Util.escapeHtml(existing ? existing.notes : '')}</textarea>
        <button class="primary" id="save-treino">✅ Finalizar treino</button>
        ${existing ? '<button class="danger-btn" id="delete-treino">Excluir este treino</button>' : ''}
      </div>
    `;

    function grupoDe(name) {
      const d = biblioteca.find(e => e.name.trim().toLowerCase() === (name || '').trim().toLowerCase());
      return d ? d.grupo : '';
    }
    function videoDe(name) {
      const d = biblioteca.find(e => e.name.trim().toLowerCase() === (name || '').trim().toLowerCase());
      return (d && d.videoUrl) || Util.youtubeSearchUrl(name);
    }
    function setsCount(r) { return Math.max(0, Math.min(12, Number(r.sets) || 0)); }
    function ensureDone(r) {
      const n = setsCount(r);
      if (!Array.isArray(r.done)) r.done = [];
      while (r.done.length < n) r.done.push(false);
      if (r.done.length > n) r.done = r.done.slice(0, n);
      return r.done;
    }

    function persist() {
      const cleaned = rows
        .filter(r => r.name && r.name.trim() !== '')
        .map(r => ({ name: r.name.trim(), sets: r.sets, reps: r.reps, weight: r.weight, descanso: r.descanso || '', obs: r.obs || '', done: Array.isArray(r.done) ? r.done : [] }));
      const notesEl = document.getElementById('treino-notes');
      const notes = notesEl ? notesEl.value.trim() : (existing ? existing.notes : '');
      const durEl = document.getElementById('treino-duracao');
      const duracaoMin = durEl ? (Number(durEl.value) || null) : (existing ? existing.duracaoMin : null);
      if (entryId) {
        Storage.update('treino', entryId, { exercises: cleaned, notes, planoId: planoIdAtual, duracaoMin });
      } else if (cleaned.length) {
        const novo = Storage.add('treino', { date: state.date, exercises: cleaned, notes, planoId: planoIdAtual, duracaoMin });
        entryId = novo.id;
      }
      if (typeof atualizarGastoAuto === 'function') atualizarGastoAuto(state.date);
    }

    // Data desde a qual o peso atual do exercício se mantém (igual à referência "Desde ...")
    function weightSince(name, w) {
      if (!w || !name.trim()) return null;
      const all = Storage.getAll('treino').filter(e => e.date <= state.date).sort((a, b) => b.date.localeCompare(a.date));
      let since = state.date;
      for (const e of all) {
        const ex = (e.exercises || []).find(x => x.name && x.name.trim().toLowerCase() === name.trim().toLowerCase() && x.weight);
        if (!ex) continue;
        if (Number(ex.weight) === Number(w)) since = e.date;
        else break;
      }
      return since;
    }

    const cardsEl = document.getElementById('ex-cards');

    function cardHtml(r, i) {
      ensureDone(r);
      const grupo = grupoDe(r.name);
      const n = setsCount(r);
      const nameFilled = r.name && r.name.trim() !== '';
      const maxHist = nameFilled ? maxWeightHistorico(r.name, entryId) : 0;
      const isPR = r.weight && nameFilled && Number(r.weight) > maxHist && maxHist > 0;
      const since = weightSince(r.name, r.weight);

      const schemeBlock = ui.scheme[i]
        ? `<div class="ex-scheme-edit">
             <div class="ex-scheme-edit-top">
               <input type="number" class="ex-sets-input" placeholder="Séries" value="${Util.escapeHtml(r.sets)}">
               <span>x</span>
               <input type="text" class="ex-reps-input" placeholder="8 a 10" value="${Util.escapeHtml(r.reps)}">
             </div>
             <input type="text" class="ex-descanso-input" placeholder="Descanso (ex: 1m30s)" value="${Util.escapeHtml(r.descanso || '')}">
             <input type="text" class="ex-obs-input" placeholder="Observação (ex: 1ª série aquecimento)" value="${Util.escapeHtml(r.obs || '')}">
             <button class="ex-scheme-ok" data-scheme-ok="${i}">OK</button>
           </div>`
        : `<button class="ex-scheme-pill" data-scheme="${i}">
             ${ICON_REPEAT}
             <span>${(r.sets || r.reps) ? `${Util.escapeHtml(r.sets || '?')}x${Util.escapeHtml(r.reps || '?')}` : 'Definir séries e reps'}</span>
             ${r.descanso ? `<span class="ex-rest">⏱ ${Util.escapeHtml(r.descanso)}</span>` : ''}
           </button>`;

      const seriesBlock = n > 0
        ? `<div class="ex-series">
             ${Array.from({ length: n }).map((_, j) =>
               `<button class="ex-serie ${r.done[j] ? 'done' : ''}" data-serie="${i}-${j}">${r.done[j] ? '✓ ' : ''}Série ${j + 1}</button>`
             ).join('')}
           </div>`
        : '';

      const weightBlock = ui.weight[i]
        ? `<div class="ex-weight-row">
             <input type="number" step="0.5" class="ex-weight-input" placeholder="Peso (kg)" value="${Util.escapeHtml(r.weight)}">
             <button class="ex-weight-ok" data-weight-ok="${i}">OK</button>
           </div>`
        : `<div class="ex-weight-row">
             <div class="ex-weight-box">
               <div class="ex-weight-val">${ICON_WEIGHT}<span>${r.weight ? `${Util.escapeHtml(r.weight)} kg` : '— kg'}</span>${isPR ? '<span class="badge pr">🏆 PR</span>' : ''}</div>
               ${since && r.weight ? `<div class="ex-weight-since">Desde ${Util.fmtDate(since)}</div>` : ''}
             </div>
             <button class="ex-weight-update" data-weight="${i}">+ Atualizar</button>
           </div>`;

      return `
        <div class="ex-card" data-i="${i}">
          <div class="ex-card-head">
            <span class="ex-thumb">${ICON_DUMBBELL}${nameFilled ? '<span class="ex-thumb-play">▶</span>' : ''}</span>
            <div class="ex-head-main">
              <input class="ex-name-input" list="exercicios-datalist" placeholder="Nome do exercício" value="${Util.escapeHtml(r.name)}">
              <div class="ex-grupo">${grupo ? Util.escapeHtml(grupo) : (nameFilled ? '' : 'Toque para nomear')}</div>
            </div>
            <button class="ex-remove" data-remove="${i}" aria-label="Remover">✕</button>
          </div>
          ${schemeBlock}
          ${seriesBlock}
          ${weightBlock}
          ${r.obs ? `<div class="ex-obs">📝 ${Util.escapeHtml(r.obs)}</div>` : ''}
          ${nameFilled ? videoBlock(r, i) : ''}
        </div>
      `;
    }

    // Player embutido do YouTube quando há link específico; senão, link de busca externo.
    function videoBlock(r, i) {
      const doLib = biblioteca.find(e => e.name.trim().toLowerCase() === r.name.trim().toLowerCase());
      const videoUrl = doLib && doLib.videoUrl;
      const embedId = Util.youtubeEmbedId ? Util.youtubeEmbedId(videoUrl) : null;
      if (embedId) {
        const isOpen = expandedVideos.has(i);
        return `
          <button type="button" class="ex-video-link" data-togglevideo="${i}">${isOpen ? '▲ Ocultar vídeo' : '▶ Ver vídeo do exercício'}</button>
          ${isOpen ? `<div class="ex-video-embed"><iframe width="100%" height="100%" src="https://www.youtube.com/embed/${embedId}" title="Vídeo do exercício" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>` : ''}
        `;
      }
      const url = videoUrl || Util.youtubeSearchUrl(r.name);
      return `<a href="${url}" target="_blank" rel="noopener" class="ex-video-link">▶ Ver vídeo do exercício</a>`;
    }

    function syncNames() {
      cardsEl.querySelectorAll('.ex-card').forEach(card => {
        const i = Number(card.dataset.i);
        const inp = card.querySelector('.ex-name-input');
        if (inp && rows[i]) rows[i].name = inp.value;
      });
    }

    function renderCards() {
      cardsEl.innerHTML = rows.map((r, i) => cardHtml(r, i)).join('');
      bindCards();
    }

    function bindCards() {
      cardsEl.querySelectorAll('.ex-name-input').forEach(inp => {
        inp.addEventListener('change', () => { syncNames(); persist(); renderCards(); });
      });
      cardsEl.querySelectorAll('[data-remove]').forEach(btn => {
        btn.addEventListener('click', () => {
          syncNames();
          rows.splice(Number(btn.dataset.remove), 1);
          if (rows.length === 0) rows.push({ name: '', sets: '', reps: '', weight: '', done: [] });
          persist();
          renderCards();
        });
      });
      cardsEl.querySelectorAll('[data-scheme]').forEach(btn => {
        btn.addEventListener('click', () => {
          syncNames();
          ui.scheme[Number(btn.dataset.scheme)] = true;
          renderCards();
          const card = cardsEl.querySelector(`.ex-card[data-i="${btn.dataset.scheme}"]`);
          const f = card && card.querySelector('.ex-sets-input');
          if (f) f.focus();
        });
      });
      cardsEl.querySelectorAll('[data-scheme-ok]').forEach(btn => {
        btn.addEventListener('click', () => {
          syncNames();
          const i = Number(btn.dataset.schemeOk);
          const card = cardsEl.querySelector(`.ex-card[data-i="${i}"]`);
          rows[i].sets = card.querySelector('.ex-sets-input').value;
          rows[i].reps = card.querySelector('.ex-reps-input').value;
          rows[i].descanso = card.querySelector('.ex-descanso-input').value;
          rows[i].obs = card.querySelector('.ex-obs-input').value;
          ensureDone(rows[i]);
          ui.scheme[i] = false;
          persist();
          renderCards();
        });
      });
      cardsEl.querySelectorAll('[data-serie]').forEach(btn => {
        btn.addEventListener('click', () => {
          syncNames();
          const [i, j] = btn.dataset.serie.split('-').map(Number);
          ensureDone(rows[i]);
          rows[i].done[j] = !rows[i].done[j];
          persist();
          renderCards();
        });
      });
      cardsEl.querySelectorAll('[data-weight]').forEach(btn => {
        btn.addEventListener('click', () => {
          syncNames();
          ui.weight[Number(btn.dataset.weight)] = true;
          renderCards();
          const card = cardsEl.querySelector(`.ex-card[data-i="${btn.dataset.weight}"]`);
          const f = card && card.querySelector('.ex-weight-input');
          if (f) { f.focus(); f.select(); }
        });
      });
      cardsEl.querySelectorAll('[data-weight-ok]').forEach(btn => {
        btn.addEventListener('click', () => {
          syncNames();
          const i = Number(btn.dataset.weightOk);
          const card = cardsEl.querySelector(`.ex-card[data-i="${i}"]`);
          rows[i].weight = card.querySelector('.ex-weight-input').value;
          ui.weight[i] = false;
          persist();
          renderCards();
        });
      });
      cardsEl.querySelectorAll('[data-togglevideo]').forEach(btn => {
        btn.addEventListener('click', () => {
          syncNames();
          const i = Number(btn.dataset.togglevideo);
          if (expandedVideos.has(i)) expandedVideos.delete(i); else expandedVideos.add(i);
          renderCards();
        });
      });
    }

    function aplicarPlano(plano) {
      if (!plano) return;
      planoIdAtual = plano.id;
      rows = (plano.exercises || []).map(e => ({ ...e, done: [] }));
      if (rows.length === 0) rows.push({ name: '', sets: '', reps: '', weight: '', done: [] });
      persist();
      renderCards();
    }

    if (planos.length > 0) {
      document.getElementById('usar-sugerido').addEventListener('click', () => aplicarPlano(sugerido));
      document.getElementById('escolher-plano').addEventListener('change', e => {
        const plano = planos.find(p => p.id === e.target.value);
        if (plano) aplicarPlano(plano);
        else { planoIdAtual = null; persist(); }
      });
      const corrigirRotulo = document.getElementById('corrigir-rotulo-plano');
      if (corrigirRotulo) {
        corrigirRotulo.addEventListener('change', e => {
          planoIdAtual = e.target.value || null;
          persist();
        });
      }
    }

    document.getElementById('add-exercise').addEventListener('click', () => {
      syncNames();
      rows.push({ name: '', sets: '', reps: '', weight: '', done: [] });
      renderCards();
    });

    document.getElementById('save-treino').addEventListener('click', () => {
      syncNames();
      const cleaned = rows.filter(r => r.name && r.name.trim() !== '');
      if (cleaned.length === 0) { alert('Adicione pelo menos um exercício antes de finalizar.'); return; }
      persist();
      atualizarGastoAuto(state.date);
      treinoSessaoPorData.delete(state.date);
      alert('Treino concluído! 💪');
      api.render();
    });

    const btnDelete = document.getElementById('delete-treino');
    if (btnDelete) {
      btnDelete.addEventListener('click', () => {
        if (!entryId) { api.render(); return; }
        if (!confirm('Excluir o treino registrado neste dia? Esta ação não pode ser desfeita.')) return;
        Storage.remove('treino', entryId);
        if (typeof atualizarGastoAuto === 'function') atualizarGastoAuto(state.date);
        treinoSessaoPorData.delete(state.date);
        api.render();
      });
    }

    renderCards();
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
