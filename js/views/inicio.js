const ViewInicio = (() => {
  const STATUS_LABELS = {
    estavel: '👍 Peso estável — dentro da manutenção',
    perdendo: 'Perdendo peso mesmo em manutenção',
    ganhando: 'Ganhando peso mesmo em manutenção',
    abaixo: '🐢 Progredindo mais devagar que o esperado',
    acima: '⚡ Progredindo mais rápido que o esperado',
    esperado: '✅ Dentro do ritmo esperado',
    oposto: '⚠️ Tendência oposta ao seu objetivo',
  };

  function progressBar(label, consumed, target, unit) {
    const pct = target ? Math.min(100, (consumed / target) * 100) : 0;
    const over = target && consumed > target;
    return `
      <div class="progress-block">
        <div class="progress-label">
          <span>${label}</span>
          <span class="val">${consumed.toFixed(0)}${unit} / ${target ? target.toFixed(0) : '—'}${unit}</span>
        </div>
        <div class="progress-track"><div class="progress-fill ${over ? 'over' : ''}" style="width:${pct}%"></div></div>
      </div>
    `;
  }

  // Um "dia em foco" = treino/corrida registrado + dentro da meta de calorias + meta de água batida.
  function calcularDiasFoco(meta, aguaMeta) {
    const treinoDatas = new Set(Storage.getAll('treino').map(t => t.date));
    const corridaDatas = new Set(Storage.getAll('corridas').map(c => c.date));
    const kcalPorData = {};
    Storage.getAll('alimentacao').forEach(e => { kcalPorData[e.date] = (kcalPorData[e.date] || 0) + (e.kcal || 0); });
    const aguaPorData = {};
    Storage.getAll('agua').forEach(a => { aguaPorData[a.date] = (aguaPorData[a.date] || 0) + (a.ml || 0); });

    function checar(date) {
      const exercicioOk = treinoDatas.has(date) || corridaDatas.has(date);
      const kcalDia = kcalPorData[date] || 0;
      const caloriasOk = !!meta && kcalDia > 0 && kcalDia <= meta.kcal;
      const aguaDia = aguaPorData[date] || 0;
      const aguaOk = !!aguaMeta && aguaDia >= aguaMeta;
      return { exercicioOk, caloriasOk, aguaOk, ok: exercicioOk && caloriasOk && aguaOk };
    }

    let streak = 0;
    for (let i = 1; i <= 365; i++) {
      if (checar(Util.daysAgo(i)).ok) streak++; else break;
    }
    return { streak, hoje: checar(Util.todayISO()) };
  }

  function render($app, state, api) {
    const perfil = Storage.getPerfil();
    const meta = calcularMetas(perfil);
    const comidas = Storage.getByDate('alimentacao', state.date);
    const kcalConsumido = comidas.reduce((s, e) => s + (e.kcal || 0), 0);
    const aguaMeta = calcularMetaAgua(perfil);
    const aguaConsumida = Storage.getByDate('agua', state.date).reduce((s, a) => s + a.ml, 0);

    const gastoExistente = Storage.getByDate('gastos', state.date)[0];
    const gastoExtra = gastoExistente ? gastoExistente.kcal : 0;

    const tendencia = typeof calcularTendenciaPeso === 'function' ? calcularTendenciaPeso() : null;
    const projecao = typeof calcularProjecaoPeso === 'function' ? calcularProjecaoPeso() : null;
    const diasFoco = calcularDiasFoco(meta, aguaMeta);

    const tarefas = Storage.getAll('tarefas').filter(t => ViewTarefas.isApplicable(t, state.date));
    const conclusoes = Storage.getAll('tarefas_conclusoes');
    const pendentes = tarefas.filter(t => !conclusoes.some(c => c.taskId === t.id && c.date === state.date));

    const treinoHoje = Storage.getByDate('treino', state.date)[0];
    const corridasHoje = Storage.getByDate('corridas', state.date);
    const planosExistem = Storage.getAll('treino_planos').length > 0;
    const sugerido = Util.planoSugerido();

    const medidasOrdenadas = Storage.getAll('medidas').filter(m => m.weight != null).sort((a, b) => b.date.localeCompare(a.date));
    const pesoAtual = medidasOrdenadas[0];
    const pesoAnterior = medidasOrdenadas[1];
    const variacao = pesoAtual && pesoAnterior ? (pesoAtual.weight - pesoAnterior.weight) : null;

    $app.innerHTML = `
      <div class="card dashboard-section">
        <h2>Calorias hoje</h2>
        ${meta ? `
          <div class="kcal-summary">
            <div><div class="num">${kcalConsumido.toFixed(0)}</div><div class="lbl">Consumido</div></div>
            <div><div class="num">${meta.kcal}</div><div class="lbl">Meta</div></div>
            <div><div class="num">${(meta.kcal - kcalConsumido).toFixed(0)}</div><div class="lbl">${meta.kcal - kcalConsumido >= 0 ? 'Restante' : 'Excedeu'}</div></div>
          </div>
          ${progressBar('Calorias', kcalConsumido, meta.kcal, '')}
          <label style="margin-top:12px">🔥 Calorias extras gastas hoje ${gastoExistente && gastoExistente.source === 'auto' ? '(estimado a partir do treino/corrida)' : gastoExistente && gastoExistente.source === 'manual' ? '(ajustado manualmente)' : '(manual)'}</label>
          <input type="number" id="gasto-extra-input" placeholder="Ex: 300" value="${gastoExtra || ''}">
          <p class="meta" style="font-size:0.72rem">Só informativo — não altera sua meta de calorias. Preenche sozinho quando você registra treino (com duração) ou corrida; edite se quiser ajustar.</p>
        ` : `<p class="empty">Complete seu perfil para ver sua meta de calorias.</p>`}
        ${aguaMeta ? progressBar('💧 Água', aguaConsumida, aguaMeta, 'ml') : ''}
      </div>

      <div class="card dashboard-section">
        <h2>🔥 Dias em foco</h2>
        <div style="text-align:center;padding:4px 0 10px">
          <div style="font-size:2.4rem;font-weight:700;color:var(--accent);line-height:1">${diasFoco.streak}</div>
          <div class="meta">dia${diasFoco.streak === 1 ? '' : 's'} seguido${diasFoco.streak === 1 ? '' : 's'} em foco</div>
        </div>
        <p class="meta">Hoje, pra manter o foco:</p>
        <div class="task-item">
          <span class="task-check ${diasFoco.hoje.exercicioOk ? 'done' : ''}">${diasFoco.hoje.exercicioOk ? '✓' : ''}</span>
          <span class="task-title ${diasFoco.hoje.exercicioOk ? 'done' : ''}">Treino ou corrida registrada</span>
        </div>
        <div class="task-item">
          <span class="task-check ${diasFoco.hoje.caloriasOk ? 'done' : ''}">${diasFoco.hoje.caloriasOk ? '✓' : ''}</span>
          <span class="task-title ${diasFoco.hoje.caloriasOk ? 'done' : ''}">Dentro da meta de calorias</span>
        </div>
        <div class="task-item">
          <span class="task-check ${diasFoco.hoje.aguaOk ? 'done' : ''}">${diasFoco.hoje.aguaOk ? '✓' : ''}</span>
          <span class="task-title ${diasFoco.hoje.aguaOk ? 'done' : ''}">Meta de água batida</span>
        </div>
      </div>

      <div class="card dashboard-section">
        <h2>Tendência do seu plano</h2>
        ${tendencia ? `
          <div class="row">
            <div class="card" style="margin:0;padding:10px;text-align:center">
              <div class="lbl" style="font-size:0.72rem;color:var(--text-muted)">Esperado</div>
              <strong>${tendencia.taxaEsperada >= 0 ? '+' : ''}${tendencia.taxaEsperada.toFixed(2)}kg/sem</strong>
            </div>
            <div class="card" style="margin:0;padding:10px;text-align:center">
              <div class="lbl" style="font-size:0.72rem;color:var(--text-muted)">Real (${tendencia.dias}d)</div>
              <strong>${tendencia.taxaReal >= 0 ? '+' : ''}${tendencia.taxaReal.toFixed(2)}kg/sem</strong>
            </div>
          </div>
          <p class="meta" style="margin-top:10px;text-align:center">${STATUS_LABELS[tendencia.status]}</p>
          <p class="meta" style="font-size:0.7rem;text-align:center">Estimativa geral (~7700kcal ≈ 1kg), não substitui acompanhamento profissional.</p>
        ` : `<p class="empty">Registre pelo menos 2 medições de peso (em dias diferentes) para ver sua tendência.</p>`}
        ${projecao && projecao.horizontes.length > 0 ? `
          <h3 style="margin-top:16px;font-size:0.9rem">Projeção futura (mantendo o ritmo atual)</h3>
          <div class="row" style="flex-wrap:wrap">
            ${projecao.horizontes.map(h => `
              <div class="card" style="margin:4px 0;padding:10px;text-align:center;flex:1 1 40%">
                <div class="lbl" style="font-size:0.72rem;color:var(--text-muted)">${Util.fmtDate(h.data)} (${h.semanas}sem)</div>
                <strong>${h.peso}kg</strong>
              </div>
            `).join('')}
          </div>
          <p class="meta" style="font-size:0.7rem;text-align:center">
            ${projecao.kgPorSemana < 0 ? 'Perdendo' : 'Ganhando'} ~${Math.abs(projecao.kgPorSemana)}kg/semana com base na meta de calorias selecionada (${meta.kcal}kcal) vs. seu gasto (TDEE ${meta.tdee}kcal). Projeção simples, não considera adaptação metabólica.
          </p>
        ` : ''}
      </div>

      <div class="card dashboard-section">
        <h2>Tarefas de hoje</h2>
        ${tarefas.length > 0 ? progressBar('Concluídas', tarefas.length - pendentes.length, tarefas.length, '') : ''}
        ${pendentes.length === 0 ? '<div class="empty">Tudo em dia por aqui 🎉</div>' : pendentes.map(t => `
          <div class="task-item">
            <button class="task-check" data-toggle="${t.id}"></button>
            <span class="task-title">${Util.escapeHtml(t.title)}</span>
          </div>
        `).join('')}
      </div>

      <div class="card dashboard-section">
        <h2>Treino de hoje</h2>
        ${planosExistem && !treinoHoje ? `<p class="meta">Sugestão: <strong>${sugerido ? Util.escapeHtml(sugerido.nome) : '—'}</strong></p>` : ''}
        <p>${treinoHoje ? `✅ Musculação registrada (${(treinoHoje.exercises || []).length} exercícios)` : '⬜ Nenhuma musculação registrada hoje'}</p>
        <p>${corridasHoje.length > 0 ? `✅ ${corridasHoje.length} corrida(s) registrada(s)` : '⬜ Nenhuma corrida registrada hoje'}</p>
      </div>

      <div class="card dashboard-section">
        <h2>Peso</h2>
        ${pesoAtual ? `
          <p><strong>${pesoAtual.weight}kg</strong> em ${Util.fmtDate(pesoAtual.date)}
          ${variacao != null ? ` <span class="meta">(${variacao > 0 ? '+' : ''}${variacao.toFixed(1)}kg desde a última medição)</span>` : ''}</p>
        ` : '<p class="empty">Nenhuma medição registrada ainda</p>'}
      </div>
    `;

    $app.querySelectorAll('[data-toggle]').forEach(btn => {
      btn.addEventListener('click', () => {
        const all = Storage.getAll('tarefas_conclusoes');
        all.push({ id: Storage.uid(), taskId: btn.dataset.toggle, date: state.date });
        Storage.saveAll('tarefas_conclusoes', all);
        api.render();
      });
    });

    const gastoInput = document.getElementById('gasto-extra-input');
    if (gastoInput) {
      gastoInput.addEventListener('change', () => {
        const kcal = Number(gastoInput.value) || 0;
        if (gastoExistente) {
          Storage.update('gastos', gastoExistente.id, { kcal, source: 'manual' });
        } else {
          Storage.add('gastos', { date: state.date, kcal, source: 'manual' });
        }
        api.render();
      });
    }
  }

  return { render };
})();
