const ViewAlimentacao = (() => {
  const MEAL_TYPES = ['Café da manhã', 'Almoço', 'Lanche', 'Jantar', 'Outro'];
  const NUTRI_FIELDS = ['kcal', 'carbs', 'sugars', 'protein', 'fat', 'satFat', 'transFat', 'fiber', 'sodium'];

  let selectedFood = null;
  let editingQtyId = null;
  let expandedMacro = null;
  // Lembra o último tipo de refeição escolhido, pra não voltar sempre pro padrão (Café da manhã).
  let ultimoMealType = null;
  // Itens escolhidos mas ainda não salvos — permite adicionar vários alimentos e salvar tudo de uma vez.
  let carrinho = [];
  // Incrementado só pelo botão "Ver outras opções" da sugestão de refeições.
  let sugestaoSeed = 0;
  const CATEGORIA_LABELS = { proteina: 'proteína', carboidrato: 'carboidrato', fruta: 'fruta', legume: 'legume/verdura', outro: 'extra' };

  function sumNutrients(entries) {
    const totals = { kcal: 0, carbs: 0, protein: 0, fat: 0, fiber: 0, sodium: 0 };
    entries.forEach(e => {
      totals.kcal += e.kcal || 0;
      totals.carbs += e.carbs || 0;
      totals.protein += e.protein || 0;
      totals.fat += e.fat || 0;
      totals.fiber += e.fiber || 0;
      totals.sodium += e.sodium || 0;
    });
    return totals;
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

  function macroBreakdown(entries, macroKey) {
    const byFood = {};
    entries.forEach(e => {
      const val = e[macroKey] || 0;
      if (val <= 0) return;
      byFood[e.foodName] = (byFood[e.foodName] || 0) + val;
    });
    return Object.entries(byFood)
      .map(([foodName, val]) => ({ foodName, val }))
      .sort((a, b) => b.val - a.val);
  }

  function macroVisual(totals, meta, entries) {
    const carbKcalReal = totals.carbs * 4;
    const fatKcalReal = totals.fat * 9;
    const proteinKcalReal = totals.protein * 4;
    const totalReal = carbKcalReal + fatKcalReal + proteinKcalReal;
    const realPct = {
      carbs: totalReal > 0 ? Math.round((carbKcalReal / totalReal) * 100) : 0,
      fat: totalReal > 0 ? Math.round((fatKcalReal / totalReal) * 100) : 0,
      protein: totalReal > 0 ? Math.round((proteinKcalReal / totalReal) * 100) : 0,
    };

    const carbKcalMeta = (meta.carb || 0) * 4;
    const fatKcalMeta = (meta.fat || 0) * 9;
    const proteinKcalMeta = (meta.protein || 0) * 4;
    const totalMetaKcal = carbKcalMeta + fatKcalMeta + proteinKcalMeta;
    const metaPct = {
      carbs: totalMetaKcal > 0 ? Math.round((carbKcalMeta / totalMetaKcal) * 100) : 0,
      fat: totalMetaKcal > 0 ? Math.round((fatKcalMeta / totalMetaKcal) * 100) : 0,
      protein: totalMetaKcal > 0 ? Math.round((proteinKcalMeta / totalMetaKcal) * 100) : 0,
    };

    const fiberPct = meta.fiber ? Math.min(100, Math.round((totals.fiber / meta.fiber) * 100)) : null;
    const pctDaMeta = (val, alvo) => alvo ? Math.min(100, Math.round((val / alvo) * 100)) : null;

    const boxes = [
      { label: 'Carboidr.', val: totals.carbs, meta: meta.carb, color: 'var(--macro-carb)', pct: pctDaMeta(totals.carbs, meta.carb) },
      { label: 'Gord.', val: totals.fat, meta: meta.fat, color: 'var(--macro-fat)', pct: pctDaMeta(totals.fat, meta.fat) },
      { label: 'Proteína', val: totals.protein, meta: meta.protein, color: 'var(--macro-protein)', pct: pctDaMeta(totals.protein, meta.protein) },
    ];

    const infoAberto = expandedMacro === 'info';
    const macrosParaDetalhe = [
      { key: 'protein', label: 'Proteína' },
      { key: 'carbs', label: 'Carboidrato' },
      { key: 'fat', label: 'Gordura' },
      { key: 'fiber', label: 'Fibra' },
    ];

    return `
      <div class="macro-box-row">
        ${boxes.map(b => `
          <div class="macro-box" style="--mc:${b.color}">
            <div class="macro-box-lbl">${b.label}</div>
            <div class="macro-box-val">${b.val.toFixed(1)}<span>g</span></div>
            ${b.pct != null ? `<div class="macro-box-pct">${b.pct}% <span class="macro-box-meta">de ${Math.round(b.meta)}g</span></div>` : ''}
          </div>
        `).join('')}
        ${meta.fiber ? `
          <div class="macro-box" style="--mc:var(--macro-fiber)">
            <div class="macro-box-lbl">Fibra</div>
            <div class="macro-box-val">${totals.fiber.toFixed(1)}<span>g</span></div>
            <div class="macro-box-pct">${fiberPct}% <span class="macro-box-meta">de ${Math.round(meta.fiber)}g</span></div>
          </div>
        ` : ''}
      </div>

      <div class="macro-split-row">
        <span style="color:var(--macro-carb)">${realPct.carbs}%</span>
        <span style="color:var(--macro-fat)">${realPct.fat}%</span>
        <span style="color:var(--macro-protein)">${realPct.protein}%</span>
      </div>
      <div class="macro-split-bar">
        <div style="width:${realPct.carbs}%;background:var(--macro-carb)"></div>
        <div style="width:${realPct.fat}%;background:var(--macro-fat)"></div>
        <div style="width:${realPct.protein}%;background:var(--macro-protein)"></div>
      </div>
      <div class="macro-split-caption">Real</div>

      <div class="macro-split-bar macro-split-bar-thin">
        <div style="width:${metaPct.carbs}%;background:var(--macro-carb)"></div>
        <div style="width:${metaPct.fat}%;background:var(--macro-fat)"></div>
        <div style="width:${metaPct.protein}%;background:var(--macro-protein)"></div>
      </div>
      <div class="macro-split-row">
        <span style="color:var(--macro-carb)">${metaPct.carbs}%</span>
        <span style="color:var(--macro-fat)">${metaPct.fat}%</span>
        <span style="color:var(--macro-protein)">${metaPct.protein}%</span>
      </div>
      <div class="macro-split-caption">Recomendados</div>

      <button type="button" class="macro-info-toggle" data-toggle-info-nutric>
        <span>Infor. nutric.</span><span class="chev">${infoAberto ? '⌄' : '›'}</span>
      </button>
      ${infoAberto ? `
        <div class="macro-info-detail">
          ${macrosParaDetalhe.map(m => {
            const itens = macroBreakdown(entries, m.key);
            if (itens.length === 0) return '';
            const totalM = itens.reduce((s, i) => s + i.val, 0);
            return `
              <div class="macro-info-group">
                <div class="macro-info-group-title">${m.label}</div>
                ${itens.map(it => `
                  <div class="meta" style="display:flex;justify-content:space-between;font-size:0.75rem;padding:2px 0">
                    <span>${Util.escapeHtml(it.foodName)}</span>
                    <span>${it.val.toFixed(1)}g (${totalM ? Math.round((it.val / totalM) * 100) : 0}%)</span>
                  </div>
                `).join('')}
              </div>
            `;
          }).join('') || '<p class="empty" style="font-size:0.8rem">Nenhum alimento registrado ainda hoje.</p>'}
        </div>
      ` : ''}
    `;
  }

  function render($app, state, api) {
    const perfil = Storage.getPerfil();
    const meta = calcularMetas(perfil);
    const entries = Storage.getByDate('alimentacao', state.date).sort((a, b) => (a.order || 0) - (b.order || 0));
    const totals = sumNutrients(entries);

    let metaBlock = '';
    if (!meta) {
      metaBlock = `
        <div class="card">
          <p class="empty">Complete seu perfil (peso, altura, idade, sexo) para calcular sua meta de calorias e macros.</p>
          <button class="secondary" id="go-perfil">Completar perfil</button>
        </div>
      `;
    } else {
      const temTdee = meta.tdee != null;
      const ajusteDesejado = temTdee ? meta.kcal - meta.tdee : null;
      const ajusteReal = temTdee ? meta.tdee - totals.kcal : null;
      const labelDesejado = ajusteDesejado <= 0 ? 'Déficit desejado' : 'Superávit desejado';
      const labelReal = ajusteReal >= 0 ? 'Déficit hoje' : 'Superávit hoje';
      metaBlock = `
        <div class="card">
          <div class="kcal-summary">
            <div><div class="num">${totals.kcal.toFixed(0)}</div><div class="lbl">Consumido</div></div>
            <div><div class="num">${meta.kcal}</div><div class="lbl">Meta</div></div>
            <div><div class="num">${(meta.kcal - totals.kcal).toFixed(0)}</div><div class="lbl">${meta.kcal - totals.kcal >= 0 ? 'Restante' : 'Excedeu'}</div></div>
          </div>
          ${macroVisual(totals, meta, entries)}
          ${temTdee ? `
          <div class="row" style="margin-top:10px">
            <div class="card" style="margin:0;padding:10px;text-align:center">
              <div class="lbl" style="font-size:0.72rem;color:var(--text-muted)">${labelDesejado}</div>
              <strong>${Math.abs(ajusteDesejado).toFixed(0)} kcal</strong>
            </div>
            <div class="card" style="margin:0;padding:10px;text-align:center">
              <div class="lbl" style="font-size:0.72rem;color:var(--text-muted)">${labelReal}</div>
              <strong>${Math.abs(ajusteReal).toFixed(0)} kcal</strong>
            </div>
          </div>
          ` : `
          <p class="meta" style="margin-top:10px;color:var(--text-muted);font-size:0.78rem">Preencha altura, idade, sexo e nível de atividade no Perfil para ver o déficit/superávit real em relação ao seu gasto (TDEE).</p>
          `}
          ${(() => {
            const strategy = MEAL_STRATEGIES.find(m => m.id === perfil.mealStrategy);
            return strategy ? `<p class="meta" style="margin-top:10px;color:var(--text-muted);font-size:0.78rem">${strategy.nome}: ${strategy.dica}</p>` : '';
          })()}
          ${(() => {
            const n = perfil.numRefeicoes || 5;
            return `<p class="meta" style="color:var(--text-muted);font-size:0.78rem">Dividido em ${n} refeições: ~${Math.round(meta.kcal / n)} kcal · P ${Math.round(meta.protein / n)}g · C ${Math.round(meta.carb / n)}g · G ${Math.round(meta.fat / n)}g por refeição</p>`;
          })()}
        </div>
      `;
    }

    const combos = Storage.getAll('combos');
    const aguaMeta = calcularMetaAgua(perfil);
    const aguaEntradas = Storage.getByDate('agua', state.date).sort((a, b) => (a.order || 0) - (b.order || 0));
    const aguaConsumida = aguaEntradas.reduce((s, a) => s + a.ml, 0);

    $app.innerHTML = `
      ${metaBlock}
      <div class="card">
        <h2>Água</h2>
        ${progressBar('Consumida', aguaConsumida, aguaMeta, 'ml')}
        <div class="row">
          <button class="secondary" id="add-agua-250">+250ml</button>
          <button class="secondary" id="add-agua-500">+500ml</button>
          <button class="secondary" id="add-agua-1500">+1500ml</button>
        </div>
        <div class="row" style="margin-top:8px">
          <input type="number" id="agua-custom" placeholder="ml">
          <button class="secondary" id="add-agua-custom" style="flex:0 0 auto">+</button>
        </div>
        ${aguaEntradas.length > 0 ? `
          <div style="margin-top:10px">
            ${aguaEntradas.map(a => `
              <div class="list-item" data-id="${a.id}">
                <div>${a.ml}ml</div>
                <button class="link" data-remove-agua="${a.id}">✕</button>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
      ${(!perfil.dietaCustomId && meta) ? renderSugestaoRefeicoes(state.date, meta) : ''}
      ${combos.length > 0 ? `
        <div class="card">
          <h2>Usar combo salvo</h2>
          <div class="row">
            <div style="flex:2">
              <select id="combo-select">
                ${combos.map(c => `<option value="${c.id}">${Util.escapeHtml(c.nome)}</option>`).join('')}
              </select>
            </div>
            <div style="flex:1">
              <select id="combo-meal-type">
                ${MEAL_TYPES.map(t => `<option value="${t}" ${t === (ultimoMealType || MEAL_TYPES[0]) ? 'selected' : ''}>${t}</option>`).join('')}
              </select>
            </div>
          </div>
          <button class="secondary" id="add-combo" style="margin-top:10px">Adicionar combo</button>
        </div>
      ` : ''}
      <div class="card">
        <h2>Adicionar refeição</h2>
        <label>Tipo</label>
        <select id="meal-type">
          ${MEAL_TYPES.map(t => `<option value="${t}" ${t === (ultimoMealType || MEAL_TYPES[0]) ? 'selected' : ''}>${t}</option>`).join('')}
        </select>
        <label>Alimento</label>
        <div class="autocomplete-wrap">
          <input type="text" id="food-search" placeholder="Buscar na biblioteca..." autocomplete="off">
          <div class="autocomplete-list" id="food-results" style="display:none"></div>
        </div>
        <div id="selected-food-box"></div>
        <button class="primary" id="add-meal" disabled>+ Adicionar à lista</button>
        ${carrinho.length > 0 ? `
          <div class="card" style="margin:12px 0 0;padding:10px 14px;background:var(--bg)">
            <p class="meta" style="font-weight:600;margin-bottom:6px">Prontos pra salvar (${carrinho.length})</p>
            ${carrinho.map((it, i) => `
              <div class="list-item">
                <div>
                  <strong>${Util.escapeHtml(it.foodName)}</strong>
                  <div class="meta">${it.qty}x — ${it.kcal.toFixed(0)} kcal</div>
                </div>
                <button class="link" data-remove-carrinho="${i}" aria-label="Remover">✕</button>
              </div>
            `).join('')}
            <button class="primary" id="salvar-carrinho" style="width:100%;margin-top:8px">✅ Adicionar tudo (${carrinho.length})</button>
          </div>
        ` : ''}
        <button class="secondary" style="margin-top:8px" id="go-biblioteca">+ Gerenciar biblioteca de alimentos</button>
        <button class="secondary" style="margin-top:8px" id="go-combos">+ Gerenciar combos de refeição</button>
      </div>
      <div class="card">
        <h2>Refeições do dia</h2>
        <div id="meal-list">
          ${entries.length === 0 ? '<div class="empty">Nenhuma refeição registrada ainda</div>' : renderMealList(entries, state.date)}
        </div>
      </div>
      <input type="file" id="meal-photo-input" accept="image/*" capture="environment" style="display:none">
    `;

    const shuffleSugestaoBtn = document.getElementById('shuffle-sugestao');
    if (shuffleSugestaoBtn) {
      shuffleSugestaoBtn.addEventListener('click', () => { sugestaoSeed++; api.render(); });
    }
    $app.querySelectorAll('[data-add-sugestao-food]').forEach(btn => {
      btn.addEventListener('click', () => {
        const mealType = btn.dataset.addSugestaoMeal;
        const qty = Number(btn.dataset.addSugestaoQty) || 1;
        const food = Storage.getAll('alimentos_biblioteca').find(f => f.id === btn.dataset.addSugestaoFood);
        if (!food) return;
        ultimoMealType = mealType;
        Storage.add('alimentacao', { date: state.date, mealType, foodName: food.name, qty, order: Date.now(), ...Object.fromEntries(NUTRI_FIELDS.map(f => [f, Math.round((food[f] || 0) * qty * 10) / 10])) });
        api.render();
      });
    });

    if (combos.length > 0) {
      document.getElementById('add-combo').addEventListener('click', () => {
        const combo = combos.find(c => c.id === document.getElementById('combo-select').value);
        const mealType = document.getElementById('combo-meal-type').value;
        if (!combo) return;
        ultimoMealType = mealType;
        combo.itens.forEach(item => {
          Storage.add('alimentacao', { date: state.date, mealType, foodName: item.foodName, qty: item.qty, order: Date.now(), ...Object.fromEntries(NUTRI_FIELDS.map(f => [f, item[f] || 0])) });
        });
        api.render();
      });
      document.getElementById('combo-meal-type').addEventListener('change', e => { ultimoMealType = e.target.value; });
    }

    document.getElementById('go-combos').addEventListener('click', () => {
      state.tab = 'mais';
      api.goToMais('combos');
    });

    function addAgua(ml) {
      if (!ml) return;
      Storage.add('agua', { date: state.date, ml, order: Date.now() });
      api.render();
    }
    document.getElementById('add-agua-250').addEventListener('click', () => addAgua(250));
    document.getElementById('add-agua-500').addEventListener('click', () => addAgua(500));
    document.getElementById('add-agua-1500').addEventListener('click', () => addAgua(1500));
    document.getElementById('add-agua-custom').addEventListener('click', () => {
      addAgua(Number(document.getElementById('agua-custom').value));
    });
    $app.querySelectorAll('[data-remove-agua]').forEach(btn => {
      btn.addEventListener('click', () => {
        Storage.remove('agua', btn.dataset.removeAgua);
        api.render();
      });
    });

    if (document.getElementById('go-perfil')) {
      document.getElementById('go-perfil').addEventListener('click', () => {
        state.tab = 'mais';
        api.goToMais('perfil');
      });
    }
    const infoNutricBtn = $app.querySelector('[data-toggle-info-nutric]');
    if (infoNutricBtn) {
      infoNutricBtn.addEventListener('click', () => {
        expandedMacro = expandedMacro === 'info' ? null : 'info';
        api.render();
      });
    }
    document.getElementById('go-biblioteca').addEventListener('click', () => {
      state.tab = 'mais';
      api.goToMais('biblioteca-alimentos');
    });

    const searchInput = document.getElementById('food-search');
    const resultsBox = document.getElementById('food-results');
    const addBtn = document.getElementById('add-meal');
    selectedFood = null;

    searchInput.addEventListener('input', () => {
      const q = searchInput.value.trim().toLowerCase();
      selectedFood = null;
      addBtn.disabled = true;
      document.getElementById('selected-food-box').innerHTML = '';
      if (!q) { resultsBox.style.display = 'none'; return; }
      const lib = Storage.getAll('alimentos_biblioteca');
      const matches = lib.filter(f => f.name.toLowerCase().includes(q)).slice(0, 8);
      if (matches.length === 0) {
        resultsBox.innerHTML = `<div class="autocomplete-item">Nenhum resultado. <span class="meta">Adicione na biblioteca.</span></div>`;
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
        el.addEventListener('click', () => selectFood(lib.find(f => f.id === el.dataset.id)));
      });
    });

    function selectFood(food) {
      selectedFood = food;
      searchInput.value = food.name;
      resultsBox.style.display = 'none';
      addBtn.disabled = false;
      document.getElementById('selected-food-box').innerHTML = `
        <div class="row">
          <div>
            <label>Porções (de ${Util.escapeHtml(food.portionLabel)})</label>
            <input type="number" id="qty-input" value="1" min="0.01" step="0.1">
          </div>
          <div>
            <label>ou gramas direto</label>
            <input type="number" id="qty-grams-input" value="${food.portionGrams}" min="1" step="1">
          </div>
        </div>
        <div class="meta" id="qty-preview" style="margin-top:6px;color:var(--text-muted);font-size:0.8rem"></div>
      `;
      const qtyInput = document.getElementById('qty-input');
      const gramsInput = document.getElementById('qty-grams-input');
      const updatePreview = () => {
        const qty = Number(qtyInput.value) || 0;
        document.getElementById('qty-preview').textContent =
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

    document.getElementById('meal-type').addEventListener('change', e => { ultimoMealType = e.target.value; });

    addBtn.addEventListener('click', () => {
      if (!selectedFood) return;
      const qty = Number(document.getElementById('qty-input').value) || 1;
      const item = { foodName: selectedFood.name, qty };
      NUTRI_FIELDS.forEach(f => {
        item[f] = Math.round((selectedFood[f] || 0) * qty * 10) / 10;
      });
      carrinho.push(item);
      selectedFood = null;
      api.render();
    });

    $app.querySelectorAll('[data-remove-carrinho]').forEach(btn => {
      btn.addEventListener('click', () => {
        carrinho.splice(Number(btn.dataset.removeCarrinho), 1);
        api.render();
      });
    });

    const salvarCarrinhoBtn = document.getElementById('salvar-carrinho');
    if (salvarCarrinhoBtn) {
      salvarCarrinhoBtn.addEventListener('click', () => {
        const mealType = document.getElementById('meal-type').value;
        ultimoMealType = mealType;
        carrinho.forEach(item => {
          Storage.add('alimentacao', { date: state.date, mealType, order: Date.now(), ...item });
        });
        carrinho = [];
        api.render();
      });
    }

    $app.querySelectorAll('[data-remove]').forEach(btn => {
      btn.addEventListener('click', () => {
        Storage.remove('alimentacao', btn.dataset.remove);
        api.render();
      });
    });

    let pendingPhotoMealType = null;
    const mealPhotoInput = document.getElementById('meal-photo-input');
    if (mealPhotoInput) {
      mealPhotoInput.addEventListener('change', async () => {
        const file = mealPhotoInput.files[0];
        mealPhotoInput.value = '';
        if (!file || !pendingPhotoMealType) return;
        // Comprime e guarda como registro próprio por data+tipo de refeição (não por
        // ingrediente) — sincroniza na nuvem, não fica só no IndexedDB local, senão o
        // nutri nunca conseguiria ver a foto do prato de outro aparelho.
        const fotoDataURL = await Util.compressImageToDataURL(file);
        const existente = fotoRefeicaoDe(state.date, pendingPhotoMealType);
        if (existente) Storage.update('refeicao_fotos', existente.id, { fotoDataURL });
        else Storage.add('refeicao_fotos', { date: state.date, mealType: pendingPhotoMealType, fotoDataURL });
        pendingPhotoMealType = null;
        api.render();
      });
    }
    $app.querySelectorAll('[data-attach-meal-photo]').forEach(el => {
      el.addEventListener('click', () => {
        const tipo = el.dataset.attachMealPhoto;
        const existente = fotoRefeicaoDe(state.date, tipo);
        if (existente) {
          if (confirm('Remover a foto do prato desta refeição? (toque em Cancelar pra trocar por outra foto)')) {
            Storage.remove('refeicao_fotos', existente.id);
            api.render();
            return;
          }
        }
        pendingPhotoMealType = tipo;
        mealPhotoInput.click();
      });
    });

    $app.querySelectorAll('[data-editqty]').forEach(btn => {
      btn.addEventListener('click', () => {
        editingQtyId = btn.dataset.editqty;
        api.render();
      });
    });

    $app.querySelectorAll('[data-cancelqty]').forEach(btn => {
      btn.addEventListener('click', () => {
        editingQtyId = null;
        api.render();
      });
    });

    $app.querySelectorAll('[data-saveqty]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.saveqty;
        const entry = entries.find(e => e.id === id);
        if (!entry) return;
        const oldQty = entry.qty || 1;
        const newQty = Number(document.getElementById(`editqty-porcoes-${id}`).value);
        if (!newQty || newQty <= 0) return;
        const factor = newQty / oldQty;
        const data = { qty: newQty };
        NUTRI_FIELDS.forEach(f => { data[f] = Math.round((entry[f] || 0) * factor * 10) / 10; });
        Storage.update('alimentacao', entry.id, data);
        editingQtyId = null;
        api.render();
      });
    });

    if (editingQtyId) {
      const editEntry = entries.find(e => e.id === editingQtyId);
      if (editEntry) {
        const lib = Storage.getAll('alimentos_biblioteca');
        const doLib = lib.find(f => f.name.trim().toLowerCase() === editEntry.foodName.trim().toLowerCase());
        const portionGrams = doLib ? doLib.portionGrams : null;
        const porcoesInput = document.getElementById(`editqty-porcoes-${editingQtyId}`);
        const gramasInput = document.getElementById(`editqty-gramas-${editingQtyId}`);
        if (porcoesInput && gramasInput && portionGrams) {
          porcoesInput.addEventListener('input', () => {
            gramasInput.value = Math.round((Number(porcoesInput.value) || 0) * portionGrams * 10) / 10;
          });
          gramasInput.addEventListener('input', () => {
            porcoesInput.value = Math.round(((Number(gramasInput.value) || 0) / portionGrams) * 1000) / 1000;
          });
        }
      }
    }

    $app.querySelectorAll('[data-savecombo]').forEach(btn => {
      btn.addEventListener('click', () => {
        const mealType = btn.dataset.savecombo;
        const nome = prompt('Nome do combo:', mealType);
        if (!nome) return;
        const itens = entries.filter(e => e.mealType === mealType).map(e => {
          const item = { foodName: e.foodName, qty: e.qty };
          NUTRI_FIELDS.forEach(f => { item[f] = e[f] || 0; });
          return item;
        });
        if (itens.length === 0) return;
        Storage.add('combos', { nome, itens });
        api.render();
      });
    });
  }

  function fotoRefeicaoDe(date, mealType) {
    return Storage.getAll('refeicao_fotos').find(f => f.date === date && f.mealType === mealType) || null;
  }

  function renderSugestaoRefeicoes(date, meta) {
    const sugestao = sugerirRefeicoesDoDia(date, sugestaoSeed, meta);
    const totalDia = Object.values(sugestao).flat().reduce((s, i) => s + i.food.kcal * i.qty, 0);
    return `
      <div class="card">
        <div class="row" style="align-items:center;justify-content:space-between">
          <h2>Sugestão de refeições</h2>
          <button class="link" id="shuffle-sugestao">🔄 Ver outras opções</button>
        </div>
        <p class="meta" style="color:var(--text-muted);font-size:0.78rem">Sem dieta específica cadastrada — sugestão baseada no método do prato, com alimentos da sua biblioteca${meta && meta.kcal ? `, ajustada pra ficar perto da sua meta de ${meta.kcal} kcal/dia (hoje: ~${totalDia.toFixed(0)} kcal)` : ''}.</p>
        ${Object.entries(sugestao).map(([mealType, itens]) => `
          <div style="margin-top:12px">
            <div class="row" style="justify-content:space-between;align-items:baseline">
              <strong>${mealType}</strong>
              <span class="meta">${itens.reduce((s, i) => s + i.food.kcal * i.qty, 0).toFixed(0)} kcal (aprox.)</span>
            </div>
            ${itens.length === 0
              ? '<p class="empty" style="font-size:0.78rem">Sem alimentos categorizados suficientes na sua biblioteca.</p>'
              : itens.map(it => {
                  const gramas = it.food.portionGrams ? Math.round(it.food.portionGrams * it.qty) : null;
                  return `
                <div class="list-item">
                  <div>
                    <div>${Util.escapeHtml(it.food.name)} <span class="meta">(${CATEGORIA_LABELS[it.categoria]})</span></div>
                    <div class="meta">${gramas != null ? `${gramas}g` : `${it.food.portionLabel} × ${it.qty}`} · ${(it.food.kcal * it.qty).toFixed(0)} kcal</div>
                  </div>
                  <button class="link" data-add-sugestao-meal="${Util.escapeHtml(mealType)}" data-add-sugestao-food="${it.food.id}" data-add-sugestao-qty="${it.qty}" aria-label="Adicionar">+</button>
                </div>
              `;
                }).join('')}
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderMealList(entries, date) {
    const lib = Storage.getAll('alimentos_biblioteca');
    const groups = {};
    entries.forEach(e => {
      groups[e.mealType] = groups[e.mealType] || [];
      groups[e.mealType].push(e);
    });
    return Object.keys(groups).map(type => {
      const fotoRef = fotoRefeicaoDe(date, type);
      return `
      <div style="margin-bottom:10px">
        <div class="row" style="align-items:center;justify-content:space-between">
          <strong>${Util.escapeHtml(type)}</strong>
          <button class="secondary" data-savecombo="${Util.escapeHtml(type)}" style="flex:0 0 auto;font-size:0.75rem;padding:6px 10px">💾 Salvar como combo</button>
        </div>
        <div class="row" style="align-items:center;margin:6px 0">
          ${fotoRef ? `<img src="${fotoRef.fotoDataURL}" data-attach-meal-photo="${Util.escapeHtml(type)}" class="meal-thumb" alt="Foto do prato">` : ''}
          <button class="link" data-attach-meal-photo="${Util.escapeHtml(type)}" style="font-size:0.78rem">${fotoRef ? '✎ Trocar/remover foto do prato' : '📷 Foto do prato'}</button>
        </div>
        ${groups[type].map(e => {
          if (e.id !== editingQtyId) {
            return `
              <div class="list-item" data-id="${e.id}">
                <div>
                  <div>${Util.escapeHtml(e.foodName)} ${e.qty !== 1 ? `<span class="meta">(${e.qty}x)</span>` : ''}</div>
                  <div class="meta">${e.kcal} kcal · P ${e.protein}g · C ${e.carbs}g · G ${e.fat}g</div>
                </div>
                <div style="display:flex;gap:6px">
                  <button class="link" data-editqty="${e.id}">✎</button>
                  <button class="link" data-remove="${e.id}">✕</button>
                </div>
              </div>
            `;
          }
          const doLib = lib.find(f => f.name.trim().toLowerCase() === e.foodName.trim().toLowerCase());
          const portionGrams = doLib ? doLib.portionGrams : null;
          const gramsValue = portionGrams ? Math.round(e.qty * portionGrams * 10) / 10 : '';
          return `
            <div class="list-item" data-id="${e.id}" style="flex-direction:column;align-items:stretch">
              <div style="font-weight:600">${Util.escapeHtml(e.foodName)}</div>
              <div class="row" style="margin-top:6px">
                <div>
                  <label style="font-size:0.75rem">Porções</label>
                  <input type="number" id="editqty-porcoes-${e.id}" value="${e.qty}" min="0.01" step="0.01">
                </div>
                <div>
                  <label style="font-size:0.75rem">Gramas${!portionGrams ? ' (indisponível p/ este item)' : ''}</label>
                  <input type="number" id="editqty-gramas-${e.id}" value="${gramsValue}" min="1" step="1" ${!portionGrams ? 'disabled' : ''}>
                </div>
              </div>
              <div class="row" style="margin-top:8px">
                <button class="primary" data-saveqty="${e.id}" style="flex:1">Salvar</button>
                <button class="secondary" data-cancelqty="${e.id}" style="flex:1">Cancelar</button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
    }).join('');
  }

  return { render };
})();
