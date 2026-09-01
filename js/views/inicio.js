const ViewInicio = (() => {
  // Domingo que inicia a semana exibida no calendário de foco ('YYYY-MM-DD'). Null = deriva da data selecionada.
  let calWeekStart = null;

  const STATUS_LABELS = {
    estavel: '👍 Peso estável — dentro da manutenção',
    perdendo: 'Perdendo peso mesmo em manutenção',
    ganhando: 'Ganhando peso mesmo em manutenção',
    abaixo: '🐢 Progredindo mais devagar que o esperado',
    acima: '⚡ Progredindo mais rápido que o esperado',
    esperado: '✅ Dentro do ritmo esperado',
    oposto: '⚠️ Tendência oposta ao seu objetivo',
  };

  // Ícones de linha (mesmo traço dos ícones da navegação inferior) pro card Composição corporal —
  // ficam nítidos em qualquer tamanho e mudam de cor sozinhos com currentColor.
  const ICON_PESO = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="12.5" width="17" height="7.5" rx="2.5"/><path d="M7.3 12.5a4.7 4.7 0 0 1 9.4 0"/><circle cx="12" cy="16.2" r="0.6" fill="currentColor" stroke="none"/></svg>`;
  const ICON_MASSA_MAGRA = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19V14.5"/><path d="M10 19V9.5"/><path d="M16 19V5.5"/><path d="M3.5 19h17"/></svg>`;
  const ICON_GORDURA = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="6.5" y1="17.5" x2="17.5" y2="6.5"/><circle cx="8" cy="8" r="1.6" fill="currentColor" stroke="none"/><circle cx="16" cy="16" r="1.6" fill="currentColor" stroke="none"/></svg>`;

  // Uma linha do card "Composição corporal": ícone + valor + barra (verde = posição na faixa
  // de referência, marcador laranja = valor atual). pct null = sem dado suficiente pra calcular a barra.
  function compRowHtml(icon, valor, unidade, casas, pct, corIcone, semDadoLabel) {
    if (valor == null) {
      return `
        <div class="comp-row">
          <div class="comp-icon ${corIcone}">${icon}</div>
          <div class="comp-value"><span class="comp-unit">${semDadoLabel}</span></div>
        </div>
      `;
    }
    const p = pct == null ? 50 : Math.max(4, Math.min(100, pct));
    return `
      <div class="comp-row">
        <div class="comp-icon ${corIcone}">${icon}</div>
        <div class="comp-value"><strong>${valor.toFixed(casas)}</strong><span class="comp-unit"> ${unidade}</span></div>
        <div class="comp-track"><div class="comp-fill" style="width:${p}%"></div><div class="comp-marker" style="left:${p}%"></div></div>
      </div>
    `;
  }

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

  // Anel de progresso genérico (calorias e macros no Início) — conic-gradient, sem lib de gráfico.
  function ringHtml(pct, corVar, size, innerHtml) {
    const p = Math.max(0, Math.min(100, pct || 0));
    return `<div class="ring" style="--size:${size}px;--pct:${p};--ring-color:var(${corVar})"><div class="ring-inner">${innerHtml}</div></div>`;
  }

  function macroRingHtml(label, corVar, valor, alvo) {
    const pct = alvo ? Math.min(100, Math.round((valor / alvo) * 100)) : 0;
    return `
      <div class="macro-ring-item">
        <div class="macro-ring" style="--pct:${pct};--ring-color:var(${corVar})"><span class="macro-ring-label">${pct}%</span></div>
        <span class="macro-ring-name" style="color:var(${corVar})">${label}</span>
        <span class="macro-ring-grams">${valor.toFixed(0)}/${Math.round(alvo || 0)}g</span>
      </div>
    `;
  }

  // Um "dia em foco" = treino/corrida registrado + dentro da meta de calorias + meta de água batida.
  function calcularDiasFoco(meta, aguaMeta) {
    const treinoDatas = new Set(Storage.getAll('treino').map(t => t.date));
    const corridaDatas = new Set(Storage.getAll('corridas').map(c => c.date));
    const kcalPorData = {};
    const refeicoesPorData = {};
    Storage.getAll('alimentacao').forEach(e => {
      kcalPorData[e.date] = (kcalPorData[e.date] || 0) + (e.kcal || 0);
      if (!refeicoesPorData[e.date]) refeicoesPorData[e.date] = new Set();
      refeicoesPorData[e.date].add(e.mealType);
    });
    const aguaPorData = {};
    Storage.getAll('agua').forEach(a => { aguaPorData[a.date] = (aguaPorData[a.date] || 0) + (a.ml || 0); });
    // Mesma regra de "refeições obrigatórias" da Refeição Livre (Mais → Refeição Livre),
    // pra não ter duas definições diferentes do que é "um dia completo de alimentação".
    const refeicoesObrigatorias = typeof RefeicaoLivre !== 'undefined'
      ? RefeicaoLivre.getConfig().refeicoesObrigatorias
      : ['Café da manhã', 'Almoço', 'Jantar'];

    function checar(date) {
      if (typeof RefeicaoLivre !== 'undefined' && RefeicaoLivre.protegida(date)) {
        return { exercicioOk: true, caloriasOk: true, aguaOk: true, ok: true, protegida: true };
      }
      const exercicioOk = treinoDatas.has(date) || corridaDatas.has(date);
      const kcalDia = kcalPorData[date] || 0;
      const refeicoesDoDia = refeicoesPorData[date] || new Set();
      const refeicoesOk = refeicoesObrigatorias.every(r => refeicoesDoDia.has(r));
      const caloriasOk = !!meta && kcalDia > 0 && kcalDia <= meta.kcal && refeicoesOk;
      const aguaDia = aguaPorData[date] || 0;
      const aguaOk = !!aguaMeta && aguaDia >= aguaMeta;
      return { exercicioOk, caloriasOk, aguaOk, ok: exercicioOk && caloriasOk && aguaOk };
    }

    let streak = 0;
    for (let i = 1; i <= 365; i++) {
      if (checar(Util.daysAgo(i)).ok) streak++; else break;
    }
    return { streak, hoje: checar(Util.todayISO()), checar };
  }

  // Calendário semanal colorido pela regra de "dias em foco":
  // verde = bateu os 3, amarelo = bateu 1 ou 2, cinza = nada; dias futuros ficam apagados.
  function calendarioHtml(checar, state) {
    const DOW = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
    if (!calWeekStart) calWeekStart = Util.addDaysISO(state.date, -Util.weekdayOf(state.date));
    const hojeISO = Util.todayISO();
    const fmtCurto = iso => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
    const fimSemana = Util.addDaysISO(calWeekStart, 6);

    let celulas = '';
    for (let i = 0; i < 7; i++) {
      const dateISO = Util.addDaysISO(calWeekStart, i);
      const d = Number(dateISO.slice(8, 10));
      let classe = 'cal-empty';
      if (dateISO > hojeISO) {
        classe = 'cal-future';
      } else {
        const c = checar(dateISO);
        const score = (c.exercicioOk ? 1 : 0) + (c.caloriasOk ? 1 : 0) + (c.aguaOk ? 1 : 0);
        classe = score === 3 ? 'cal-green' : (score >= 1 ? 'cal-yellow' : 'cal-empty');
      }
      const hoje = dateISO === hojeISO ? ' cal-today' : '';
      const sel = dateISO === state.date ? ' cal-sel' : '';
      celulas += `<button class="cal-cell cal-day ${classe}${hoje}${sel}" data-cal-day="${dateISO}">${d}</button>`;
    }

    return `
      <div class="card dashboard-section">
        <div class="cal-head">
          <button class="cal-nav" data-cal-prev aria-label="Semana anterior">‹</button>
          <h2 style="margin:0">${fmtCurto(calWeekStart)} – ${fmtCurto(fimSemana)}</h2>
          <button class="cal-nav" data-cal-next aria-label="Próxima semana">›</button>
        </div>
        <div class="cal-grid cal-dow">${DOW.map(w => `<div class="cal-cell cal-wd">${w}</div>`).join('')}</div>
        <div class="cal-grid">${celulas}</div>
        <div class="cal-legend">
          <span><i class="cal-dot cal-green"></i> Foco total</span>
          <span><i class="cal-dot cal-yellow"></i> Parcial</span>
          <span><i class="cal-dot cal-empty"></i> Sem registro</span>
        </div>
      </div>
    `;
  }

  const DOW_CURTO = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  // Card "Refeição livre": progresso da semana (seg-sex) durante a semana, e no
  // sábado/domingo, se elegível, o botão pra usar (até 2x) — protegendo a ofensiva.
  function refeicaoLivreHtml(dateISO, meta, aguaMeta) {
    if (typeof RefeicaoLivre === 'undefined') return '';
    const el = RefeicaoLivre.elegibilidade(dateISO, meta, aguaMeta);
    const usadaHoje = RefeicaoLivre.protegida(dateISO);

    const diasBatidos = el.detalheDias.filter(d => d.ok).length;
    let badge = '';
    let corpo;
    if (el.ehFimDeSemana) {
      if (usadaHoje) {
        badge = '<span class="livre-status">usada hoje</span>';
        corpo = `<p class="meta">🎉 Refeição livre usada hoje — esse dia conta como "em foco" na sua ofensiva de qualquer jeito.</p>`;
      } else if (el.podeUsarHoje) {
        badge = '<span class="livre-status">disponível</span>';
        corpo = `
          <img class="marco-illus" src="imagens/ilustracoes/marco-desbloqueado.png" alt="">
          <p style="text-align:center">Semana batida! Você tem <strong>${el.restantes}</strong> refeição${el.restantes === 1 ? '' : 'ões'} livre${el.restantes === 1 ? '' : 's'} disponível${el.restantes === 1 ? '' : 'eis'} esse fim de semana, sem quebrar sua ofensiva.</p>
          <button class="secondary" id="usar-refeicao-livre" style="width:100%">🍔 Usar refeição livre hoje</button>
        `;
      } else if (el.elegivel && el.usosNaSemana >= 2) {
        badge = '<span class="livre-status">usadas</span>';
        corpo = `<p class="meta">Você já usou as 2 refeições livres dessa semana. Volta semana que vem! 💪</p>`;
      } else {
        badge = `<span class="livre-status">${diasBatidos}/5 dias</span>`;
        corpo = `<p class="meta">Essa semana não desbloqueou refeição livre — veja o que faltou abaixo.</p>`;
      }
    } else {
      badge = `<span class="livre-status">${diasBatidos}/5 dias</span>`;
      corpo = `<p class="meta">De segunda a sexta: calorias no máximo 5% acima da meta (pode ficar abaixo à vontade), café/almoço/janta registrados e treino ou corrida — bata isso pra liberar até 2 refeições livres no sábado/domingo, sem quebrar sua ofensiva.</p>`;
    }

    const chipsDias = el.detalheDias.map(d => {
      const dow = DOW_CURTO[Util.weekdayOf(d.date)].slice(0, 3);
      const classe = d.futuro ? '' : d.ok ? 'done' : '';
      const hoje = d.date === dateISO ? ' today' : '';
      return `<div class="livre-day-chip ${classe}${hoje}">${dow}</div>`;
    }).join('');
    const linhaAgua = `<p class="meta" style="margin-top:8px">💧 Água: ${el.diasAguaOk}/${el.diasAguaContados} dias (precisa ${el.diasAguaNecessarios})</p>`;

    return `
      <div class="card dashboard-section livre-card">
        <h2>🍔 Refeição livre ${badge}</h2>
        ${corpo}
        <details style="margin-top:8px"><summary class="meta" style="cursor:pointer">Ver regra da semana</summary>
          <div class="livre-progress-row">${chipsDias}</div>
          ${linhaAgua}
        </details>
      </div>
    `;
  }

  function render($app, state, api) {
    const perfil = Storage.getPerfil();
    const meta = calcularMetas(perfil);
    const comidas = Storage.getByDate('alimentacao', state.date);
    const kcalConsumido = comidas.reduce((s, e) => s + (e.kcal || 0), 0);
    const macrosHoje = comidas.reduce((t, e) => {
      t.carbs += e.carbs || 0; t.protein += e.protein || 0; t.fat += e.fat || 0; t.fiber += e.fiber || 0;
      return t;
    }, { carbs: 0, protein: 0, fat: 0, fiber: 0 });
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

    // Composição corporal: peso + massa magra (manual ou calculada) + % gordura, com barras
    // posicionadas em faixas de referência saudáveis estimadas por altura/sexo do perfil.
    const composicaoAtual = Util.metricasComposicao(pesoAtual);
    const pesoVal = composicaoAtual ? composicaoAtual.peso : null;
    const bodyFatVal = composicaoAtual ? composicaoAtual.bodyFat : null;
    const leanMassVal = composicaoAtual ? composicaoAtual.massaMagra : null;

    const faixaPeso = Util.faixaPesoSaudavel(perfil.altura);
    let pesoPct = null;
    if (pesoVal != null && faixaPeso) {
      const trackMin = faixaPeso.min * 0.75;
      const trackMax = faixaPeso.max * 1.35;
      pesoPct = ((pesoVal - trackMin) / (trackMax - trackMin)) * 100;
    }
    const magraPct = leanMassVal != null && pesoVal ? (leanMassVal / pesoVal) * 100 : null;
    const faixaGordura = Util.faixaGorduraSaudavel(perfil.sexo);
    const gorduraPct = bodyFatVal != null ? (bodyFatVal / (faixaGordura.max * 1.7)) * 100 : null;

    $app.innerHTML = `
      <div class="card dashboard-section">
        <h2>Calorias hoje</h2>
        ${meta ? `
          <div class="calorie-hero">
            ${ringHtml((kcalConsumido / meta.kcal) * 100, '--accent', 108, `<span class="n">${kcalConsumido.toFixed(0)}</span><span class="u">de ${meta.kcal} kcal</span>`)}
            <div class="calorie-hero-info">
              <p class="headline">${meta.kcal - kcalConsumido >= 0 ? `${(meta.kcal - kcalConsumido).toFixed(0)} kcal restantes` : `${(kcalConsumido - meta.kcal).toFixed(0)} kcal excedidas`}</p>
              <p class="sub">${Math.round((kcalConsumido / meta.kcal) * 100)}% da meta de hoje</p>
            </div>
          </div>
          <div class="macro-ring-grid">
            ${macroRingHtml('Carbo', '--macro-carb', macrosHoje.carbs, meta.carb)}
            ${macroRingHtml('Prot', '--macro-protein', macrosHoje.protein, meta.protein)}
            ${macroRingHtml('Gord', '--macro-fat', macrosHoje.fat, meta.fat)}
            ${meta.fiber ? macroRingHtml('Fibra', '--macro-fiber', macrosHoje.fiber, meta.fiber) : ''}
          </div>
          <label style="margin-top:14px">🔥 Calorias extras gastas hoje ${gastoExistente && gastoExistente.source === 'auto' ? '(estimado a partir do treino/corrida)' : gastoExistente && gastoExistente.source === 'manual' ? '(ajustado manualmente)' : '(manual)'}</label>
          <input type="number" id="gasto-extra-input" placeholder="Ex: 300" value="${gastoExtra || ''}">
          <p class="meta" style="font-size:0.72rem">Só informativo — não altera sua meta de calorias. Preenche sozinho quando você registra treino (com duração) ou corrida; edite se quiser ajustar.</p>
        ` : `<p class="empty">Complete seu perfil para ver sua meta de calorias.</p><button class="secondary" id="ir-perfil-calorias" style="margin-top:6px">Completar perfil →</button>`}
      </div>

      ${aguaMeta ? `
        <div class="card dashboard-section">
          <div class="stat-row">
            <div class="stat-icon">💧</div>
            <div class="stat-row-info">
              <div class="stat-row-label">Água</div>
              <div class="stat-row-value">${aguaConsumida.toFixed(0)}<span class="stat-row-unit"> / ${aguaMeta.toFixed(0)}ml</span></div>
            </div>
            <div class="stat-row-pct">${Math.min(100, Math.round((aguaConsumida / aguaMeta) * 100))}%</div>
          </div>
          <div class="stat-bar"><div class="stat-bar-fill" style="width:${Math.min(100, (aguaConsumida / aguaMeta) * 100)}%"></div></div>
        </div>
      ` : ''}

      <div class="card dashboard-section">
        <h2>Composição corporal</h2>
        ${pesoAtual ? `
          ${compRowHtml(ICON_PESO, pesoVal, 'kg', 1, pesoPct, '', 'Peso não registrado')}
          ${compRowHtml(ICON_MASSA_MAGRA, leanMassVal, 'kg', 1, magraPct, 'good', 'Massa magra não registrada')}
          ${compRowHtml(ICON_GORDURA, bodyFatVal, '%', 1, gorduraPct, 'water', '% Gordura não registrada')}
          <p class="meta" style="margin-top:8px">${variacao != null ? `${variacao > 0 ? '+' : ''}${variacao.toFixed(1)}kg desde a última medição — ` : ''}medido em ${Util.fmtDate(pesoAtual.date)}</p>
          <p class="meta" style="font-size:0.68rem;margin-top:2px">Barras usam faixas de referência estimadas por altura/sexo (IMC saudável, % gordura de referência) — não substitui avaliação profissional.</p>
        ` : `<div class="empty"><img class="empty-illus" src="imagens/ilustracoes/medidas-vazio.png" alt="">Nenhuma medição registrada ainda</div><button class="secondary" id="ir-medidas-composicao" style="margin-top:6px">Registrar peso →</button>`}
      </div>

      <div class="card dashboard-section">
        <h2>🔥 Dias em foco</h2>
        <div style="text-align:center;padding:4px 0 10px">
          <div style="font-size:2.4rem;font-weight:700;color:var(--accent);line-height:1">${diasFoco.streak}</div>
          <div class="meta">dia${diasFoco.streak === 1 ? '' : 's'} seguido${diasFoco.streak === 1 ? '' : 's'} em foco</div>
        </div>
        <p class="meta">Hoje, pra manter o foco:</p>
        <div class="today-status-row">
          <span class="today-status-chip ${diasFoco.hoje.exercicioOk ? 'on' : ''}">${diasFoco.hoje.exercicioOk ? '✓ ' : ''}Treino</span>
          <span class="today-status-chip ${diasFoco.hoje.caloriasOk ? 'on' : ''}">${diasFoco.hoje.caloriasOk ? '✓ ' : ''}Calorias</span>
          <span class="today-status-chip ${diasFoco.hoje.aguaOk ? 'on' : ''}">${diasFoco.hoje.aguaOk ? '✓ ' : ''}Água</span>
        </div>
      </div>

      ${calendarioHtml(diasFoco.checar, state)}

      ${refeicaoLivreHtml(state.date, meta, aguaMeta)}

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
          <p class="meta" style="font-size:0.7rem;text-align:center">${tendencia.janelaRecente ? `Baseado nos últimos ${tendencia.dias} dias.` : 'Poucas pesagens recentes — usando todo o histórico.'} Estimativa geral (~7700kcal ≈ 1kg), não substitui acompanhamento profissional.</p>
        ` : `<p class="empty">Registre pelo menos 2 medições de peso (em dias diferentes) para ver sua tendência.</p><button class="secondary" id="ir-medidas-tendencia" style="margin-top:6px">Registrar peso →</button>`}
        ${projecao && projecao.horizontes.length > 0 ? `
          <h3 style="margin-top:16px;font-size:0.9rem">Projeção futura ${projecao.baseadoEm === 'real' ? '(ao vivo, pelo seu progresso)' : '(estimativa)'}</h3>
          <div class="row" style="flex-wrap:wrap">
            ${projecao.horizontes.map(h => `
              <div class="card" style="margin:4px 0;padding:10px;text-align:center;flex:1 1 40%">
                <div class="lbl" style="font-size:0.72rem;color:var(--text-muted)">${Util.fmtDate(h.data)} (${h.semanas}sem)</div>
                <strong>${h.peso}kg</strong>
              </div>
            `).join('')}
          </div>
          <p class="meta" style="font-size:0.7rem;text-align:center">
            ${projecao.kgPorSemana < 0 ? 'Perdendo' : 'Ganhando'} ~${Math.abs(projecao.kgPorSemana)}kg/semana
            ${projecao.baseadoEm === 'real'
              ? 'com base no seu progresso real recente — atualiza sozinha conforme você registra peso.'
              : `com base na meta de calorias selecionada (${meta.kcal}kcal) vs. seu gasto (TDEE ${meta.tdee}kcal), já considerando que o TDEE cai um pouco conforme o peso muda (adaptação metabólica). Registre pelo menos 2 pesagens recentes pra essa projeção virar "ao vivo".`}
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
        <p>${treinoHoje ? (treinoHoje.exercises && treinoHoje.exercises.length ? `✅ Musculação registrada (${treinoHoje.exercises.length} exercícios)` : '✅ Musculação registrada (treino rápido)') : '⬜ Nenhuma musculação registrada hoje'}</p>
        <p>${corridasHoje.length > 0 ? `✅ ${corridasHoje.length} corrida(s) registrada(s)` : '⬜ Nenhuma corrida registrada hoje'}</p>
      </div>

      ${typeof CHANGELOG !== 'undefined' && CHANGELOG.length > 0 && (typeof Cloud === 'undefined' || !Cloud.isEnabled() || (typeof Cloud.isSuperAdmin === 'function' && Cloud.isSuperAdmin())) ? `
        <div class="card dashboard-section" style="padding:10px 14px">
          <p class="meta" style="font-size:0.7rem;font-weight:600;margin-bottom:4px">🆕 Últimas atualizações</p>
          ${CHANGELOG.slice(0, 4).map(c => `
            <p class="meta" style="font-size:0.68rem;margin:2px 0">${Util.fmtDate(c.date)} — ${Util.escapeHtml(c.texto)}</p>
          `).join('')}
        </div>
      ` : ''}
    `;

    const irPerfilCalorias = document.getElementById('ir-perfil-calorias');
    if (irPerfilCalorias) {
      irPerfilCalorias.addEventListener('click', () => {
        api.goToSub('perfil');
        setTimeout(() => {
          const faltando = !perfil.peso ? 'p-peso' : !perfil.altura ? 'p-altura' : !perfil.idade ? 'p-idade' : 'p-sexo';
          const el = document.getElementById(faltando);
          if (el) el.focus();
        }, 260);
      });
    }
    ['ir-medidas-composicao', 'ir-medidas-tendencia'].forEach(id => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.addEventListener('click', () => {
          api.goTo('medidas');
          setTimeout(() => { const el = document.getElementById('f-weight'); if (el) el.focus(); }, 260);
        });
      }
    });

    const usarRefeicaoLivreBtn = document.getElementById('usar-refeicao-livre');
    if (usarRefeicaoLivreBtn) {
      usarRefeicaoLivreBtn.addEventListener('click', () => {
        RefeicaoLivre.usar(state.date);
        api.render();
      });
    }

    $app.querySelectorAll('[data-toggle]').forEach(btn => {
      btn.addEventListener('click', () => {
        const all = Storage.getAll('tarefas_conclusoes');
        all.push({ id: Storage.uid(), taskId: btn.dataset.toggle, date: state.date });
        Storage.saveAll('tarefas_conclusoes', all);
        api.render();
      });
    });

    // Calendário de foco: navegar semanas e selecionar um dia
    function shiftWeek(delta) {
      calWeekStart = Util.addDaysISO(calWeekStart || Util.addDaysISO(state.date, -Util.weekdayOf(state.date)), delta * 7);
      api.render();
    }
    const prevBtn = $app.querySelector('[data-cal-prev]');
    const nextBtn = $app.querySelector('[data-cal-next]');
    if (prevBtn) prevBtn.addEventListener('click', () => shiftWeek(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => shiftWeek(1));
    $app.querySelectorAll('[data-cal-day]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.date = btn.dataset.calDay;
        calWeekStart = Util.addDaysISO(state.date, -Util.weekdayOf(state.date));
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
