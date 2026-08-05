const ViewMais = (() => {
  const MENU = [
    { key: 'tarefas', icon: '📋', label: 'Tarefas' },
    { key: 'fotos', icon: '📸', label: 'Fotos' },
    { key: 'exames', icon: '🩺', label: 'Exames Médicos' },
    { key: 'historico', icon: '📊', label: 'Histórico' },
    { key: 'perfil', icon: '👤', label: 'Meu Perfil' },
    { key: 'biblioteca-alimentos', icon: '🍎', label: 'Biblioteca de Alimentos' },
    { key: 'biblioteca-exercicios', icon: '🏋️', label: 'Biblioteca de Exercícios' },
    { key: 'planos-treino', icon: '🔄', label: 'Planos de Treino' },
    { key: 'combos', icon: '🥗', label: 'Combos de Refeição' },
    { key: 'dietas-custom', icon: '📋', label: 'Minhas Dietas' },
    { key: 'backup', icon: '💾', label: 'Backup' },
  ];

  function render($app, state, api) {
    switch (state.maisView) {
      case 'tarefas': return ViewTarefas.render($app, state, api);
      case 'fotos': return ViewFotos.render($app, state, api);
      case 'exames': return ViewExames.render($app, state, api);
      case 'historico': return ViewHistorico.render($app, state, api);
      case 'perfil': return renderPerfil($app, state, api);
      case 'biblioteca-alimentos': return renderBibliotecaAlimentos($app, state, api);
      case 'biblioteca-exercicios': return renderBibliotecaExercicios($app, state, api);
      case 'planos-treino': return renderPlanosTreino($app, state, api);
      case 'combos': return renderCombos($app, state, api);
      case 'dietas-custom': return renderDietasCustom($app, state, api);
      case 'backup': return renderBackup($app, state, api);
      case 'admin': return renderAdmin($app, state, api);
      default: return renderMenu($app, state, api);
    }
  }

  function contaCardHtml() {
    if (typeof Cloud === 'undefined' || !Cloud.isEnabled()) return '';
    const user = Cloud.currentUser();
    if (user) {
      const st = Cloud.getStatus();
      const stTxt = st === 'syncing' ? '⏳ sincronizando…' : st === 'error' ? '⚠️ erro ao sincronizar' : '✅ sincronizado';
      const ehAdmin = typeof Cloud.isAdmin === 'function' && Cloud.isAdmin();
      return `
        <div class="card">
          <h2>☁️ Conta e sincronização</h2>
          <p class="meta">Conectado como <strong>${Util.escapeHtml(user.email || user.displayName || 'usuário')}</strong>${ehAdmin ? ' <span class="badge pr">nutri/admin</span>' : ''}</p>
          <p class="meta">${stTxt} — seus dados abrem em qualquer navegador com este login.</p>
          ${ehAdmin ? `<p class="meta">Seu ID: <code id="cloud-uid" style="font-size:0.72rem">${Util.escapeHtml(user.uid)}</code> <button class="secondary" id="cloud-copy-uid" style="padding:3px 8px;font-size:0.7rem">copiar</button></p>` : ''}
          ${ehAdmin ? '<button class="primary" id="cloud-admin" style="margin-top:6px">Abrir painel do nutri</button>' : ''}
          <button class="secondary" id="cloud-logout" style="margin-top:8px">Sair</button>
        </div>
      `;
    }
    return `
      <div class="card">
        <h2>☁️ Sincronizar na nuvem</h2>
        <p class="meta">Entre para salvar seus dados na sua conta e abrir o app em qualquer navegador/aparelho.</p>
        <button class="primary" id="cloud-google">Entrar com Google</button>
        <div style="text-align:center;color:var(--text-muted);font-size:0.75rem;margin:10px 0">ou com e-mail</div>
        <input type="email" id="cloud-email" placeholder="seu@email.com" autocomplete="email">
        <input type="password" id="cloud-senha" placeholder="senha (mín. 6 caracteres)" autocomplete="current-password" style="margin-top:8px">
        <div class="row" style="margin-top:8px">
          <button class="secondary" id="cloud-entrar">Entrar</button>
          <button class="secondary" id="cloud-criar">Criar conta</button>
        </div>
        <p class="meta" id="cloud-erro" style="color:var(--danger);margin-top:8px"></p>
      </div>
    `;
  }

  function bindContaCard($app, api) {
    if (typeof Cloud === 'undefined' || !Cloud.isEnabled()) return;
    const erroEl = $app.querySelector('#cloud-erro');
    const showErro = e => {
      const map = {
        'auth/invalid-credential': 'E-mail ou senha incorretos.',
        'auth/wrong-password': 'Senha incorreta.',
        'auth/user-not-found': 'Conta não encontrada — use "Criar conta".',
        'auth/email-already-in-use': 'Este e-mail já tem conta — use "Entrar".',
        'auth/weak-password': 'Senha muito curta (mínimo 6 caracteres).',
        'auth/invalid-email': 'E-mail inválido.',
        'auth/popup-closed-by-user': 'Login cancelado.',
        'auth/unauthorized-domain': 'Domínio não autorizado no Firebase (configuração pendente).',
      };
      if (erroEl) erroEl.textContent = (e && map[e.code]) || (e && e.message) || 'Falha no login.';
    };
    const logoutBtn = $app.querySelector('#cloud-logout');
    if (logoutBtn) logoutBtn.addEventListener('click', () => { Cloud.logout(); });
    const copyBtn = $app.querySelector('#cloud-copy-uid');
    if (copyBtn) copyBtn.addEventListener('click', () => {
      const uid = Cloud.uid && Cloud.uid();
      if (uid && navigator.clipboard) navigator.clipboard.writeText(uid).then(() => { copyBtn.textContent = 'copiado!'; });
      else if (uid) { window.prompt('Seu ID (copie):', uid); }
    });
    const adminBtn = $app.querySelector('#cloud-admin');
    if (adminBtn) adminBtn.addEventListener('click', () => api.goToMais('admin'));
    const googleBtn = $app.querySelector('#cloud-google');
    if (googleBtn) googleBtn.addEventListener('click', () => { Cloud.loginGoogle().catch(showErro); });
    const entrarBtn = $app.querySelector('#cloud-entrar');
    if (entrarBtn) entrarBtn.addEventListener('click', () => {
      const email = $app.querySelector('#cloud-email').value.trim();
      const senha = $app.querySelector('#cloud-senha').value;
      Cloud.loginEmail(email, senha).catch(showErro);
    });
    const criarBtn = $app.querySelector('#cloud-criar');
    if (criarBtn) criarBtn.addEventListener('click', () => {
      const email = $app.querySelector('#cloud-email').value.trim();
      const senha = $app.querySelector('#cloud-senha').value;
      Cloud.signupEmail(email, senha).catch(showErro);
    });
  }

  function renderMenu($app, state, api) {
    $app.innerHTML = `
      ${contaCardHtml()}
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
    bindContaCard($app, api);
    $app.querySelectorAll('[data-go]').forEach(btn => {
      btn.addEventListener('click', () => api.goToMais(btn.dataset.go));
    });
  }

  // ---------------- PERFIL ----------------
  function renderPerfil($app, state, api) {
    const perfil = Storage.getPerfil();
    const pesoAtual = Util.getPesoAtual();
    const isEmagrecimentoAtual = (perfil.dietaTemplate || '').startsWith('emagrecimento_');
    const nivelAtual = isEmagrecimentoAtual ? perfil.dietaTemplate : EMAGRECIMENTO_PADRAO;

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
          <option value="emagrecimento" ${isEmagrecimentoAtual ? 'selected' : ''}>Emagrecimento</option>
          ${DIETA_TEMPLATES.filter(d => !d.id.startsWith('emagrecimento_')).map(d => `<option value="${d.id}" ${perfil.dietaTemplate === d.id ? 'selected' : ''}>${d.nome}</option>`).join('')}
          ${Storage.getAll('dietas_custom').map(d => `<option value="dc:${d.id}" ${perfil.dietaCustomId === d.id ? 'selected' : ''}>${Util.escapeHtml(d.nome)}</option>`).join('')}
          <option value="custom" ${perfil.metaCustom && !perfil.dietaCustomId ? 'selected' : ''}>Personalizado (definir eu mesmo)</option>
        </select>
        <div id="emagrecimento-nivel-fields" style="display:${isEmagrecimentoAtual ? '' : 'none'}">
          <label>Nível</label>
          <select id="p-emagrecimento-nivel">
            ${EMAGRECIMENTO_NIVEIS.map(n => `<option value="${n.id}" ${nivelAtual === n.id ? 'selected' : ''}>${n.nome.replace('Emagrecimento — ', '')}</option>`).join('')}
          </select>
        </div>
        <p class="meta" id="dieta-desc" style="color:var(--text-muted);font-size:0.78rem"></p>
        <button type="button" class="secondary" id="go-dietas-custom" style="margin:8px 0">+ Gerenciar minhas dietas</button>
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
    const nivelSelect = document.getElementById('p-emagrecimento-nivel');
    const nivelFields = document.getElementById('emagrecimento-nivel-fields');
    const customFields = document.getElementById('custom-fields');
    const templateFields = document.getElementById('template-fields');

    // "Emagrecimento" no select principal é só uma categoria — o valor de verdade (o nível
    // escolhido) vem do select secundário que só aparece quando essa categoria é selecionada.
    function dietaValResolvido() {
      return dietaSelect.value === 'emagrecimento' ? nivelSelect.value : dietaSelect.value;
    }

    function currentFormPerfil() {
      const dietaVal = dietaValResolvido();
      const isDietaCustom = dietaVal.startsWith('dc:');
      const p = {
        peso: Number(document.getElementById('p-peso').value) || null,
        altura: Number(document.getElementById('p-altura').value) || null,
        idade: Number(document.getElementById('p-idade').value) || null,
        sexo: document.getElementById('p-sexo').value,
        nivelAtividade: document.getElementById('p-atividade').value,
        dietaTemplate: (dietaVal === 'custom' || isDietaCustom) ? null : dietaVal,
        macroStyle: document.getElementById('p-macro-style').value,
        mealStrategy: document.getElementById('p-meal-strategy').value,
        numRefeicoes: Math.max(1, Number(document.getElementById('p-num-refeicoes').value) || 5),
        aguaMetaCustom: Number(document.getElementById('p-agua-meta').value) || null,
      };
      if (isDietaCustom) {
        p.dietaCustomId = dietaVal.slice(3);
      } else if (dietaVal === 'custom') {
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
      const isDietaCustom = dietaSelect.value.startsWith('dc:');
      customFields.style.display = isCustom ? '' : 'none';
      templateFields.style.display = (isCustom || isDietaCustom) ? 'none' : '';
      nivelFields.style.display = dietaSelect.value === 'emagrecimento' ? '' : 'none';

      const dietaTemplate = DIETA_TEMPLATES.find(d => d.id === dietaValResolvido());
      document.getElementById('dieta-desc').textContent = dietaTemplate ? dietaTemplate.descricao : '';

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

    $app.querySelectorAll('#p-peso, #p-altura, #p-idade, #p-sexo, #p-atividade, #p-dieta, #p-emagrecimento-nivel, #p-macro-style, #p-meal-strategy, #p-num-refeicoes, #p-agua-meta, #p-kcal, #p-protein, #p-carb, #p-fat, #p-fiber').forEach(el => {
      el.addEventListener('input', updatePreview);
      el.addEventListener('change', updatePreview);
    });
    updatePreview();

    document.getElementById('save-perfil').addEventListener('click', () => {
      Storage.savePerfil(currentFormPerfil());
      alert('Perfil salvo!');
      api.render();
    });

    document.getElementById('go-dietas-custom').addEventListener('click', () => {
      api.goToMais('dietas-custom');
    });
  }

  // ---------------- MINHAS DIETAS (personalizadas nomeadas) ----------------
  function renderDietasCustom($app, state, api) {
    const dietas = Storage.getAll('dietas_custom');
    const perfil = Storage.getPerfil();

    $app.innerHTML = `
      <div class="card">
        <h2>Nova dieta</h2>
        <p class="meta">Salve um plano recebido de nutricionista (ou outra meta fixa) com um nome, pra escolher depois no Objetivo do seu Perfil.</p>
        <label>Nome</label>
        <input type="text" id="dc-nome" placeholder="Ex: Dieta do mês 08/2026">
        <div class="row">
          <div><label>Calorias (kcal)</label><input type="number" id="dc-kcal"></div>
          <div><label>Proteína (g)</label><input type="number" id="dc-protein"></div>
        </div>
        <div class="row">
          <div><label>Carboidrato (g)</label><input type="number" id="dc-carb"></div>
          <div><label>Gordura (g)</label><input type="number" id="dc-fat"></div>
        </div>
        <label>Fibras (g) — opcional</label>
        <input type="number" id="dc-fiber">
        <button class="primary" id="save-dieta-custom" style="margin-top:10px">Salvar dieta</button>
      </div>
      <div class="card">
        <h2>Dietas salvas (${dietas.length})</h2>
        <div id="dietas-custom-list">
          ${dietas.length === 0 ? '<div class="empty">Nenhuma dieta salva ainda</div>' : dietas.map(d => `
            <div class="list-item" data-id="${d.id}">
              <div>
                <div>${Util.escapeHtml(d.nome)} ${perfil.dietaCustomId === d.id ? '<span class="badge pr">Em uso</span>' : ''}</div>
                <div class="meta">${d.kcal} kcal · P ${d.protein}g · C ${d.carb}g · G ${d.fat}g${d.fiber ? ` · Fibras ${d.fiber}g` : ''}</div>
              </div>
              <div style="display:flex;gap:6px">
                <button class="secondary" data-usar="${d.id}" style="font-size:0.75rem;padding:6px 10px">Usar</button>
                <button class="link" data-remove-dieta="${d.id}">✕</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    document.getElementById('save-dieta-custom').addEventListener('click', () => {
      const nome = document.getElementById('dc-nome').value.trim();
      const kcal = Number(document.getElementById('dc-kcal').value) || null;
      if (!nome || !kcal) return;
      Storage.add('dietas_custom', {
        nome,
        kcal,
        protein: Number(document.getElementById('dc-protein').value) || null,
        carb: Number(document.getElementById('dc-carb').value) || null,
        fat: Number(document.getElementById('dc-fat').value) || null,
        fiber: Number(document.getElementById('dc-fiber').value) || null,
      });
      api.render();
    });

    $app.querySelectorAll('[data-usar]').forEach(btn => {
      btn.addEventListener('click', () => {
        Storage.savePerfil({ ...perfil, dietaTemplate: null, metaCustom: null, dietaCustomId: btn.dataset.usar });
        alert('Dieta selecionada como objetivo atual!');
        api.render();
      });
    });

    $app.querySelectorAll('[data-remove-dieta]').forEach(btn => {
      btn.addEventListener('click', () => {
        Storage.remove('dietas_custom', btn.dataset.removeDieta);
        api.render();
      });
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

    // Permite corrigir o grupo muscular de exercícios já cadastrados (ex: os que foram
    // digitados livremente durante um treino e nunca tiveram grupo definido) sem precisar
    // apagar e recriar — assim que salvo, a ilustração do músculo já aparece.
    function attachGrupoSelect() {
      $app.querySelectorAll('[data-grupo-ex]').forEach(sel => {
        sel.addEventListener('change', () => {
          Storage.update('exercicios_biblioteca', sel.dataset.grupoEx, { grupo: sel.value });
          api.render();
        });
      });
    }
    attachGrupoSelect();

    $app.querySelectorAll('#grupo-filter .chip').forEach(chip => {
      chip.addEventListener('click', () => {
        $app.querySelectorAll('#grupo-filter .chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const grupo = chip.dataset.grupo;
        const filtered = grupo === 'todos' ? lib : lib.filter(e => e.grupo === grupo);
        document.getElementById('exercicio-lib-list').innerHTML = exercicioListHtml(filtered);
        attachDelete();
        attachEditLink();
        attachGrupoSelect();
      });
    });

    document.getElementById('add-exercicio').addEventListener('click', () => {
      const name = document.getElementById('e-name').value.trim();
      const grupo = document.getElementById('e-grupo').value;
      const equipamento = document.getElementById('e-equipamento').value.trim();
      const videoUrl = document.getElementById('e-video').value.trim();
      if (!name) return;
      Storage.add('exercicios_biblioteca', { name, grupo, equipamento, videoUrl, custom: true });
      if (videoUrl && typeof Cloud !== 'undefined' && Cloud.isEnabled() && Cloud.sugerirVideo) Cloud.sugerirVideo(name, videoUrl);
      api.render();
    });

    function attachEditLink() {
      $app.querySelectorAll('[data-edit-link]').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.editLink;
          const atual = lib.find(e => e.id === id);
          const novoLink = prompt('Cole o link do vídeo (deixe em branco para voltar a usar a busca automática do YouTube):', atual?.videoUrl || '');
          if (novoLink === null) return;
          const link = novoLink.trim();
          Storage.update('exercicios_biblioteca', id, { videoUrl: link });
          if (link && atual && typeof Cloud !== 'undefined' && Cloud.isEnabled() && Cloud.sugerirVideo) Cloud.sugerirVideo(atual.name, link);
          api.render();
        });
      });
    }
    attachEditLink();
  }

  function exercicioListHtml(list) {
    if (list.length === 0) return '<div class="empty">Nenhum exercício encontrado</div>';
    return list.map(e => {
      const img = GRUPO_ICONE_PATH[e.grupo];
      const thumbConteudo = img
        ? `<img src="${img}" alt="${Util.escapeHtml(e.grupo)}" class="ex-thumb-img">`
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 12h12"/><rect x="2.5" y="9" width="3" height="6" rx="1"/><rect x="18.5" y="9" width="3" height="6" rx="1"/><rect x="5.5" y="7" width="2" height="10" rx="1"/><rect x="16.5" y="7" width="2" height="10" rx="1"/></svg>';
      return `
      <div class="list-item" data-id="${e.id}">
        <div style="display:flex;align-items:center;gap:10px">
          <span class="ex-thumb" style="position:static">${thumbConteudo}</span>
          <div>
            <strong>${Util.escapeHtml(e.name)}</strong>
            <div class="meta" style="display:flex;align-items:center;gap:4px;flex-wrap:wrap">
              <select class="grupo-inline-select" data-grupo-ex="${e.id}" style="width:auto;padding:2px 6px;font-size:0.78rem">
                ${!e.grupo ? '<option value="">— sem grupo —</option>' : ''}
                ${GRUPOS_MUSCULARES.map(g => `<option value="${g}" ${g === e.grupo ? 'selected' : ''}>${g}</option>`).join('')}
              </select>
              ${e.equipamento ? '· ' + Util.escapeHtml(e.equipamento) : ''}
            </div>
            <a href="${e.videoUrl || Util.youtubeSearchUrl(e.name)}" target="_blank" rel="noopener" class="meta" style="color:var(--accent)">▶ Ver vídeo${e.videoUrl ? '' : ' (busca automática)'}</a>
            · <button class="link" data-edit-link="${e.id}" style="color:var(--text-muted)">${e.videoUrl ? 'editar link' : 'definir link'}</button>
          </div>
        </div>
        <button class="link" data-del-ex="${e.id}">✕</button>
      </div>
    `;
    }).join('');
  }

  // ---------------- PLANOS DE TREINO ----------------
  function renderPlanosTreino($app, state, api) {
    const planos = Storage.getAll('treino_planos').sort((a, b) => a.ordem - b.ordem);
    const biblioteca = Storage.getAll('exercicios_biblioteca');
    const perfil = Storage.getPerfil();
    const objetivoAtual = perfil.dietaTemplate || 'manutencao';

    // A ficha do personal do Victor (Bronyer) só aparece pra ele — não é um pacote
    // genérico do app, é a ficha pessoal dele. Some do dropdown pra todo mundo mais.
    const souDono = typeof Cloud === 'undefined' || !Cloud.isEnabled()
      || (typeof Cloud.isSuperAdmin === 'function' && Cloud.isSuperAdmin());
    const fontePessoal = typeof PLANO_VICTOR !== 'undefined' ? PLANO_VICTOR.fonte : null;
    const pacotesVisiveis = Object.keys(TREINOS_PREDEFINIDOS).filter(id => souDono || id !== fontePessoal);

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
          ${pacotesVisiveis.map(id => {
            const dieta = DIETA_TEMPLATES.find(d => d.id === id);
            const rotulo = dieta ? `${dieta.nome} — ${TREINOS_PREDEFINIDOS[id].label}` : TREINOS_PREDEFINIDOS[id].label;
            return `<option value="${id}" ${id === objetivoAtual ? 'selected' : ''}>${Util.escapeHtml(rotulo)}</option>`;
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
          <input type="text" class="small ex-reps" placeholder="Reps" value="${Util.escapeHtml(r.reps)}">
          <input type="number" class="small ex-weight" placeholder="Kg" value="${Util.escapeHtml(r.weight)}">
          <input type="text" class="ex-descanso" placeholder="Descanso (ex: 1m30s)" value="${Util.escapeHtml(r.descanso || '')}" style="flex-basis:100%">
          <input type="text" class="ex-obs" placeholder="Observação (ex: 1ª série aquecimento)" value="${Util.escapeHtml(r.obs || '')}" style="flex-basis:100%">
          <button class="link" data-remove-row="${i}">✕</button>
        </div>
      `).join('');

      function syncRows() {
        const names = rowsWrap.querySelectorAll('.ex-name');
        const sets = rowsWrap.querySelectorAll('.ex-sets');
        const reps = rowsWrap.querySelectorAll('.ex-reps');
        const weights = rowsWrap.querySelectorAll('.ex-weight');
        const descansos = rowsWrap.querySelectorAll('.ex-descanso');
        const obses = rowsWrap.querySelectorAll('.ex-obs');
        rows = rows.map((r, i) => ({
          name: names[i] ? names[i].value : r.name,
          sets: sets[i] ? sets[i].value : r.sets,
          reps: reps[i] ? reps[i].value : r.reps,
          weight: weights[i] ? weights[i].value : r.weight,
          descanso: descansos[i] ? descansos[i].value : (r.descanso || ''),
          obs: obses[i] ? obses[i].value : (r.obs || ''),
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
        <label>Horário (opcional) — usado para sugerir a refeição no Início quando uma dieta específica está selecionada</label>
        <input type="time" id="combo-horario">
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
      const horario = document.getElementById('combo-horario').value || null;
      if (!nome || itensNovoCombo.length === 0) return;
      Storage.add('combos', { nome, horario, itens: itensNovoCombo });
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
            <strong>${Util.escapeHtml(c.nome)}</strong> ${c.horario ? `<span class="meta">⏰ ${c.horario}</span>` : ''}
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

  // ---------------- PAINEL DO NUTRI/ADMIN ----------------
  function renderAdmin($app, state, api) {
    if (typeof Cloud === 'undefined' || !Cloud.isEnabled() || !Cloud.isAdmin()) {
      $app.innerHTML = '<div class="card"><p class="empty">Acesso restrito ao nutri/admin.</p></div>';
      return;
    }
    const souSuperAdmin = typeof Cloud.isSuperAdmin === 'function' && Cloud.isSuperAdmin();
    $app.innerHTML = `
      <div class="card">
        <h2>🔗 Convidar paciente</h2>
        <p class="meta">Compartilhe este link com seus pacientes — ao criar conta por ele, ficam vinculados a você automaticamente.</p>
        <div class="row">
          <div style="flex:2"><input type="text" id="admin-invite-link" readonly value="Gerando…"></div>
          <div style="flex:0 0 auto"><button class="secondary" id="admin-invite-copy">copiar</button></div>
        </div>
      </div>
      <div class="card">
        <h2>🎬 Vídeos para aprovar</h2>
        <div id="admin-videos"><div class="empty">Carregando…</div></div>
      </div>
      <div class="card">
        <h2>👥 ${souSuperAdmin ? 'Todos os pacientes (todas as nutris)' : 'Seus pacientes'}</h2>
        ${souSuperAdmin ? '<p class="meta"><span class="badge pr">super-admin</span> Você vê pacientes de todas as nutris.</p>' : ''}
        <p class="meta">Toque para ver o resumo e enviar uma dieta.</p>
        <div id="admin-users"><div class="empty">Carregando…</div></div>
      </div>
      <div id="admin-detail"></div>
    `;
    const usersEl = $app.querySelector('#admin-users');
    const detailEl = $app.querySelector('#admin-detail');
    const videosEl = $app.querySelector('#admin-videos');

    const inviteInput = $app.querySelector('#admin-invite-link');
    Cloud.gerarConviteLink().then(link => { inviteInput.value = link; })
      .catch(() => { inviteInput.value = ''; inviteInput.placeholder = 'Erro ao gerar link — tente reabrir o painel.'; });
    $app.querySelector('#admin-invite-copy').addEventListener('click', () => {
      const link = inviteInput.value;
      if (!link) return;
      const btn = $app.querySelector('#admin-invite-copy');
      if (navigator.clipboard) navigator.clipboard.writeText(link).then(() => { btn.textContent = 'copiado!'; });
      else window.prompt('Seu link de convite (copie):', link);
    });

    function carregarVideos() {
      Cloud.listarVideosPendentes().then(vids => {
        if (!vids.length) { videosEl.innerHTML = '<div class="empty">Nenhum vídeo pendente.</div>'; return; }
        videosEl.innerHTML = vids.map(v => `
          <div class="list-item" data-vid="${Util.escapeHtml(v.id)}">
            <div>
              <strong>${Util.escapeHtml(v.exercicio || '')}</strong>
              <div class="meta">sugerido por ${Util.escapeHtml(v.byEmail || v.byUid || '')}</div>
              <a href="${Util.escapeHtml(v.videoUrl || '')}" target="_blank" rel="noopener" class="meta" style="color:var(--accent)">▶ ver vídeo</a>
            </div>
            <div style="display:flex;gap:6px">
              <button class="secondary" data-aprovar="${Util.escapeHtml(v.id)}" style="font-size:0.75rem;padding:6px 10px">Aprovar</button>
              <button class="link" data-rejeitar="${Util.escapeHtml(v.id)}">Rejeitar</button>
            </div>
          </div>
        `).join('');
        videosEl.querySelectorAll('[data-aprovar]').forEach(btn => {
          btn.addEventListener('click', async () => {
            const v = vids.find(x => x.id === btn.dataset.aprovar);
            btn.textContent = '...';
            try { await Cloud.aprovarVideoPendente(v.id, v.exercicio, v.videoUrl); carregarVideos(); }
            catch (e) { btn.textContent = 'erro'; }
          });
        });
        videosEl.querySelectorAll('[data-rejeitar]').forEach(btn => {
          btn.addEventListener('click', async () => {
            try { await Cloud.rejeitarVideoPendente(btn.dataset.rejeitar); carregarVideos(); }
            catch (e) { /* segue */ }
          });
        });
      }).catch(e => { videosEl.innerHTML = `<div class="empty">Erro: ${Util.escapeHtml(e.message || '')}</div>`; });
    }
    carregarVideos();

    Cloud.listarUsuarios().then(users => {
      if (!users.length) { usersEl.innerHTML = '<div class="empty">Nenhum usuário ainda.</div>'; return; }
      users.sort((a, b) => (a.email || '').localeCompare(b.email || ''));
      usersEl.innerHTML = users.map(u => `
        <button class="menu-item" data-uid="${Util.escapeHtml(u.uid)}">
          <span class="icon">👤</span> ${Util.escapeHtml(u.displayName || u.email || u.uid)} <span class="chev">›</span>
        </button>
      `).join('');
      usersEl.querySelectorAll('[data-uid]').forEach(btn => {
        btn.addEventListener('click', () => abrirUsuario(btn.dataset.uid, users.find(x => x.uid === btn.dataset.uid)));
      });
    }).catch(e => { usersEl.innerHTML = `<div class="empty">Erro ao listar: ${Util.escapeHtml(e.message || '')}</div>`; });

    async function abrirUsuario(uid, info) {
      detailEl.innerHTML = '<div class="card"><div class="empty">Carregando dados…</div></div>';
      let dados = null; let presc = null;
      try { dados = await Cloud.dadosUsuario(uid); } catch (e) { /* segue */ }
      try { presc = await Cloud.prescricaoDe(uid); } catch (e) { /* segue */ }
      const nTreino = dados && dados.treino ? dados.treino.length : 0;
      const nRef = dados && dados.alimentacao ? dados.alimentacao.length : 0;
      const medidas = dados && dados.medidas ? dados.medidas.filter(m => m.weight != null).sort((a, b) => b.date.localeCompare(a.date)) : [];
      const peso = medidas.length ? medidas[0].weight : null;
      const p = presc || {};
      detailEl.innerHTML = `
        <div class="card">
          <h2>${Util.escapeHtml((info && (info.displayName || info.email)) || uid)}</h2>
          <p class="meta">${Util.escapeHtml((info && info.email) || '')}</p>
          <p class="meta">ID: <code style="font-size:0.72rem">${Util.escapeHtml(uid)}</code></p>
          <p class="meta">Treinos: ${nTreino} · Refeições lançadas: ${nRef} · Peso atual: ${peso != null ? peso + 'kg' : '—'}</p>
        </div>
        <div class="card">
          <h3 style="font-size:0.92rem;margin:0 0 8px">📅 Diário do paciente</h3>
          <label>Escolha o dia</label>
          <input type="date" id="ad-diario-data" value="${Util.todayISO()}">
          <div id="ad-diario-conteudo" style="margin-top:10px"></div>
        </div>
        <div class="card">
          <h3 style="font-size:0.92rem;margin:0 0 8px">Enviar / atualizar dieta</h3>
          ${presc ? `<p class="meta">Dieta atual: <strong>${Util.escapeHtml(p.nome || '')}</strong> · ${p.kcal || '—'} kcal</p>` : '<p class="meta">Nenhuma dieta enviada ainda.</p>'}
          <label>Nome da dieta</label>
          <input type="text" id="ad-nome" value="${Util.escapeHtml(p.nome || '')}" placeholder="Ex: Dieta agosto">
          <div class="row">
            <div><label>Calorias</label><input type="number" id="ad-kcal" value="${p.kcal || ''}"></div>
            <div><label>Proteína (g)</label><input type="number" id="ad-protein" value="${p.protein || ''}"></div>
          </div>
          <div class="row">
            <div><label>Carbo (g)</label><input type="number" id="ad-carb" value="${p.carb || ''}"></div>
            <div><label>Gordura (g)</label><input type="number" id="ad-fat" value="${p.fat || ''}"></div>
          </div>
          <label>Fibras (g) — opcional</label>
          <input type="number" id="ad-fiber" value="${p.fiber || ''}">
          <button class="primary" id="ad-enviar" style="margin-top:10px">Enviar dieta para este usuário</button>
          <p class="meta" id="ad-msg" style="margin-top:8px"></p>
        </div>
        <div id="admin-plano"></div>
        <div id="admin-treino"></div>
        <div id="admin-reatribuir"></div>
      `;
      montarPlano(uid, presc);
      montarTreino(uid, presc);
      montarReatribuir(uid, info);
      const diarioConteudo = detailEl.querySelector('#ad-diario-conteudo');
      const diarioData = detailEl.querySelector('#ad-diario-data');
      const pintarDiario = () => { diarioConteudo.innerHTML = renderDiarioDia(dados || {}, diarioData.value); };
      diarioData.addEventListener('change', pintarDiario);
      pintarDiario();
      detailEl.querySelector('#ad-enviar').addEventListener('click', async () => {
        const msg = detailEl.querySelector('#ad-msg');
        const nome = detailEl.querySelector('#ad-nome').value.trim();
        const kcal = Number(detailEl.querySelector('#ad-kcal').value) || null;
        if (!nome || !kcal) { msg.textContent = 'Informe ao menos nome e calorias.'; return; }
        const dieta = {
          nome, kcal,
          protein: Number(detailEl.querySelector('#ad-protein').value) || null,
          carb: Number(detailEl.querySelector('#ad-carb').value) || null,
          fat: Number(detailEl.querySelector('#ad-fat').value) || null,
          fiber: Number(detailEl.querySelector('#ad-fiber').value) || null,
        };
        msg.textContent = 'Enviando…';
        try { await Cloud.enviarDieta(uid, dieta); msg.textContent = '✅ Dieta enviada! O usuário verá ao abrir/entrar no app.'; }
        catch (e) { msg.textContent = '⚠️ Falha ao enviar: ' + (e.message || ''); }
      });
    }

    // Espelha o diário do paciente (Alimentação + Treino + Corrida + Água) num dia específico,
    // só leitura — usa o snapshot já baixado (dados), sem nova consulta por troca de data.
    function renderDiarioDia(dados, dateISO) {
      const alimentacao = (dados.alimentacao || []).filter(e => e.date === dateISO).sort((a, b) => (a.order || 0) - (b.order || 0));
      const treinos = (dados.treino || []).filter(t => t.date === dateISO);
      const corridas = (dados.corridas || []).filter(c => c.date === dateISO);
      const agua = (dados.agua || []).filter(a => a.date === dateISO);
      const aguaTotal = agua.reduce((s, a) => s + (a.ml || 0), 0);

      const totals = { kcal: 0, carbs: 0, protein: 0, fat: 0, fiber: 0 };
      alimentacao.forEach(e => {
        totals.kcal += e.kcal || 0; totals.carbs += e.carbs || 0;
        totals.protein += e.protein || 0; totals.fat += e.fat || 0; totals.fiber += e.fiber || 0;
      });

      const grupos = {};
      alimentacao.forEach(e => { grupos[e.mealType] = grupos[e.mealType] || []; grupos[e.mealType].push(e); });
      const fotosRefeicao = (dados.refeicao_fotos || []).filter(f => f.date === dateISO);
      const fotoDe = tipo => fotosRefeicao.find(f => f.mealType === tipo);

      return `
        <p class="meta"><strong>${totals.kcal.toFixed(0)} kcal</strong> · P ${totals.protein.toFixed(0)}g · C ${totals.carbs.toFixed(0)}g · G ${totals.fat.toFixed(0)}g · Fibra ${totals.fiber.toFixed(0)}g</p>
        <p class="meta">💧 Água: ${aguaTotal}ml</p>
        <p class="meta">${treinos.length > 0 ? `✅ Treino: ${treinos.map(t => (t.exercises || []).map(e => `${Util.escapeHtml(e.name)}${e.weight ? ` (${e.weight}kg)` : ''}`).join(', ') || 'sem exercícios').join(' | ')}` : '⬜ Sem treino registrado'}</p>
        <p class="meta">${corridas.length > 0 ? `🏃 Corrida: ${corridas.map(c => `${c.distanceKm}km em ${c.timeMin}min`).join(', ')}` : '⬜ Sem corrida registrada'}</p>
        ${Object.keys(grupos).length === 0 ? '<p class="empty">Nenhuma refeição registrada neste dia</p>' : Object.keys(grupos).map(tipo => {
          const foto = fotoDe(tipo);
          return `
          <div style="margin-top:10px">
            <div class="row" style="align-items:center">
              ${foto ? `<img src="${foto.fotoDataURL}" class="meal-thumb" alt="Foto do prato">` : ''}
              <strong style="font-size:0.85rem">${Util.escapeHtml(tipo)}</strong>
            </div>
            ${grupos[tipo].map(e => `
              <div class="list-item">
                <div>
                  <div>${Util.escapeHtml(e.foodName)} ${e.qty !== 1 ? `<span class="meta">(${e.qty}x)</span>` : ''}</div>
                  <div class="meta">${e.kcal} kcal · P ${e.protein}g · C ${e.carbs}g · G ${e.fat}g</div>
                </div>
              </div>
            `).join('')}
          </div>
        `;
        }).join('')}
      `;
    }

    // Reatribuir paciente a uma nutri (só super-admin). Resolve pacientes "soltos"
    // (sem nutriId) ou vinculados à nutri errada, sem o paciente precisar recriar a conta.
    function montarReatribuir(uid, info) {
      const cont = detailEl.querySelector('#admin-reatribuir');
      if (!cont) return;
      if (typeof Cloud.isSuperAdmin !== 'function' || !Cloud.isSuperAdmin()) return;
      cont.innerHTML = '<div class="card"><div class="empty">Carregando nutris…</div></div>';
      Cloud.listarNutris().then(nutris => {
        const atual = (info && info.nutriId) || '';
        const nomeDe = n => Util.escapeHtml(n.displayName || n.email || n.nome || n.uid);
        const atualNome = nutris.find(n => n.uid === atual);
        cont.innerHTML = `
          <div class="card">
            <h3 style="font-size:0.92rem;margin:0 0 6px">🔗 Nutri responsável (super-admin)</h3>
            <p class="meta">Atual: <strong>${atual ? (atualNome ? nomeDe(atualNome) : Util.escapeHtml(atual)) : 'nenhuma (paciente solto)'}</strong></p>
            <label>Vincular a</label>
            <select id="reat-nutri">
              ${nutris.map(n => `<option value="${Util.escapeHtml(n.uid)}" ${n.uid === atual ? 'selected' : ''}>${nomeDe(n)}</option>`).join('')}
            </select>
            <button class="primary" id="reat-btn" style="margin-top:10px">Reatribuir paciente</button>
            <p class="meta" id="reat-msg" style="margin-top:6px"></p>
          </div>
        `;
        cont.querySelector('#reat-btn').addEventListener('click', async () => {
          const nutriUid = cont.querySelector('#reat-nutri').value;
          const msg = cont.querySelector('#reat-msg');
          if (!nutriUid) { msg.textContent = 'Escolha uma nutri.'; return; }
          msg.textContent = 'Salvando…';
          try {
            await Cloud.reatribuirPaciente(uid, nutriUid);
            if (info) info.nutriId = nutriUid;
            msg.textContent = '✅ Paciente vinculado! Ele já aparece para essa nutri.';
          } catch (e) { msg.textContent = '⚠️ Falha: ' + (e.message || ''); }
        });
      }).catch(e => { cont.innerHTML = `<div class="card"><div class="empty">Erro ao carregar nutris: ${Util.escapeHtml(e.message || '')}</div></div>`; });
    }

    // Construtor de plano alimentar (refeição a refeição) para um paciente.
    function montarPlano(uid, presc) {
      const cont = detailEl.querySelector('#admin-plano');
      if (!cont) return;
      const NUTRI = ['kcal', 'carbs', 'sugars', 'protein', 'fat', 'satFat', 'transFat', 'fiber', 'sodium'];
      const biblioteca = Storage.getAll('alimentos_biblioteca').sort((a, b) => a.name.localeCompare(b.name));
      let refeicoes = (presc && Array.isArray(presc.refeicoes))
        ? presc.refeicoes.map(r => ({ ...r, itens: (r.itens || []).map(i => ({ ...i })) })) : [];
      let itensNovo = [];
      let plSelectedFood = null;

      function paint() {
        cont.innerHTML = `
          <div class="card">
            <h3 style="font-size:0.92rem;margin:0 0 8px">🍽️ Plano alimentar (refeição a refeição)</h3>
            ${refeicoes.length === 0 ? '<p class="meta">Nenhuma refeição no plano ainda.</p>' : refeicoes.map((r, i) => `
              <div class="list-item">
                <div>
                  <strong>${Util.escapeHtml(r.nome)}</strong> ${r.horario ? `<span class="meta">${Util.escapeHtml(r.horario)}</span>` : ''}
                  <div class="meta">${(r.itens || []).map(it => Util.escapeHtml(it.foodName) + (it.qty !== 1 ? ` (${it.qty}x)` : '')).join(', ')}</div>
                </div>
                <button class="link" data-del-ref="${i}">✕</button>
              </div>
            `).join('')}
            <hr style="border:none;border-top:1px solid var(--border);margin:12px 0">
            <label>Nome da refeição</label>
            <input type="text" id="pl-nome" placeholder="Ex: Café da manhã">
            <label>Horário</label>
            <input type="time" id="pl-hora">
            <label>Adicionar alimento</label>
            <div class="autocomplete-wrap">
              <input type="text" id="pl-food-search" placeholder="Buscar na biblioteca..." autocomplete="off">
              <div class="autocomplete-list" id="pl-food-results" style="display:none"></div>
            </div>
            <div id="pl-selected-food-box"></div>
            <button class="secondary" id="pl-add-item" style="width:100%;margin-top:8px" disabled>+ Adicionar item à refeição</button>
            <div id="pl-itens" style="margin-top:8px"></div>
            <button class="secondary" id="pl-add-ref" style="width:100%;margin-top:10px">+ Adicionar refeição ao plano</button>
            <button class="primary" id="pl-enviar" style="margin-top:8px">Enviar plano alimentar</button>
            <p class="meta" id="pl-msg" style="margin-top:6px"></p>
          </div>
        `;
        pintarItens();
        cont.querySelectorAll('[data-del-ref]').forEach(b => b.addEventListener('click', () => { refeicoes.splice(Number(b.dataset.delRef), 1); paint(); }));
        wireFoodSearch();
        cont.querySelector('#pl-add-ref').addEventListener('click', () => {
          const nome = cont.querySelector('#pl-nome').value.trim();
          const horario = cont.querySelector('#pl-hora').value || null;
          if (!nome || itensNovo.length === 0) { cont.querySelector('#pl-msg').textContent = 'Dê um nome e adicione ao menos 1 alimento.'; return; }
          refeicoes.push({ nome, horario, itens: itensNovo });
          itensNovo = [];
          paint();
        });
        cont.querySelector('#pl-enviar').addEventListener('click', async () => {
          const msg = cont.querySelector('#pl-msg');
          if (refeicoes.length === 0) { msg.textContent = 'Adicione ao menos uma refeição.'; return; }
          msg.textContent = 'Enviando…';
          try { await Cloud.enviarPlano(uid, refeicoes); msg.textContent = '✅ Plano alimentar enviado! O paciente recebe como refeições prontas.'; }
          catch (e) { msg.textContent = '⚠️ Falha: ' + (e.message || ''); }
        });
      }

      // Busca com autocomplete + preview de porções/gramas, mesmo padrão usado pelo
      // paciente ao registrar refeição (js/views/alimentacao.js) — só que aqui monta o
      // plano do zero em vez de lançar no diário do dia.
      function wireFoodSearch() {
        const searchInput = cont.querySelector('#pl-food-search');
        const resultsBox = cont.querySelector('#pl-food-results');
        const addItemBtn = cont.querySelector('#pl-add-item');
        plSelectedFood = null;

        searchInput.addEventListener('input', () => {
          const q = searchInput.value.trim().toLowerCase();
          plSelectedFood = null;
          addItemBtn.disabled = true;
          cont.querySelector('#pl-selected-food-box').innerHTML = '';
          if (!q) { resultsBox.style.display = 'none'; return; }
          const matches = biblioteca.filter(f => f.name.toLowerCase().includes(q)).slice(0, 8);
          if (matches.length === 0) {
            resultsBox.innerHTML = '<div class="autocomplete-item">Nenhum resultado.</div>';
            resultsBox.style.display = '';
            return;
          }
          resultsBox.innerHTML = matches.map(f => `
            <div class="autocomplete-item" data-id="${f.id}">
              ${Util.escapeHtml(f.name)}
              <div class="meta">${f.kcal} kcal / ${f.portionLabel}</div>
            </div>
          `).join('');
          resultsBox.style.display = '';
          resultsBox.querySelectorAll('[data-id]').forEach(el => {
            el.addEventListener('click', () => selectPlFood(biblioteca.find(f => f.id === el.dataset.id)));
          });
        });

        function selectPlFood(food) {
          plSelectedFood = food;
          searchInput.value = food.name;
          resultsBox.style.display = 'none';
          addItemBtn.disabled = false;
          cont.querySelector('#pl-selected-food-box').innerHTML = `
            <div class="row">
              <div><label>Porções (de ${Util.escapeHtml(food.portionLabel)})</label><input type="number" id="pl-qty-input" value="1" min="0.01" step="0.1"></div>
              <div><label>ou gramas direto</label><input type="number" id="pl-qty-grams-input" value="${food.portionGrams}" min="1" step="1"></div>
            </div>
            <div class="meta" id="pl-qty-preview" style="margin-top:6px;color:var(--text-muted);font-size:0.8rem"></div>
          `;
          const qtyInput = cont.querySelector('#pl-qty-input');
          const gramsInput = cont.querySelector('#pl-qty-grams-input');
          const updatePreview = () => {
            const qty = Number(qtyInput.value) || 0;
            cont.querySelector('#pl-qty-preview').textContent =
              `${(food.kcal * qty).toFixed(0)} kcal · P ${(food.protein * qty).toFixed(1)}g · C ${(food.carbs * qty).toFixed(1)}g · G ${(food.fat * qty).toFixed(1)}g`;
          };
          qtyInput.addEventListener('input', () => {
            gramsInput.value = Math.round((Number(qtyInput.value) || 0) * food.portionGrams * 10) / 10;
            updatePreview();
          });
          gramsInput.addEventListener('input', () => {
            qtyInput.value = Math.round(((Number(gramsInput.value) || 0) / food.portionGrams) * 1000) / 1000;
            updatePreview();
          });
          updatePreview();
        }

        addItemBtn.addEventListener('click', () => {
          if (!plSelectedFood) return;
          const qtyInput = cont.querySelector('#pl-qty-input');
          const qty = Number(qtyInput.value) || 1;
          const item = { foodName: plSelectedFood.name, qty };
          NUTRI.forEach(f => { item[f] = Math.round((plSelectedFood[f] || 0) * qty * 10) / 10; });
          itensNovo.push(item);
          plSelectedFood = null;
          searchInput.value = '';
          addItemBtn.disabled = true;
          cont.querySelector('#pl-selected-food-box').innerHTML = '';
          pintarItens();
        });
      }

      function pintarItens() {
        const wrap = cont.querySelector('#pl-itens');
        if (!wrap) return;
        wrap.innerHTML = itensNovo.length === 0 ? '<p class="meta">Nenhum alimento nesta refeição ainda.</p>' : itensNovo.map((it, i) => `
          <div class="list-item">
            <div class="meta">${Util.escapeHtml(it.foodName)} ${it.qty !== 1 ? `(${it.qty}x)` : ''} · ${Math.round(it.kcal || 0)} kcal</div>
            <button class="link" data-del-item="${i}">✕</button>
          </div>
        `).join('');
        wrap.querySelectorAll('[data-del-item]').forEach(b => b.addEventListener('click', () => { itensNovo.splice(Number(b.dataset.delItem), 1); pintarItens(); }));
      }

      paint();
    }

    // Construtor de plano de treino (A/B/C) pra enviar a um paciente — mesmo padrão do
    // montarPlano (alimentação), mas cada "pacote" vira uma lista de planos com exercícios.
    function montarTreino(uid, presc) {
      const cont = detailEl.querySelector('#admin-treino');
      if (!cont) return;
      const bibliotecaEx = Storage.getAll('exercicios_biblioteca');
      let planosTreino = (presc && Array.isArray(presc.planosTreino))
        ? presc.planosTreino.map(p => ({ ...p, exercises: (p.exercises || []).map(e => ({ ...e })) })) : [];
      let rows = [{ name: '', sets: '', reps: '', weight: '', descanso: '', obs: '' }];

      // Mesma regra de visibilidade do pacote pessoal (Bronyer) usada em Planos de Treino:
      // só o dono do app vê a própria ficha do personal no seletor.
      const souDono = typeof Cloud === 'undefined' || !Cloud.isEnabled()
        || (typeof Cloud.isSuperAdmin === 'function' && Cloud.isSuperAdmin());
      const fontePessoal = typeof PLANO_VICTOR !== 'undefined' ? PLANO_VICTOR.fonte : null;
      const pacotesVisiveis = Object.keys(TREINOS_PREDEFINIDOS).filter(id => souDono || id !== fontePessoal);

      function paint() {
        cont.innerHTML = `
          <div class="card">
            <h3 style="font-size:0.92rem;margin:0 0 8px">🏋️ Plano de treino (A/B/C)</h3>
            <label>Carregar pacote pré-definido (ponto de partida, editável)</label>
            <select id="pt-pack-select">
              ${pacotesVisiveis.map(id => {
                const dieta = DIETA_TEMPLATES.find(d => d.id === id);
                const rotulo = dieta ? `${dieta.nome} — ${TREINOS_PREDEFINIDOS[id].label}` : TREINOS_PREDEFINIDOS[id].label;
                return `<option value="${id}">${Util.escapeHtml(rotulo)}</option>`;
              }).join('')}
            </select>
            <p class="meta" id="pt-pack-desc" style="color:var(--text-muted);font-size:0.78rem"></p>
            <button class="secondary" id="pt-load-pack" style="width:100%;margin-bottom:12px">Carregar pacote como sugestão</button>
            ${planosTreino.length === 0 ? '<p class="meta">Nenhum plano de treino no pacote ainda.</p>' : planosTreino.map((p, i) => `
              <div class="list-item">
                <div>
                  <strong>${Util.escapeHtml(p.nome)}</strong>
                  <div class="meta">${(p.exercises || []).map(e => Util.escapeHtml(e.name)).filter(Boolean).join(', ') || 'sem exercícios'}</div>
                </div>
                <button class="link" data-del-plano-treino="${i}">✕</button>
              </div>
            `).join('')}
            <hr style="border:none;border-top:1px solid var(--border);margin:12px 0">
            <label>Nome do plano</label>
            <input type="text" id="pt-nome" placeholder="Ex: Treino A">
            <datalist id="datalist-exercicios-pt">${bibliotecaEx.map(e => `<option value="${Util.escapeHtml(e.name)}">`).join('')}</datalist>
            <div id="pt-exercicios" style="margin-top:8px"></div>
            <button class="secondary" id="pt-add-exercicio">+ Adicionar exercício</button>
            <button class="secondary" id="pt-add-plano" style="width:100%;margin-top:10px">+ Adicionar plano ao pacote</button>
            <button class="primary" id="pt-enviar" style="margin-top:8px">Enviar treino</button>
            <p class="meta" id="pt-msg" style="margin-top:6px"></p>
          </div>
        `;
        pintarRows();
        cont.querySelectorAll('[data-del-plano-treino]').forEach(b => b.addEventListener('click', () => { planosTreino.splice(Number(b.dataset.delPlanoTreino), 1); paint(); }));

        const packSelect = cont.querySelector('#pt-pack-select');
        const updatePackDesc = () => { cont.querySelector('#pt-pack-desc').textContent = TREINOS_PREDEFINIDOS[packSelect.value].descricao; };
        packSelect.addEventListener('change', updatePackDesc);
        updatePackDesc();
        cont.querySelector('#pt-load-pack').addEventListener('click', () => {
          const pack = TREINOS_PREDEFINIDOS[packSelect.value];
          pack.planos.forEach(p => { planosTreino.push({ nome: p.nome, exercises: p.exercises.map(e => ({ ...e })) }); });
          paint();
        });

        cont.querySelector('#pt-add-exercicio').addEventListener('click', () => {
          syncRows();
          rows.push({ name: '', sets: '', reps: '', weight: '', descanso: '', obs: '' });
          pintarRows();
        });

        cont.querySelector('#pt-add-plano').addEventListener('click', () => {
          syncRows();
          const nome = cont.querySelector('#pt-nome').value.trim();
          const exercises = rows.filter(r => r.name.trim());
          if (!nome || exercises.length === 0) { cont.querySelector('#pt-msg').textContent = 'Dê um nome e adicione ao menos 1 exercício.'; return; }
          planosTreino.push({ nome, exercises });
          rows = [{ name: '', sets: '', reps: '', weight: '', descanso: '', obs: '' }];
          paint();
        });

        cont.querySelector('#pt-enviar').addEventListener('click', async () => {
          const msg = cont.querySelector('#pt-msg');
          if (planosTreino.length === 0) { msg.textContent = 'Adicione ao menos um plano de treino.'; return; }
          msg.textContent = 'Enviando…';
          try { await Cloud.enviarTreino(uid, planosTreino); msg.textContent = '✅ Treino enviado! O paciente recebe como planos prontos.'; }
          catch (e) { msg.textContent = '⚠️ Falha: ' + (e.message || ''); }
        });
      }

      function syncRows() {
        const wrap = cont.querySelector('#pt-exercicios');
        if (!wrap) return;
        const names = wrap.querySelectorAll('.ex-name');
        const sets = wrap.querySelectorAll('.ex-sets');
        const reps = wrap.querySelectorAll('.ex-reps');
        const weights = wrap.querySelectorAll('.ex-weight');
        const descansos = wrap.querySelectorAll('.ex-descanso');
        const obses = wrap.querySelectorAll('.ex-obs');
        rows = rows.map((r, i) => ({
          name: names[i] ? names[i].value : r.name,
          sets: sets[i] ? sets[i].value : r.sets,
          reps: reps[i] ? reps[i].value : r.reps,
          weight: weights[i] ? weights[i].value : r.weight,
          descanso: descansos[i] ? descansos[i].value : r.descanso,
          obs: obses[i] ? obses[i].value : r.obs,
        }));
      }

      function pintarRows() {
        const wrap = cont.querySelector('#pt-exercicios');
        if (!wrap) return;
        wrap.innerHTML = rows.map((r, i) => `
          <div class="exercise-row" data-i="${i}">
            <input type="text" class="ex-name" list="datalist-exercicios-pt" placeholder="Exercício" value="${Util.escapeHtml(r.name)}">
            <input type="number" class="small ex-sets" placeholder="Séries" value="${Util.escapeHtml(r.sets)}">
            <input type="text" class="small ex-reps" placeholder="Reps" value="${Util.escapeHtml(r.reps)}">
            <input type="number" class="small ex-weight" placeholder="Kg" value="${Util.escapeHtml(r.weight)}">
            <input type="text" class="ex-descanso" placeholder="Descanso (ex: 1m30s)" value="${Util.escapeHtml(r.descanso)}" style="flex-basis:100%">
            <input type="text" class="ex-obs" placeholder="Observação" value="${Util.escapeHtml(r.obs)}" style="flex-basis:100%">
            <button class="link" data-remove-row="${i}">✕</button>
          </div>
        `).join('');
        wrap.querySelectorAll('[data-remove-row]').forEach(btn => {
          btn.addEventListener('click', () => {
            syncRows();
            rows.splice(Number(btn.dataset.removeRow), 1);
            if (rows.length === 0) rows.push({ name: '', sets: '', reps: '', weight: '', descanso: '', obs: '' });
            pintarRows();
          });
        });
      }

      paint();
    }
  }

  return { render };
})();
