const ViewMais = (() => {
  const MENU = [
    { key: 'tarefas', icon: '📋', label: 'Tarefas' },
    { key: 'fotos', icon: '📸', label: 'Fotos' },
    { key: 'historico', icon: '📊', label: 'Histórico' },
    { key: 'perfil', icon: '👤', label: 'Meu Perfil' },
    { key: 'biblioteca-alimentos', icon: '🍎', label: 'Biblioteca de Alimentos' },
    { key: 'biblioteca-exercicios', icon: '🏋️', label: 'Biblioteca de Exercícios' },
    { key: 'planos-treino', icon: '🔄', label: 'Planos de Treino' },
    { key: 'combos', icon: '🥗', label: 'Combos de Refeição' },
    { key: 'backup', icon: '💾', label: 'Backup' },
  ];

  function render($app, state, api) {
    switch (state.maisView) {
      case 'tarefas': return ViewTarefas.render($app, state, api);
      case 'fotos': return ViewFotos.render($app, state, api);
      case 'historico': return ViewHistorico.render($app, state, api);
      case 'perfil': return renderPerfil($app, state, api);
      case 'biblioteca-alimentos': return renderBibliotecaAlimentos($app, state, api);
      case 'biblioteca-exercicios': return renderBibliotecaExercicios($app, state, api);
      case 'planos-treino': return renderPlanosTreino($app, state, api);
      case 'combos': return renderCombos($app, state, api);
      case 'backup': return renderBackup($app, state, api);
      default: return renderMenu($app, state, api);
    }
  }

  function renderMenu($app, state, api) {
    $app.innerHTML = `
      <div class="card" style="padding:4px 16px">
        <div class="menu-list">
          ${MENU.map(m => `
            <button class="menu-item" data-go="${m.key}">
              <span class="icon">${m.icon}</span> ${m.label} <span class="chev">›</span>
            </button>
          `).join('')}
        </div>
      </div>
    `;
    $app.querySelectorAll('[data-go]').forEach(btn => {
      btn.addEventListener('click', () => api.goToMais(btn.dataset.go));
    });
  }

  // ---------------- PERFIL ----------------
  function renderPerfil($app, state, api) {
    const perfil = Storage.getPerfil();
    const pesoAtual = Util.getPesoAtual();

    $app.innerHTML = `
      <div class="card">
        <h2>Seus dados</h2>
        <div class="row">
          ${Util.inputGroup({ id: 'p-peso', label: 'Peso (kg)', type: 'number', step: '0.1', value: perfil.peso ?? pesoAtual ?? '' })}
          ${Util.inputGroup({ id: 'p-altura', label: 'Altura (cm)', type: 'number', value: perfil.altura ?? '' })}
        </div>
        <div class="row">
          ${Util.inputGroup({ id: 'p-idade', label: 'Idade', type: 'number', value: perfil.idade ?? '' })}
          <div>
            <label>Sexo</label>
            <select id="p-sexo">
              <option value="masculino" ${perfil.sexo === 'masculino' ? 'selected' : ''}>Masculino</option>
              <option value="feminino" ${perfil.sexo === 'feminino' ? 'selected' : ''}>Feminino</option>
            </select>
          </div>
        </div>
        <label>Nível de atividade</label>
        <select id="p-atividade">
          ${NIVEIS_ATIVIDADE.map(n => `<option value="${n.id}" ${perfil.nivelAtividade === n.id ? 'selected' : ''}>${n.label}</option>`).join('')}
        </select>
        <label>Objetivo</label>
        <select id="p-dieta">
          ${DIETA_TEMPLATES.map(d => `<option value="${d.id}" ${perfil.dietaTemplate === d.id ? 'selected' : ''}>${d.nome}</option>`).join('')}
          <option value="custom" ${perfil.metaCustom ? 'selected' : ''}>Personalizado (definir eu mesmo)</option>
        </select>
        <div id="template-fields">
          <label>Estilo de macros</label>
          <select id="p-macro-style">
            ${MACRO_STYLES.map(m => `<option value="${m.id}" ${perfil.macroStyle === m.id ? 'selected' : ''}>${m.nome}</option>`).join('')}
          </select>
          <p class="meta" id="macro-style-desc" style="color:var(--text-muted);font-size:0.78rem"></p>
          <label>Estratégia alimentar</label>
          <select id="p-meal-strategy">
            ${MEAL_STRATEGIES.map(m => `<option value="${m.id}" ${perfil.mealStrategy === m.id ? 'selected' : ''}>${m.nome}</option>`).join('')}
          </select>
          <p class="meta" id="meal-strategy-desc" style="color:var(--text-muted);font-size:0.78rem"></p>
        </div>
        <div id="custom-fields" style="display:none">
          <div class="row">
            <div><label>Meta de calorias (kcal)</label><input type="number" id="p-kcal" value="${perfil.metaCustom?.kcal ?? ''}"></div>
            <div><label>Proteína (g)</label><input type="number" id="p-protein" value="${perfil.metaCustom?.protein ?? ''}"></div>
          </div>
          <div class="row">
            <div><label>Carboidrato (g)</label><input type="number" id="p-carb" value="${perfil.metaCustom?.carb ?? ''}"></div>
            <div><label>Gordura (g)</label><input type="number" id="p-fat" value="${perfil.metaCustom?.fat ?? ''}"></div>
          </div>
          <label>Fibras (g) — opcional</label>
          <input type="number" id="p-fiber" value="${perfil.metaCustom?.fiber ?? ''}">
        </div>
        <label>Em quantas refeições você quer dividir o dia</label>
        <input type="number" id="p-num-refeicoes" min="1" max="12" value="${perfil.numRefeicoes ?? 5}">
        <label>Meta de água (ml) — deixe em branco para calcular automaticamente (35ml × seu peso)</label>
        <input type="number" id="p-agua-meta" placeholder="${Math.round((perfil.peso || pesoAtual || 70) * 35)}" value="${perfil.aguaMetaCustom ?? ''}">
        <button class="primary" id="save-perfil">Salvar perfil</button>
      </div>
      <div class="card" id="preview-card"></div>
    `;

    const dietaSelect = document.getElementById('p-dieta');
    const customFields = document.getElementById('custom-fields');
    const templateFields = document.getElementById('template-fields');

    function currentFormPerfil() {
      const dietaVal = dietaSelect.value;
      const p = {
        peso: Number(document.getElementById('p-peso').value) || null,
        altura: Number(document.getElementById('p-altura').value) || null,
        idade: Number(document.getElementById('p-idade').value) || null,
        sexo: document.getElementById('p-sexo').value,
        nivelAtividade: document.getElementById('p-atividade').value,
        dietaTemplate: dietaVal === 'custom' ? null : dietaVal,
        macroStyle: document.getElementById('p-macro-style').value,
        mealStrategy: document.getElementById('p-meal-strategy').value,
        numRefeicoes: Math.max(1, Number(document.getElementById('p-num-refeicoes').value) || 5),
        aguaMetaCustom: Number(document.getElementById('p-agua-meta').value) || null,
      };
      if (dietaVal === 'custom') {
        p.metaCustom = {
          kcal: Number(document.getElementById('p-kcal').value) || null,
          protein: Number(document.getElementById('p-protein').value) || null,
          carb: Number(document.getElementById('p-carb').value) || null,
          fat: Number(document.getElementById('p-fat').value) || null,
          fiber: Number(document.getElementById('p-fiber').value) || null,
        };
      }
      return p;
    }

    function updatePreview() {
      const isCustom = dietaSelect.value === 'custom';
      customFields.style.display = isCustom ? '' : 'none';
      templateFields.style.display = isCustom ? 'none' : '';

      const macroStyle = MACRO_STYLES.find(m => m.id === document.getElementById('p-macro-style').value);
      document.getElementById('macro-style-desc').textContent = macroStyle ? macroStyle.descricao : '';
      const mealStrategy = MEAL_STRATEGIES.find(m => m.id === document.getElementById('p-meal-strategy').value);
      document.getElementById('meal-strategy-desc').textContent = mealStrategy ? mealStrategy.dica : '';

      const formPerfil = currentFormPerfil();
      const meta = calcularMetas(formPerfil);
      const preview = document.getElementById('preview-card');
      if (!meta) {
        const aguaSemMeta = calcularMetaAgua(formPerfil);
        preview.innerHTML = `
          <p class="empty">Preencha peso, altura, idade e sexo para calcular sua meta de calorias.</p>
          ${aguaSemMeta ? `<p class="meta" style="text-align:center">Meta de água: ${aguaSemMeta}ml/dia</p>` : ''}
        `;
        return;
      }
      const numRefeicoes = Math.max(1, Number(document.getElementById('p-num-refeicoes').value) || 5);
      preview.innerHTML = `
        <h2>Sua meta calculada</h2>
        <div class="kcal-summary">
          <div><div class="num">${meta.bmr ?? '—'}</div><div class="lbl">BMR</div></div>
          <div><div class="num">${meta.tdee ?? '—'}</div><div class="lbl">TDEE</div></div>
          <div><div class="num">${meta.kcal}</div><div class="lbl">Meta kcal</div></div>
        </div>
        <p class="meta" style="text-align:center">Proteína ${meta.protein}g · Carboidrato ${meta.carb}g · Gordura ${meta.fat}g${meta.fiber ? ` · Fibras ${meta.fiber}g` : ''}</p>
        ${meta.tdee == null ? `<p class="meta" style="text-align:center;color:var(--text-muted);font-size:0.78rem">Preencha altura, idade, sexo e nível de atividade para calcular seu gasto (TDEE) e ver o déficit/superávit real.</p>` : ''}
        <p class="meta" style="text-align:center;margin-top:10px">Por refeição (÷${numRefeicoes}): ${Math.round(meta.kcal / numRefeicoes)} kcal · P ${Math.round(meta.protein / numRefeicoes)}g · C ${Math.round(meta.carb / numRefeicoes)}g · G ${Math.round(meta.fat / numRefeicoes)}g</p>
        <p class="meta" style="text-align:center">Meta de água: ${calcularMetaAgua(formPerfil) ?? '—'}ml/dia</p>
      `;
    }

    $app.querySelectorAll('#p-peso, #p-altura, #p-idade, #p-sexo, #p-atividade, #p-dieta, #p-macro-style, #p-meal-strategy, #p-num-refeicoes, #p-agua-meta, #p-kcal, #p-protein, #p-carb, #p-fat, #p-fiber').forEach(el => {
      el.addEventListener('input', updatePreview);
      el.addEventListener('change', updatePreview);
    });
    updatePreview();

    document.getElementById('save-perfil').addEventListener('click', () => {
      Storage.savePerfil(currentFormPerfil());
      alert('Perfil salvo!');
      api.render();
    });
  }

  // ---------------- BIBLIOTECA DE ALIMENTOS ----------------
  function renderBibliotecaAlimentos($app, state, api) {
    const lib = Storage.getAll('alimentos_biblioteca').sort((a, b) => a.name.localeCompare(b.name));
    $app.innerHTML = `
      <div class="card">
        <h2>Adicionar alimento</h2>
        <label>Nome</label>
        <input type="text" id="f-name" placeholder="Ex: Arroz branco cozido">
        <div class="row">
          <div><label>Porção (rótulo)</label><input type="text" id="f-portionLabel" placeholder="100g"></div>
          <div><label>Porção (gramas)</label><input type="number" id="f-portionGrams" placeholder="100"></div>
        </div>
        <label>Tabela nutricional (valores por porção acima)</label>
        <div class="nutri-grid">
          ${nutriInput('kcal', 'Calorias (kcal)')}
          ${nutriInput('protein', 'Proteína (g)')}
          ${nutriInput('carbs', 'Carboidratos (g)')}
          ${nutriInput('sugars', 'Açúcares (g)')}
          ${nutriInput('fat', 'Gorduras totais (g)')}
          ${nutriInput('satFat', 'Gorduras saturadas (g)')}
          ${nutriInput('transFat', 'Gorduras trans (g)')}
          ${nutriInput('fiber', 'Fibra alimentar (g)')}
          ${nutriInput('sodium', 'Sódio (mg)')}
        </div>
        <button class="primary" id="add-food">Adicionar à biblioteca</button>
      </div>
      <div class="card">
        <h2>Alimentos cadastrados (${lib.length})</h2>
        <input type="text" id="food-filter" placeholder="Buscar..." style="margin-bottom:10px">
        <div id="food-lib-list">${libListHtml(lib)}</div>
      </div>
    `;

    document.getElementById('food-filter').addEventListener('input', e => {
      const q = e.target.value.trim().toLowerCase();
      document.getElementById('food-lib-list').innerHTML = libListHtml(lib.filter(f => f.name.toLowerCase().includes(q)));
      attachDelete();
    });

    function attachDelete() {
      $app.querySelectorAll('[data-del-food]').forEach(btn => {
        btn.addEventListener('click', () => {
          Storage.remove('alimentos_biblioteca', btn.dataset.delFood);
          api.render();
        });
      });
    }
    attachDelete();

    document.getElementById('add-food').addEventListener('click', () => {
      const name = document.getElementById('f-name').value.trim();
      const portionLabel = document.getElementById('f-portionLabel').value.trim() || '100g';
      const portionGrams = Number(document.getElementById('f-portionGrams').value) || 100;
      if (!name) return;
      const entry = { name, portionLabel, portionGrams, custom: true };
      ['kcal', 'protein', 'carbs', 'sugars', 'fat', 'satFat', 'transFat', 'fiber', 'sodium'].forEach(k => {
        entry[k] = Number(document.getElementById(`f-${k}`).value) || 0;
      });
      Storage.add('alimentos_biblioteca', entry);
      api.render();
    });
  }

  function nutriInput(key, label) {
    return `<div><label>${label}</label><input type="number" step="0.1" id="f-${key}"></div>`;
  }

  function libListHtml(list) {
    if (list.length === 0) return '<div class="empty">Nenhum alimento encontrado</div>';
    return list.map(f => `
      <div class="list-item" data-id="${f.id}">
        <div>
          <strong>${Util.escapeHtml(f.name)}</strong>
          <div class="meta">${f.kcal} kcal / ${f.portionLabel} · P ${f.protein}g C ${f.carbs}g G ${f.fat}g</div>
        </div>
        <button class="link" data-del-food="${f.id}">✕</button>
      </div>
    `).join('');
  }

  // ---------------- BIBLIOTECA DE EXERCÍCIOS ----------------
  function renderBibliotecaExercicios($app, state, api) {
    const lib = Storage.getAll('exercicios_biblioteca').sort((a, b) => a.grupo.localeCompare(b.grupo) || a.name.localeCompare(b.name));
    $app.innerHTML = `
      <div class="card">
        <h2>Adicionar exercício</h2>
        <label>Nome</label>
        <input type="text" id="e-name" placeholder="Ex: Supino reto com barra">
        <div class="row">
          <div>
            <label>Grupo muscular</label>
            <select id="e-grupo">${GRUPOS_MUSCULARES.map(g => `<option value="${g}">${g}</option>`).join('')}</select>
          </div>
          <div><label>Equipamento</label><input type="text" id="e-equipamento" placeholder="Ex: Barra"></div>
        </div>
        <label>Link do vídeo (opcional)</label>
        <input type="text" id="e-video" placeholder="Cole aqui um link do YouTube ou outro site">
        <button class="primary" id="add-exercicio">Adicionar à biblioteca</button>
      </div>
      <div class="card">
        <h2>Exercícios cadastrados (${lib.length})</h2>
        <div class="chip-group" id="grupo-filter">
          <button class="chip active" data-grupo="todos">Todos</button>
          ${GRUPOS_MUSCULARES.map(g => `<button class="chip" data-grupo="${g}">${g}</button>`).join('')}
        </div>
        <div id="exercicio-lib-list">${exercicioListHtml(lib)}</div>
      </div>
    `;

    function attachDelete() {
      $app.querySelectorAll('[data-del-ex]').forEach(btn => {
        btn.addEventListener('click', () => {
          Storage.remove('exercicios_biblioteca', btn.dataset.delEx);
          api.render();
        });
      });
    }
    attachDelete();

    $app.querySelectorAll('#grupo-filter .chip').forEach(chip => {
      chip.addEventListener('click', () => {
        $app.querySelectorAll('#grupo-filter .chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const grupo = chip.dataset.grupo;
        const filtered = grupo === 'todos' ? lib : lib.filter(e => e.grupo === grupo);
        document.getElementById('exercicio-lib-list').innerHTML = exercicioListHtml(filtered);
        attachDelete();
        attachEditLink();
      });
    });

    document.getElementById('add-exercicio').addEventListener('click', () => {
      const name = document.getElementById('e-name').value.trim();
      const grupo = document.getElementById('e-grupo').value;
      const equipamento = document.getElementById('e-equipamento').value.trim();
      const videoUrl = document.getElementById('e-video').value.trim();
      if (!name) return;
      Storage.add('exercicios_biblioteca', { name, grupo, equipamento, videoUrl, custom: true });
      api.render();
    });

    function attachEditLink() {
      $app.querySelectorAll('[data-edit-link]').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.editLink;
          const atual = lib.find(e => e.id === id);
          const novoLink = prompt('Cole o link do vídeo (deixe em branco para voltar a usar a busca automática do YouTube):', atual?.videoUrl || '');
          if (novoLink === null) return;
          Storage.update('exercicios_biblioteca', id, { videoUrl: novoLink.trim() });
          api.render();
        });
      });
    }
    attachEditLink();
  }

  function exercicioListHtml(list) {
    if (list.length === 0) return '<div class="empty">Nenhum exercício encontrado</div>';
    return list.map(e => `
      <div class="list-item" data-id="${e.id}">
        <div>
          <strong>${Util.escapeHtml(e.name)}</strong>
          <div class="meta">${Util.escapeHtml(e.grupo)} ${e.equipamento ? '· ' + Util.escapeHtml(e.equipamento) : ''}</div>
          <a href="${e.videoUrl || Util.youtubeSearchUrl(e.name)}" target="_blank" rel="noopener" class="meta" style="color:var(--accent)">▶ Ver vídeo${e.videoUrl ? '' : ' (busca automática)'}</a>
          · <button class="link" data-edit-link="${e.id}" style="color:var(--text-muted)">${e.videoUrl ? 'editar link' : 'definir link'}</button>
        </div>
        <button class="link" data-del-ex="${e.id}">✕</button>
      </div>
    `).join('');
  }

  // ---------------- PLANOS DE TREINO ----------------
  function renderPlanosTreino($app, state, api) {
    const planos = Storage.getAll('treino_planos').sort((a, b) => a.ordem - b.ordem);
    const biblioteca = Storage.getAll('exercicios_biblioteca');
    const perfil = Storage.getPerfil();
    const objetivoAtual = perfil.dietaTemplate || 'manutencao';

    $app.innerHTML = `
      <datalist id="exercicios-datalist-planos">
        ${biblioteca.map(e => `<option value="${Util.escapeHtml(e.name)}">`).join('')}
      </datalist>
      <div class="card">
        <p class="meta">Monte seus treinos (ex: A, B, C) e o app sugere automaticamente qual vem a seguir, em rotação, com base no último que você registrou — não importa o dia da semana.</p>
      </div>
      <div class="card">
        <h2>Treino pré-definido</h2>
        <label>Baseado em</label>
        <select id="pack-select">
          ${Object.keys(TREINOS_PREDEFINIDOS).map(id => {
            const nomeObjetivo = (DIETA_TEMPLATES.find(d => d.id === id) || {}).nome || id;
            return `<option value="${id}" ${id === objetivoAtual ? 'selected' : ''}>${nomeObjetivo} — ${TREINOS_PREDEFINIDOS[id].label}</option>`;
          }).join('')}
        </select>
        <p class="meta" id="pack-desc" style="color:var(--text-muted);font-size:0.78rem"></p>
        <button class="secondary" id="load-pack">Carregar treinos deste pacote</button>
        <p class="meta" style="font-size:0.72rem;margin-top:6px">Ponto de partida geral baseado em ciência do esporte (volume e frequência por grupo muscular). Totalmente editável depois — ajuste pesos, séries e reps ao seu nível.</p>
      </div>
      <div id="planos-list"></div>
      <button class="secondary" id="add-plano" style="margin:0 16px 16px">+ Novo plano de treino</button>
    `;

    const list = document.getElementById('planos-list');
    planos.forEach(plano => list.appendChild(renderPlanoCard(plano, planos, api)));

    const packSelect = document.getElementById('pack-select');
    const updatePackDesc = () => {
      document.getElementById('pack-desc').textContent = TREINOS_PREDEFINIDOS[packSelect.value].descricao;
    };
    packSelect.addEventListener('change', updatePackDesc);
    updatePackDesc();

    document.getElementById('load-pack').addEventListener('click', () => {
      const pack = TREINOS_PREDEFINIDOS[packSelect.value];
      const maxOrdem = planos.reduce((m, p) => Math.max(m, p.ordem), 0);
      pack.planos.forEach((p, i) => {
        Storage.add('treino_planos', { nome: p.nome, ordem: maxOrdem + i + 1, exercises: p.exercises.map(e => ({ ...e })) });
      });
      api.render();
    });

    document.getElementById('add-plano').addEventListener('click', () => {
      const maxOrdem = planos.reduce((m, p) => Math.max(m, p.ordem), 0);
      Storage.add('treino_planos', { nome: `Treino ${String.fromCharCode(65 + planos.length)}`, ordem: maxOrdem + 1, exercises: [{ name: '', sets: '', reps: '', weight: '' }] });
      api.render();
    });
  }

  function renderPlanoCard(plano, allPlanos, api) {
    const card = document.createElement('div');
    card.className = 'card';
    let rows = (plano.exercises && plano.exercises.length ? plano.exercises : [{ name: '', sets: '', reps: '', weight: '' }]).map(e => ({ ...e }));

    function paint() {
      const idx = allPlanos.findIndex(p => p.id === plano.id);
      card.innerHTML = `
        <div class="row" style="align-items:center">
          <input type="text" id="nome-${plano.id}" value="${Util.escapeHtml(plano.nome)}" style="font-weight:600">
          <div style="display:flex;gap:4px">
            <button class="secondary" data-up>▲</button>
            <button class="secondary" data-down>▼</button>
          </div>
        </div>
        <div class="exercise-list-${plano.id}" style="margin-top:10px"></div>
        <button class="secondary" data-add-row>+ Adicionar exercício</button>
        <div class="row" style="margin-top:10px">
          <button class="primary" data-save>Salvar plano</button>
          <button class="link" data-delete style="flex:0 0 auto">Excluir</button>
        </div>
      `;
      const rowsWrap = card.querySelector(`.exercise-list-${plano.id}`);
      rowsWrap.innerHTML = rows.map((r, i) => `
        <div class="exercise-row" data-i="${i}">
          <input type="text" class="ex-name" list="exercicios-datalist-planos" placeholder="Exercício" value="${Util.escapeHtml(r.name)}">
          <input type="number" class="small ex-sets" placeholder="Séries" value="${Util.escapeHtml(r.sets)}">
          <input type="number" class="small ex-reps" placeholder="Reps" value="${Util.escapeHtml(r.reps)}">
          <input type="number" class="small ex-weight" placeholder="Kg" value="${Util.escapeHtml(r.weight)}">
          <button class="link" data-remove-row="${i}">✕</button>
        </div>
      `).join('');

      function syncRows() {
        const names = rowsWrap.querySelectorAll('.ex-name');
        const sets = rowsWrap.querySelectorAll('.ex-sets');
        const reps = rowsWrap.querySelectorAll('.ex-reps');
        const weights = rowsWrap.querySelectorAll('.ex-weight');
        rows = rows.map((r, i) => ({
          name: names[i] ? names[i].value : r.name,
          sets: sets[i] ? sets[i].value : r.sets,
          reps: reps[i] ? reps[i].value : r.reps,
          weight: weights[i] ? weights[i].value : r.weight,
        }));
      }

      rowsWrap.querySelectorAll('[data-remove-row]').forEach(btn => {
        btn.addEventListener('click', () => {
          syncRows();
          rows.splice(Number(btn.dataset.removeRow), 1);
          if (rows.length === 0) rows.push({ name: '', sets: '', reps: '', weight: '' });
          paint();
        });
      });

      card.querySelector('[data-add-row]').addEventListener('click', () => {
        syncRows();
        rows.push({ name: '', sets: '', reps: '', weight: '' });
        paint();
      });

      card.querySelector('[data-up]').addEventListener('click', () => {
        if (idx <= 0) return;
        const other = allPlanos[idx - 1];
        const tmp = plano.ordem;
        Storage.update('treino_planos', plano.id, { ordem: other.ordem });
        Storage.update('treino_planos', other.id, { ordem: tmp });
        api.render();
      });
      card.querySelector('[data-down]').addEventListener('click', () => {
        if (idx >= allPlanos.length - 1) return;
        const other = allPlanos[idx + 1];
        const tmp = plano.ordem;
        Storage.update('treino_planos', plano.id, { ordem: other.ordem });
        Storage.update('treino_planos', other.id, { ordem: tmp });
        api.render();
      });

      card.querySelector('[data-save]').addEventListener('click', () => {
        syncRows();
        const nome = document.getElementById(`nome-${plano.id}`).value.trim() || plano.nome;
        const cleaned = rows.filter(r => r.name.trim() !== '');
        Storage.update('treino_planos', plano.id, { nome, exercises: cleaned });
        api.render();
      });

      card.querySelector('[data-delete]').addEventListener('click', () => {
        if (confirm(`Excluir o plano "${plano.nome}"?`)) {
          Storage.remove('treino_planos', plano.id);
          api.render();
        }
      });
    }

    paint();
    return card;
  }

  // ---------------- COMBOS DE REFEIÇÃO ----------------
  const NUTRI_FIELDS_COMBO = ['kcal', 'protein', 'carbs', 'sugars', 'fat', 'satFat', 'transFat', 'fiber', 'sodium'];

  function renderCombos($app, state, api) {
    const combos = Storage.getAll('combos');
    let itensNovoCombo = [];

    $app.innerHTML = `
      <div class="card">
        <h2>Novo combo</h2>
        <p class="meta">Salve alimentos que você come juntos com frequência (ex: seu café da manhã de sempre) para adicionar tudo com um clique depois.</p>
        <label>Nome do combo</label>
        <input type="text" id="combo-nome" placeholder="Ex: Café da manhã de sempre">
        <label>Adicionar alimento</label>
        <div class="autocomplete-wrap">
          <input type="text" id="combo-food-search" placeholder="Buscar na biblioteca..." autocomplete="off">
          <div class="autocomplete-list" id="combo-food-results" style="display:none"></div>
        </div>
        <div id="combo-selected-food-box"></div>
        <div id="combo-itens-list" style="margin-top:12px"></div>
        <button class="primary" id="save-combo" style="margin-top:12px">Salvar combo</button>
      </div>
      <div class="card">
        <h2>Combos salvos (${combos.length})</h2>
        <div id="combos-list">${combosListHtml(combos)}</div>
      </div>
    `;

    attachComboDelete();

    const emptyCta = document.getElementById('empty-cta-combo');
    if (emptyCta) {
      emptyCta.addEventListener('click', () => document.getElementById('combo-nome').focus());
    }

    const searchInput = document.getElementById('combo-food-search');
    const resultsBox = document.getElementById('combo-food-results');
    let selectedFood = null;

    function renderItensList() {
      const wrap = document.getElementById('combo-itens-list');
      if (itensNovoCombo.length === 0) {
        wrap.innerHTML = '<div class="empty">Nenhum alimento adicionado ainda</div>';
        return;
      }
      wrap.innerHTML = itensNovoCombo.map((it, i) => `
        <div class="list-item">
          <div>
            <div>${Util.escapeHtml(it.foodName)} ${it.qty !== 1 ? `<span class="meta">(${it.qty}x)</span>` : ''}</div>
            <div class="meta">${it.kcal} kcal · P ${it.protein}g · C ${it.carbs}g · G ${it.fat}g</div>
          </div>
          <button class="link" data-remove-item="${i}">✕</button>
        </div>
      `).join('');
      wrap.querySelectorAll('[data-remove-item]').forEach(btn => {
        btn.addEventListener('click', () => {
          itensNovoCombo.splice(Number(btn.dataset.removeItem), 1);
          renderItensList();
        });
      });
    }
    renderItensList();

    searchInput.addEventListener('input', () => {
      const q = searchInput.value.trim().toLowerCase();
      selectedFood = null;
      document.getElementById('combo-selected-food-box').innerHTML = '';
      if (!q) { resultsBox.style.display = 'none'; return; }
      const lib = Storage.getAll('alimentos_biblioteca');
      const matches = lib.filter(f => f.name.toLowerCase().includes(q)).slice(0, 8);
      resultsBox.innerHTML = matches.length === 0
        ? `<div class="autocomplete-item">Nenhum resultado</div>`
        : matches.map(f => `<div class="autocomplete-item" data-id="${f.id}">${Util.escapeHtml(f.name)}<div class="meta">${f.kcal} kcal / ${f.portionLabel}</div></div>`).join('');
      resultsBox.style.display = '';
      resultsBox.querySelectorAll('[data-id]').forEach(el => {
        el.addEventListener('click', () => selectFood(lib.find(f => f.id === el.dataset.id)));
      });
    });

    function selectFood(food) {
      selectedFood = food;
      searchInput.value = food.name;
      resultsBox.style.display = 'none';
      document.getElementById('combo-selected-food-box').innerHTML = `
        <div class="row">
          <div>
            <label>Porções (de ${Util.escapeHtml(food.portionLabel)})</label>
            <input type="number" id="combo-qty-input" value="1" min="0.01" step="0.1">
          </div>
          <div>
            <label>ou gramas direto</label>
            <input type="number" id="combo-qty-grams-input" value="${food.portionGrams}" min="1" step="1">
          </div>
        </div>
        <button class="secondary" id="combo-add-item" style="margin-top:8px">Adicionar ao combo</button>
      `;
      const qtyInput = document.getElementById('combo-qty-input');
      const gramsInput = document.getElementById('combo-qty-grams-input');
      qtyInput.addEventListener('input', () => {
        gramsInput.value = Math.round((Number(qtyInput.value) || 0) * food.portionGrams * 10) / 10;
      });
      gramsInput.addEventListener('input', () => {
        qtyInput.value = Math.round(((Number(gramsInput.value) || 0) / food.portionGrams) * 1000) / 1000;
      });
      document.getElementById('combo-add-item').addEventListener('click', () => {
        const qty = Number(qtyInput.value) || 1;
        const item = { foodName: food.name, qty };
        NUTRI_FIELDS_COMBO.forEach(f => { item[f] = Math.round((food[f] || 0) * qty * 10) / 10; });
        itensNovoCombo.push(item);
        searchInput.value = '';
        document.getElementById('combo-selected-food-box').innerHTML = '';
        renderItensList();
      });
    }

    document.getElementById('save-combo').addEventListener('click', () => {
      const nome = document.getElementById('combo-nome').value.trim();
      if (!nome || itensNovoCombo.length === 0) return;
      Storage.add('combos', { nome, itens: itensNovoCombo });
      api.render();
    });

    function attachComboDelete() {
      $app.querySelectorAll('[data-del-combo]').forEach(btn => {
        btn.addEventListener('click', () => {
          Storage.remove('combos', btn.dataset.delCombo);
          api.render();
        });
      });
    }
  }

  function combosListHtml(combos) {
    if (combos.length === 0) {
      return `
        <div class="empty">
          Nenhum combo salvo ainda
          <div style="margin-top:10px"><button class="secondary" id="empty-cta-combo">+ Criar meu primeiro combo</button></div>
        </div>
      `;
    }
    return combos.map(c => {
      const totalKcal = c.itens.reduce((s, i) => s + (i.kcal || 0), 0);
      return `
        <div class="list-item" data-id="${c.id}">
          <div>
            <strong>${Util.escapeHtml(c.nome)}</strong>
            <div class="meta">${c.itens.map(i => i.foodName).join(', ')}</div>
            <div class="meta">${totalKcal.toFixed(0)} kcal no total</div>
          </div>
          <button class="link" data-del-combo="${c.id}">✕</button>
        </div>
      `;
    }).join('');
  }

  // ---------------- BACKUP ----------------
  function renderBackup($app, state, api) {
    $app.innerHTML = `
      <div class="card">
        <h2>Exportar / Importar</h2>
        <p class="meta">Como os dados ficam salvos só neste navegador, exporte periodicamente para não perder nada.</p>
        <button class="primary" id="export-json">Exportar backup (.json)</button>
        <label style="margin-top:14px">Importar backup</label>
        <input type="file" id="import-json" accept="application/json">
      </div>
      <div class="card">
        <h2>Relatório para análise com IA ou treinador</h2>
        <p class="meta">Gera um resumo em texto do período escolhido, pronto para colar numa conversa com uma IA ou mandar pro seu treinador.</p>
        <label>Período</label>
        <select id="report-periodo">
          <option value="15" selected>Últimos 15 dias</option>
          <option value="30">Últimos 30 dias</option>
          <option value="60">Últimos 60 dias</option>
          <option value="90">Últimos 90 dias</option>
        </select>
        <button class="secondary" id="gen-report" style="margin-top:10px">Gerar relatório</button>
        <textarea id="report-box" readonly style="min-height:280px;margin-top:10px;display:none;font-family:monospace;font-size:0.8rem"></textarea>
        <button class="secondary" id="copy-report" style="display:none;margin-top:8px">Copiar</button>
      </div>
    `;

    document.getElementById('export-json').addEventListener('click', () => {
      const data = Storage.exportAll();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `diario-backup-${Util.todayISO()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });

    document.getElementById('import-json').addEventListener('change', async e => {
      const file = e.target.files[0];
      if (!file) return;
      const text = await file.text();
      try {
        const data = JSON.parse(text);
        Storage.importAll(data);
        alert('Backup importado com sucesso!');
        api.render();
      } catch {
        alert('Arquivo inválido.');
      }
    });

    document.getElementById('gen-report').addEventListener('click', () => {
      const dias = Number(document.getElementById('report-periodo').value) || 15;
      const report = gerarRelatorio(dias);
      const box = document.getElementById('report-box');
      box.value = report;
      box.style.display = '';
      document.getElementById('copy-report').style.display = '';
    });

    document.getElementById('copy-report').addEventListener('click', () => {
      navigator.clipboard.writeText(document.getElementById('report-box').value);
    });
  }

  function gerarRelatorio(dias) {
    dias = dias || 15;
    const desde = Util.daysAgo(dias);
    const hoje = Util.todayISO();
    const perfil = Storage.getPerfil();
    const meta = calcularMetas(perfil);

    const medidas = Storage.getAll('medidas').filter(m => m.date >= desde).sort((a, b) => a.date.localeCompare(b.date));
    const pesos = medidas.filter(m => m.weight != null);
    const comidas = Storage.getAll('alimentacao').filter(a => a.date >= desde);
    const treinos = Storage.getAll('treino').filter(t => t.date >= desde);
    const corridas = Storage.getAll('corridas').filter(c => c.date >= desde);
    const aguas = Storage.getAll('agua').filter(a => a.date >= desde);
    const gastos = Storage.getAll('gastos').filter(g => g.date >= desde);
    const tarefas = Storage.getAll('tarefas');
    const conclusoes = Storage.getAll('tarefas_conclusoes').filter(c => c.date >= desde);

    const diasComComida = [...new Set(comidas.map(c => c.date))];
    const media = (arr, campo) => arr.length ? arr.reduce((s, x) => s + (x[campo] || 0), 0) / arr.length : null;
    const kcalMedia = diasComComida.length ? comidas.reduce((s, c) => s + (c.kcal || 0), 0) / diasComComida.length : null;
    const proteinaMedia = diasComComida.length ? comidas.reduce((s, c) => s + (c.protein || 0), 0) / diasComComida.length : null;
    const carbMedia = diasComComida.length ? comidas.reduce((s, c) => s + (c.carbs || 0), 0) / diasComComida.length : null;
    const gorduraMedia = diasComComida.length ? comidas.reduce((s, c) => s + (c.fat || 0), 0) / diasComComida.length : null;
    const aguaMedia = media(aguas, 'ml');
    const gastoMedio = media(gastos, 'kcal');

    const tendencia = typeof calcularTendenciaPeso === 'function' ? calcularTendenciaPeso() : null;

    let linhas = [`Relatório dos últimos ${dias} dias (${Util.fmtDate(desde)} a ${Util.fmtDate(hoje)})`, ''];

    linhas.push('== Perfil e objetivo ==');
    if (meta) {
      const objetivoNome = (DIETA_TEMPLATES.find(t => t.id === perfil.dietaTemplate) || {}).nome || 'Personalizado';
      linhas.push(`Objetivo: ${objetivoNome} · Meta: ${meta.kcal} kcal/dia (P ${meta.protein}g · C ${meta.carb}g · G ${meta.fat}g)`);
    } else {
      linhas.push('Perfil incompleto (sem meta calculada)');
    }
    linhas.push('');

    linhas.push('== Peso ==');
    if (pesos.length > 0) {
      linhas.push(`${pesos[0].weight}kg → ${pesos[pesos.length - 1].weight}kg (${pesos.length} registros no período)`);
    } else {
      linhas.push('Sem registros de peso no período');
    }
    if (tendencia) {
      linhas.push(`Tendência esperada pela dieta: ${tendencia.taxaEsperada >= 0 ? '+' : ''}${tendencia.taxaEsperada.toFixed(2)}kg/semana`);
      linhas.push(`Tendência real (histórico completo, ${tendencia.dias} dias): ${tendencia.taxaReal >= 0 ? '+' : ''}${tendencia.taxaReal.toFixed(2)}kg/semana`);
    }
    linhas.push('');

    linhas.push('== Alimentação ==');
    linhas.push(`Calorias: média de ${kcalMedia != null ? kcalMedia.toFixed(0) : 'sem dados'} kcal/dia (${diasComComida.length} de ${dias} dias registrados)`);
    if (proteinaMedia != null) {
      linhas.push(`Macros médios: P ${proteinaMedia.toFixed(0)}g · C ${carbMedia.toFixed(0)}g · G ${gorduraMedia.toFixed(0)}g por dia`);
    }
    if (gastoMedio != null) {
      linhas.push(`Calorias extras gastas (manual): média de ${gastoMedio.toFixed(0)} kcal/dia`);
    }
    if (aguaMedia != null) {
      linhas.push(`Água: média de ${aguaMedia.toFixed(0)}ml/dia`);
    }
    linhas.push('');

    linhas.push('== Treino ==');
    linhas.push(`Musculação: ${treinos.length} sessões registradas`);
    if (corridas.length > 0) {
      const paces = corridas.filter(c => c.distanceKm && c.timeMin).map(c => c.timeMin / c.distanceKm);
      linhas.push(`Corridas: ${corridas.length} registradas, melhor pace ${Math.min(...paces).toFixed(2)} min/km`);
    } else {
      linhas.push('Corridas: sem registros no período');
    }
    linhas.push('');

    linhas.push('== Tarefas/hábitos ==');
    const diasComTarefa = tarefas.length > 0 ? [...Array(dias)].map((_, i) => Util.daysAgo(i)).filter(d => tarefas.some(t => ViewTarefas.isApplicable(t, d))) : [];
    if (diasComTarefa.length > 0) {
      const totalEsperado = diasComTarefa.reduce((s, d) => s + tarefas.filter(t => ViewTarefas.isApplicable(t, d)).length, 0);
      const totalFeito = conclusoes.length;
      const pct = totalEsperado > 0 ? Math.round((totalFeito / totalEsperado) * 100) : 0;
      linhas.push(`Adesão: ${totalFeito} de ${totalEsperado} tarefas concluídas (${pct}%)`);
    } else {
      linhas.push('Sem tarefas configuradas');
    }

    return linhas.join('\n');
  }

  return { render };
})();
