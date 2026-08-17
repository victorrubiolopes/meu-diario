const ViewTreino = (() => {
  // Sessão de edição aberta por data (permite mais de um treino no mesmo dia).
  // Valor: { editId: string|null, plano: object|null } — editId=null significa "treino novo".
  const treinoSessaoPorData = new Map();
  // Intervalos dos cronômetros (treino e descanso) — vivem fora do ciclo normal de render pra
  // não travar/reiniciar a cada edição de série; só são limpos quando a tela de treino remonta.
  let cronometroInterval = null;
  let restTimerInterval = null;
  // Qual exercício está descansando e quanto falta: { i, restante }. Fica FORA do DOM porque
  // renderCards() reconstrói os cards a cada série marcada — justo quando o descanso começa.
  // Assim o cronômetro sobrevive ao re-render, e cardHtml pinta o estado certo ao remontar.
  let restState = null;

  // "1m30s", "90s", "2m", "1:30" ou "60" → segundos. O campo de descanso é texto livre,
  // então aceita os formatos que dá pra alguém digitar sem pensar. 0 = não deu pra ler.
  function segundosDoDescanso(txt) {
    if (!txt) return 0;
    const s = String(txt).trim().toLowerCase();
    if (!s) return 0;
    const mmss = s.match(/^(\d+)\s*:\s*([0-5]?\d)$/);
    if (mmss) return Number(mmss[1]) * 60 + Number(mmss[2]);
    let total = 0;
    let achou = false;
    const min = s.match(/(\d+)\s*m/);
    if (min) { total += Number(min[1]) * 60; achou = true; }
    const seg = s.match(/(\d+)\s*s/);
    if (seg) { total += Number(seg[1]); achou = true; }
    if (achou) return total;
    return /^\d+$/.test(s) ? Number(s) : 0;
  }
  function fmtRestante(seg) {
    return `${Math.floor(seg / 60)}:${String(seg % 60).padStart(2, '0')}`;
  }
  // O Map acima é só memória — se o app recarregar no meio de um treino (celular mata a
  // aba em segundo plano, comum em economia de bateria), ele some e a tela volta pra
  // "escolher treino" mesmo com os exercícios já marcados até ali intactos no Storage.
  // Espelha a sessão ativa no localStorage (só editId + id do plano, não o objeto todo) e
  // restaura no primeiro acesso do dia, pra continuar de onde parou em vez de "encerrar".
  const CHAVE_SESSAO_ATIVA = 'treino_sessao_ativa';
  function _setSessao(date, sessao) {
    // Preserva o inicioTs já existente quando a chamada é só pra re-linkar o editId (ex: primeiro
    // persist() criando a entrada) — sem isso o cronômetro do treino reiniciaria do zero.
    const atual = treinoSessaoPorData.get(date);
    const inicioTs = sessao.inicioTs !== undefined ? sessao.inicioTs : (atual ? atual.inicioTs : null);
    const nova = { ...sessao, inicioTs };
    treinoSessaoPorData.set(date, nova);
    const todas = JSON.parse(localStorage.getItem(CHAVE_SESSAO_ATIVA) || '{}');
    todas[date] = { editId: nova.editId, planoId: nova.plano ? nova.plano.id : null, inicioTs: nova.inicioTs };
    localStorage.setItem(CHAVE_SESSAO_ATIVA, JSON.stringify(todas));
  }
  function _clearSessao(date) {
    treinoSessaoPorData.delete(date);
    const todas = JSON.parse(localStorage.getItem(CHAVE_SESSAO_ATIVA) || '{}');
    delete todas[date];
    localStorage.setItem(CHAVE_SESSAO_ATIVA, JSON.stringify(todas));
  }
  // Restaura a sessão persistida (se houver e ainda não estiver no Map em memória).
  function _sessaoAtiva(date, planos) {
    if (treinoSessaoPorData.has(date)) return treinoSessaoPorData.get(date);
    const todas = JSON.parse(localStorage.getItem(CHAVE_SESSAO_ATIVA) || '{}');
    const salva = todas[date];
    if (!salva) return null;
    const sessao = { editId: salva.editId || null, plano: salva.planoId ? (planos.find(p => p.id === salva.planoId) || null) : null, inicioTs: salva.inicioTs || null };
    treinoSessaoPorData.set(date, sessao);
    return sessao;
  }
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
        if (ex.name && ex.name.trim().toLowerCase() === name.trim().toLowerCase()) {
          max = Math.max(max, Util.maxPesoExercicio(ex));
        }
      });
    });
    return max;
  }

  // Última carga registrada por série pra um exercício (o treino mais recente até dateISO que
  // tem esse exercício). Usa Util.pesosExercicio, tolerante ao formato antigo (peso único) e
  // novo (por série). Retorna null se nunca foi feito antes.
  function ultimaCargaPorSerie(name, dateISO) {
    if (!name || !name.trim()) return null;
    const all = Storage.getAll('treino').filter(e => e.date <= dateISO).sort((a, b) => b.date.localeCompare(a.date));
    for (const e of all) {
      const ex = (e.exercises || []).find(x => x.name && x.name.trim().toLowerCase() === name.trim().toLowerCase());
      if (!ex) continue;
      const pesos = Util.pesosExercicio(ex);
      if (pesos.length) return pesos;
    }
    return null;
  }

  function melhorPaceHistorico(excludeId) {
    const all = Storage.getAll('corridas').filter(c => c.id !== excludeId && c.distanceKm && c.timeMin);
    if (all.length === 0) return null;
    return Math.min(...all.map(c => c.timeMin / c.distanceKm));
  }

  function render($app, state, api) {
    const tipoHistorico = state.treinoSub === 'musculacao' ? 'treino' : 'corridas';
    const historico = Util.historicoTreinos().filter(h => h.tipo === tipoHistorico).slice(0, 15);
    const tituloHistorico = state.treinoSub === 'musculacao' ? 'Histórico de musculação' : 'Histórico de corridas';
    $app.innerHTML = `
      <div class="tabs-sub">
        <button data-sub="musculacao" class="${state.treinoSub === 'musculacao' ? 'active' : ''}">Musculação</button>
        <button data-sub="corrida" class="${state.treinoSub === 'corrida' ? 'active' : ''}">Corrida</button>
      </div>
      <div id="treino-content"></div>
      <div class="card dashboard-section">
        <div class="row" style="align-items:center;justify-content:space-between">
          <h2 style="margin:0">${tituloHistorico}</h2>
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
    // A tela remonta inteira (api.render()) bem menos vezes do que os cards re-renderizam sozinhos
    // (renderCards()), então é seguro limpar aqui: não interrompe o cronômetro a cada série marcada.
    if (cronometroInterval) { clearInterval(cronometroInterval); cronometroInterval = null; }
    if (restTimerInterval) { clearInterval(restTimerInterval); restTimerInterval = null; }
    restState = null;
    const todosHoje = Storage.getByDate('treino', state.date);
    const biblioteca = Storage.getAll('exercicios_biblioteca');
    const planos = Storage.getAll('treino_planos').sort((a, b) => a.ordem - b.ordem);
    const sugerido = Util.planoSugerido();
    const ultimoFeito = Util.ultimoTreinoFeito();
    const sessao = _sessaoAtiva(state.date, planos);

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
          <button class="secondary" id="marcar-rapido" style="width:100%;margin-top:8px">✓ Só marcar que treinei hoje</button>
        </div>
      `;
      content.innerHTML = `
        ${todosHoje.map(t => {
          const planoNome = t.planoId ? (planos.find(p => p.id === t.planoId) || {}).nome : null;
          const nExercicios = (t.exercises || []).length;
          const resumoExercicios = nExercicios === 0 ? 'treino rápido' : `${nExercicios} exercício${nExercicios === 1 ? '' : 's'}`;
          return `
            <div class="card">
              <h2>✅ Treino concluído</h2>
              <p><strong>${planoNome ? Util.escapeHtml(planoNome) : 'Treino livre'}</strong> — ${resumoExercicios}${t.duracaoMin ? ` · ${t.duracaoMin} min` : ''}</p>
              <button class="secondary" data-editar-treino="${t.id}">Editar treino</button>
              <button class="danger-btn" data-delete-treino="${t.id}">Excluir este treino</button>
            </div>
          `;
        }).join('')}
        ${planoPromptHtml}
      `;
      content.querySelectorAll('[data-editar-treino]').forEach(btn => {
        btn.addEventListener('click', () => {
          _setSessao(state.date, { editId: btn.dataset.editarTreino, plano: null });
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
        _setSessao(state.date, { editId: null, plano: escolhido, inicioTs: Date.now() });
        api.render();
      });
      // Registro rápido: pra quem só quer sinalizar "treinei hoje" sem detalhar exercício
      // por exercício (ex: já acompanha o treino em outro app). Sem plano, sem exercícios —
      // conta pra "dias em foco" e histórico igual, só aparece como "treino rápido".
      document.getElementById('marcar-rapido').addEventListener('click', () => {
        Storage.add('treino', { date: state.date, exercises: [] });
        if (typeof atualizarGastoAuto === 'function') atualizarGastoAuto(state.date);
        api.render();
      });
      return;
    }

    const existing = sessao.editId ? todosHoje.find(t => t.id === sessao.editId) : null;
    let planoIdAtual = existing ? existing.planoId || null : (sessao.plano ? sessao.plano.id : null);
    const planoParaPrefill = existing ? null : sessao.plano;
    let rows = (existing ? existing.exercises : (planoParaPrefill ? planoParaPrefill.exercises.map(e => ({ ...e })) : [{ name: '', sets: '', reps: '', weight: '', done: [] }])).map(e => ({ ...e }));
    if (rows.length === 0) rows = [{ name: '', sets: '', reps: '', weight: '', done: [] }];
    if (!existing) seedCargasHistorico(rows);
    // Id da entrada sendo editada nesta sessão — começa null se for um treino novo, e passa a
    // apontar pro registro assim que o primeiro persist() o cria.
    let entryId = existing ? existing.id : null;
    // Estado transitório de edição por card (não é persistido)
    const ui = { scheme: {} };
    const expandedVideos = new Set();

    content.innerHTML = `
      <datalist id="exercicios-datalist">
        ${biblioteca.map(e => `<option value="${Util.escapeHtml(e.name)}">`).join('')}
      </datalist>
      ${sessao.inicioTs ? `
        <div class="card treino-timer-card">
          <div class="treino-timer-elapsed" id="treino-cronometro">0:00</div>
          <p class="meta" style="margin:2px 0 0;text-align:center">⏱ treino em andamento</p>
        </div>
      ` : ''}
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
        <label>Duração (min) — vem do cronômetro ao finalizar; preencha só pra corrigir</label>
        <input type="number" id="treino-duracao" placeholder="${sessao.inicioTs ? 'automático (cronômetro)' : 'Ex: 50'}" value="${existing && existing.duracaoMin ? existing.duracaoMin : ''}">
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
    // Peso por série. Na primeira vez que um exercício com peso único antigo (r.weight) é
    // aberto, semeia todas as séries com esse valor em vez de deixar em branco — senão parece
    // que o dado sumiu ao editar um treino já salvo antes dessa funcionalidade existir.
    function ensureWeights(r) {
      const n = setsCount(r);
      if (!Array.isArray(r.weights) || r.weights.length === 0) {
        const seed = r.weight != null && r.weight !== '' ? String(r.weight) : '';
        r.weights = Array.from({ length: n }, () => seed);
      } else {
        while (r.weights.length < n) r.weights.push('');
        if (r.weights.length > n) r.weights = r.weights.slice(0, n);
      }
      return r.weights;
    }

    // Pré-preenche a carga de cada série com o que foi usado da última vez nesse exercício —
    // só entra em linhas que ainda não têm peso nenhum (não pisa em cima do que o usuário já digitou).
    function seedCargasHistorico(alvoRows) {
      alvoRows.forEach(r => {
        if (!r.name || !r.name.trim()) return;
        const jaTemPeso = (Array.isArray(r.weights) && r.weights.some(w => w != null && w !== '')) || (r.weight != null && r.weight !== '');
        if (jaTemPeso) return;
        const cargas = ultimaCargaPorSerie(r.name, state.date);
        if (!cargas || !cargas.length) return;
        const n = setsCount(r) || cargas.length;
        r.weights = Array.from({ length: n }, (_, j) => String(cargas[j] != null ? cargas[j] : cargas[cargas.length - 1]));
        r.weight = String(Math.max(...cargas));
      });
    }

    // Minutos já decorridos no cronômetro do treino (null se não há cronômetro rodando).
    function minutosCronometro() {
      if (!sessao || !sessao.inicioTs) return null;
      const mins = Math.round((Date.now() - sessao.inicioTs) / 60000);
      return mins > 0 ? mins : null;
    }

    function persist({ finalizando = false } = {}) {
      const cleaned = rows
        .filter(r => r.name && r.name.trim() !== '')
        .map(r => ({ name: r.name.trim(), sets: r.sets, reps: r.reps, weight: r.weight, weights: Array.isArray(r.weights) ? r.weights : [], descanso: r.descanso || '', obs: r.obs || '', done: Array.isArray(r.done) ? r.done : [] }));
      const notesEl = document.getElementById('treino-notes');
      const notes = notesEl ? notesEl.value.trim() : (existing ? existing.notes : '');
      const durEl = document.getElementById('treino-duracao');
      let duracaoMin = durEl ? (Number(durEl.value) || null) : (existing ? existing.duracaoMin : null);
      // Ao finalizar, o cronômetro já sabe quanto o treino durou — não faz sentido pedir pra
      // digitar de novo. Só entra quando o campo está vazio, pra respeitar correção manual.
      if (finalizando && !duracaoMin) duracaoMin = minutosCronometro();
      if (entryId) {
        Storage.update('treino', entryId, { exercises: cleaned, notes, planoId: planoIdAtual, duracaoMin });
      } else if (cleaned.length) {
        const novo = Storage.add('treino', { date: state.date, exercises: cleaned, notes, planoId: planoIdAtual, duracaoMin });
        entryId = novo.id;
        // Sem isso, um refresh antes daqui nunca sabe que essa entrada já existe: a sessão
        // restaurada volta pro template do plano (perdendo as cargas já digitadas) e o próximo
        // persist() cria OUTRA entrada nova — é assim que viravam 2-3 históricos duplicados.
        _setSessao(state.date, { editId: entryId, plano: null });
      }
      if (typeof atualizarGastoAuto === 'function') atualizarGastoAuto(state.date);
    }

    // Data desde a qual o peso atual do exercício se mantém (igual à referência "Desde ...")
    function weightSince(name, w) {
      if (!w || !name.trim()) return null;
      const all = Storage.getAll('treino').filter(e => e.date <= state.date).sort((a, b) => b.date.localeCompare(a.date));
      let since = state.date;
      for (const e of all) {
        const ex = (e.exercises || []).find(x => x.name && x.name.trim().toLowerCase() === name.trim().toLowerCase() && Util.maxPesoExercicio(x) > 0);
        if (!ex) continue;
        if (Util.maxPesoExercicio(ex) === Number(w)) since = e.date;
        else break;
      }
      return since;
    }

    const cardsEl = document.getElementById('ex-cards');

    function cardHtml(r, i) {
      ensureDone(r);
      ensureWeights(r);
      const grupo = grupoDe(r.name);
      const n = setsCount(r);
      const nameFilled = r.name && r.name.trim() !== '';
      const maxHist = nameFilled ? maxWeightHistorico(r.name, entryId) : 0;
      const bestWeight = Util.maxPesoExercicio(r);
      const isPR = bestWeight > 0 && nameFilled && bestWeight > maxHist && maxHist > 0;
      const since = weightSince(r.name, bestWeight);

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

      const setsBlock = n > 0
        ? `<div class="ex-series">
             ${Array.from({ length: n }).map((_, j) => `
               <div class="ex-serie-row">
                 <button class="ex-serie ${r.done[j] ? 'done' : ''}" data-serie="${i}-${j}">${r.done[j] ? '✓ ' : ''}Série ${j + 1}</button>
                 <input type="number" step="0.5" class="ex-serie-weight" placeholder="kg" data-serie-weight="${i}-${j}" value="${Util.escapeHtml(r.weights[j] || '')}">
               </div>
             `).join('')}
           </div>`
        : '';

      const weightSummaryBlock = `
        <div class="ex-weight-row">
          <div class="ex-weight-box">
            <div class="ex-weight-val">${ICON_WEIGHT}<span>${bestWeight > 0 ? `${bestWeight} kg` : '— kg'} · melhor série</span>${isPR ? '<span class="badge pr">🏆 PR</span>' : ''}</div>
            ${since && bestWeight > 0 ? `<div class="ex-weight-since">Desde ${Util.fmtDate(since)}</div>` : ''}
          </div>
        </div>
      `;

      // Descanso do próprio exercício: usa o tempo já definido no card (r.descanso). Sem tempo
      // definido, cai nos presets — assim quem não configurou nada não fica sem cronômetro.
      // Os dois estados (parado/rodando) são sempre renderizados e alternados por display, então
      // um renderCards() disparado por outra coisa não perde o cronômetro em andamento.
      const restSegs = segundosDoDescanso(r.descanso);
      const restAtivo = !!(restState && restState.i === i);
      const restLabel = restAtivo
        ? fmtRestante(restState.restante)
        : (restSegs > 0 ? `⏱ ${Util.escapeHtml(r.descanso)}` : '⏱ descanso');
      const restBlock = `
        <div class="ex-rest-timer${restAtivo ? ' ativo' : ''}" data-rest-wrap="${i}">
          <span class="ex-rest-display" data-rest-display="${i}">${restLabel}</span>
          <span class="ex-rest-controls" data-rest-controls="${i}"${restAtivo ? ' style="display:none"' : ''}>
            ${restSegs > 0
              ? `<button type="button" class="ex-rest-start" data-rest-start="${i}" data-rest-segs="${restSegs}">Descansar</button>`
              : [30, 60, 90, 120].map(s => `<button type="button" class="ex-rest-preset" data-rest-start="${i}" data-rest-segs="${s}">${s}s</button>`).join('')}
          </span>
          <button type="button" class="ex-rest-stop" data-rest-stop="${i}"${restAtivo ? '' : ' style="display:none"'}>Parar</button>
        </div>
      `;

      const musculoImg = GRUPO_ICONE_PATH[grupo];
      const thumbConteudo = musculoImg
        ? `<img src="${musculoImg}" alt="${Util.escapeHtml(grupo)}" class="ex-thumb-img">`
        : ICON_DUMBBELL;

      return `
        <div class="ex-card" data-i="${i}">
          <div class="ex-card-head">
            <span class="ex-thumb">${thumbConteudo}${nameFilled ? '<span class="ex-thumb-play">▶</span>' : ''}</span>
            <div class="ex-head-main">
              <input class="ex-name-input" list="exercicios-datalist" placeholder="Nome do exercício" value="${Util.escapeHtml(r.name)}">
              <div class="ex-grupo">${grupo ? Util.escapeHtml(grupo) : (nameFilled ? '' : 'Toque para nomear')}</div>
            </div>
            <button class="ex-remove" data-remove="${i}" aria-label="Remover">✕</button>
          </div>
          ${schemeBlock}
          ${setsBlock}
          ${restBlock}
          ${weightSummaryBlock}
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
          ensureWeights(rows[i]);
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
      cardsEl.querySelectorAll('[data-rest-start]').forEach(btn => {
        btn.addEventListener('click', () => {
          syncNames();
          iniciarRest(Number(btn.dataset.restStart), Number(btn.dataset.restSegs));
        });
      });
      cardsEl.querySelectorAll('[data-rest-stop]').forEach(btn => {
        btn.addEventListener('click', () => { syncNames(); pararRest(); });
      });
      cardsEl.querySelectorAll('[data-serie-weight]').forEach(inp => {
        inp.addEventListener('change', () => {
          syncNames();
          const [i, j] = inp.dataset.serieWeight.split('-').map(Number);
          ensureWeights(rows[i]);
          rows[i].weights[j] = inp.value;
          rows[i].weight = String(Util.maxPesoExercicio(rows[i]) || '');
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
      rows = (plano.exercises || []).map(e => ({ ...e, done: [], weights: [] }));
      if (rows.length === 0) rows.push({ name: '', sets: '', reps: '', weight: '', done: [] });
      seedCargasHistorico(rows);
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
      const durEl = document.getElementById('treino-duracao');
      const duracaoFinal = (durEl && Number(durEl.value)) || minutosCronometro();
      persist({ finalizando: true });
      atualizarGastoAuto(state.date);
      _clearSessao(state.date);
      alert(duracaoFinal ? `Treino concluído! 💪 ${duracaoFinal} min` : 'Treino concluído! 💪');
      api.render();
    });

    const btnDelete = document.getElementById('delete-treino');
    if (btnDelete) {
      btnDelete.addEventListener('click', () => {
        if (!entryId) { api.render(); return; }
        if (!confirm('Excluir o treino registrado neste dia? Esta ação não pode ser desfeita.')) return;
        Storage.remove('treino', entryId);
        if (typeof atualizarGastoAuto === 'function') atualizarGastoAuto(state.date);
        _clearSessao(state.date);
        api.render();
      });
    }

    // Cronômetro do treino: conta desde sessao.inicioTs, sobrevive a refresh (inicioTs vem do
    // localStorage) e não é reiniciado pelos re-renders de renderCards() porque vive fora do #ex-cards.
    if (sessao.inicioTs) {
      const elCronometro = document.getElementById('treino-cronometro');
      const elDuracao = document.getElementById('treino-duracao');
      function tickCronometro() {
        const segs = Math.max(0, Math.floor((Date.now() - sessao.inicioTs) / 1000));
        const h = Math.floor(segs / 3600);
        const m = Math.floor((segs % 3600) / 60);
        const s = segs % 60;
        const txt = h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
        if (elCronometro) elCronometro.textContent = txt;
        // Mostra no campo de duração o valor que será gravado sozinho, pra ficar claro que
        // não precisa digitar nada (só sobrescreve o placeholder, nunca o que o usuário digitou).
        if (elDuracao && !elDuracao.value) {
          const mins = Math.round(segs / 60);
          elDuracao.placeholder = mins > 0 ? `${mins} min (do cronômetro)` : 'automático (cronômetro)';
        }
      }
      tickCronometro();
      cronometroInterval = setInterval(tickCronometro, 1000);
    }

    // Cronômetro de descanso por exercício. Um só roda de cada vez — descanso é físico, não dá
    // pra descansar de dois exercícios ao mesmo tempo; começar num card cancela o outro.
    // Só quem dispara por toque (iniciar/parar) chama renderCards(); quando o tempo zera sozinho
    // a troca é feita direto no DOM, pra não apagar um peso que esteja sendo digitado na hora.
    function limparRestInterval() {
      if (restTimerInterval) { clearInterval(restTimerInterval); restTimerInterval = null; }
    }
    function tickRest() {
      if (!restState) return;
      const disp = cardsEl.querySelector(`[data-rest-display="${restState.i}"]`);
      if (disp) disp.textContent = fmtRestante(restState.restante);
      if (restState.restante === 0) {
        const i = restState.i;
        limparRestInterval();
        restState = null;
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
        const wrap = cardsEl.querySelector(`[data-rest-wrap="${i}"]`);
        if (wrap) {
          wrap.classList.remove('ativo');
          const d = wrap.querySelector('[data-rest-display]');
          const ctr = wrap.querySelector('[data-rest-controls]');
          const stop = wrap.querySelector('[data-rest-stop]');
          if (d) d.textContent = '🔔 acabou!';
          if (ctr) ctr.style.display = '';
          if (stop) stop.style.display = 'none';
        }
        return;
      }
      restState.restante--;
    }
    function iniciarRest(i, segundos) {
      limparRestInterval();
      restState = { i, restante: segundos };
      renderCards();
      tickRest();
      restTimerInterval = setInterval(tickRest, 1000);
    }
    function pararRest() {
      limparRestInterval();
      restState = null;
      renderCards();
    }

    renderCards();
  }

  function renderCorrida(content, state, api) {
    const runs = Storage.getByDate('corridas', state.date).sort((a, b) => (a.order || 0) - (b.order || 0));
    const planosCorrida = Storage.getAll('corrida_planos').sort((a, b) => (a.ordem || 0) - (b.ordem || 0));

    function resumoPlano(p) {
      const partes = [];
      if (p.tipo) partes.push(p.tipo);
      if (p.distanceKm) partes.push(`${p.distanceKm} km`);
      if (p.timeMin) partes.push(`${p.timeMin} min`);
      return partes.join(' · ');
    }

    content.innerHTML = `
      ${planosCorrida.length > 0 ? `
        <div class="card">
          <h2>🏃 Seus treinos de corrida</h2>
          ${planosCorrida.map(p => `
            <div class="list-item">
              <div>
                <strong>${Util.escapeHtml(p.nome)}</strong>
                ${resumoPlano(p) ? `<div class="meta">${Util.escapeHtml(resumoPlano(p))}</div>` : ''}
                ${p.descricao ? `<div class="meta">${Util.escapeHtml(p.descricao)}</div>` : ''}
              </div>
              ${(p.distanceKm || p.timeMin) ? `<button class="secondary" data-usar-corrida="${p.id}" style="font-size:0.75rem;padding:6px 10px">Usar</button>` : ''}
            </div>
          `).join('')}
          <p class="meta" style="font-size:0.72rem">"Usar" preenche a distância e o tempo abaixo — ajuste pro que você realmente fez antes de registrar.</p>
        </div>
      ` : ''}
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
    content.querySelectorAll('[data-usar-corrida]').forEach(btn => {
      btn.addEventListener('click', () => {
        const p = planosCorrida.find(x => x.id === btn.dataset.usarCorrida);
        if (!p) return;
        // Sempre atribui os dois campos (vazio quando o plano não define): senão sobra o
        // número do plano usado antes, e você registra a meta do treino errado sem perceber.
        document.getElementById('run-distance').value = p.distanceKm || '';
        document.getElementById('run-time').value = p.timeMin || '';
        const notas = document.getElementById('run-notes');
        if (notas && !notas.value.trim()) notas.value = p.nome;
        document.getElementById('run-distance').focus();
      });
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
