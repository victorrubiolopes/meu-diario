const ViewAlimentacao = (() => {
  const MEAL_TYPES = ['Café da manhã', 'Almoço', 'Lanche', 'Jantar', 'Outro'];
  const NUTRI_FIELDS = ['kcal', 'carbs', 'sugars', 'protein', 'fat', 'satFat', 'transFat', 'fiber', 'sodium'];

  let selectedFood = null;
  let editingQtyId = null;

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
          ${progressBar('Proteína', totals.protein, meta.protein, 'g')}
          ${progressBar('Carboidrato', totals.carbs, meta.carb, 'g')}
          ${progressBar('Gordura', totals.fat, meta.fat, 'g')}
          ${meta.fiber ? progressBar('Fibras', totals.fiber, meta.fiber, 'g') : ''}
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
          <button class="secondary" id="add-agua-200">+200ml</button>
          <button class="secondary" id="add-agua-500">+500ml</button>
          <div class="row" style="flex:1">
            <input type="number" id="agua-custom" placeholder="ml">
            <button class="secondary" id="add-agua-custom" style="flex:0 0 auto">+</button>
          </div>
        </div>
        <div class="row" style="margin-top:8px">
          <button class="secondary" id="sub-agua-200">-200ml</button>
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
                ${MEAL_TYPES.map(t => `<option value="${t}">${t}</option>`).join('')}
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
          ${MEAL_TYPES.map(t => `<option value="${t}">${t}</option>`).join('')}
        </select>
        <label>Alimento</label>
        <div class="autocomplete-wrap">
          <input type="text" id="food-search" placeholder="Buscar na biblioteca..." autocomplete="off">
          <div class="autocomplete-list" id="food-results" style="display:none"></div>
        </div>
        <div id="selected-food-box"></div>
        <button class="primary" id="add-meal" disabled>Adicionar</button>
        <button class="secondary" style="margin-top:8px" id="go-biblioteca">+ Gerenciar biblioteca de alimentos</button>
        <button class="secondary" style="margin-top:8px" id="go-combos">+ Gerenciar combos de refeição</button>
      </div>
      <div class="card">
        <h2>Refeições do dia</h2>
        <div id="meal-list">
          ${entries.length === 0 ? '<div class="empty">Nenhuma refeição registrada ainda</div>' : renderMealList(entries)}
        </div>
      </div>
    `;

    if (combos.length > 0) {
      document.getElementById('add-combo').addEventListener('click', () => {
        const combo = combos.find(c => c.id === document.getElementById('combo-select').value);
        const mealType = document.getElementById('combo-meal-type').value;
        if (!combo) return;
        combo.itens.forEach(item => {
          Storage.add('alimentacao', { date: state.date, mealType, foodName: item.foodName, qty: item.qty, order: Date.now(), ...Object.fromEntries(NUTRI_FIELDS.map(f => [f, item[f] || 0])) });
        });
        api.render();
      });
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
    document.getElementById('add-agua-200').addEventListener('click', () => addAgua(200));
    document.getElementById('add-agua-500').addEventListener('click', () => addAgua(500));
    document.getElementById('sub-agua-200').addEventListener('click', () => addAgua(-200));
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

    addBtn.addEventListener('click', () => {
      if (!selectedFood) return;
      const qty = Number(document.getElementById('qty-input').value) || 1;
      const mealType = document.getElementById('meal-type').value;
      const entry = { date: state.date, mealType, foodName: selectedFood.name, qty, order: Date.now() };
      NUTRI_FIELDS.forEach(f => {
        entry[f] = Math.round((selectedFood[f] || 0) * qty * 10) / 10;
      });
      Storage.add('alimentacao', entry);
      api.render();
    });

    $app.querySelectorAll('[data-remove]').forEach(btn => {
      btn.addEventListener('click', () => {
        Storage.remove('alimentacao', btn.dataset.remove);
        api.render();
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

  function renderMealList(entries) {
    const lib = Storage.getAll('alimentos_biblioteca');
    const groups = {};
    entries.forEach(e => {
      groups[e.mealType] = groups[e.mealType] || [];
      groups[e.mealType].push(e);
    });
    return Object.keys(groups).map(type => `
      <div style="margin-bottom:10px">
        <div class="row" style="align-items:center;justify-content:space-between">
          <strong>${Util.escapeHtml(type)}</strong>
          <button class="secondary" data-savecombo="${Util.escapeHtml(type)}" style="flex:0 0 auto;font-size:0.75rem;padding:6px 10px">💾 Salvar como combo</button>
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
    `).join('');
  }

  return { render };
})();
