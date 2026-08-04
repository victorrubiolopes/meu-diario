const ViewMedidas = (() => {
  const FIELDS = [
    { key: 'weight', label: 'Peso (kg)' },
    { key: 'waist', label: 'Cintura (cm)' },
    { key: 'abdomen', label: 'Abdômen (cm)' },
    { key: 'chest', label: 'Peito (cm)' },
    { key: 'hip', label: 'Quadril (cm)' },
    { key: 'arm', label: 'Braço (cm)' },
    { key: 'thigh', label: 'Coxa (cm)' },
    { key: 'bodyFat', label: '% Gordura corporal' },
    { key: 'leanMass', label: 'Massa magra (kg) — opcional' },
  ];

  function pares(arr) {
    const chunks = [];
    for (let i = 0; i < arr.length; i += 2) chunks.push(arr.slice(i, i + 2));
    return chunks;
  }

  // Uma linha de "Sua composição corporal" / "Análise corporal": rótulo, valor + variação desde
  // a medição anterior, barra posicionada numa faixa de referência e os limites dela embaixo.
  function comp2RowHtml(label, valor, unidade, casas, delta, faixa) {
    if (valor == null) {
      return `<div class="comp2-row"><div class="comp2-label">${label}</div><p class="empty" style="margin:0">Sem dado suficiente</p></div>`;
    }
    let pct = 50;
    if (faixa) {
      const trackMin = faixa.min * 0.75;
      const trackMax = faixa.max * 1.35;
      pct = Math.max(4, Math.min(100, ((valor - trackMin) / (trackMax - trackMin)) * 100));
    }
    const deltaTxt = delta != null ? `${delta > 0 ? '+' : ''}${delta.toFixed(casas)}` : '';
    return `
      <div class="comp2-row">
        <div class="comp2-label">${label}</div>
        <div class="comp2-value-row">
          <div class="comp2-value"><strong>${valor.toFixed(casas)}</strong><span class="comp2-unit">${unidade}</span></div>
          ${deltaTxt ? `<div class="comp2-delta">${deltaTxt}</div>` : ''}
        </div>
        <div class="comp-track"><div class="comp-fill" style="width:${pct}%"></div><div class="comp-marker" style="left:${pct}%"></div></div>
        ${faixa ? `<div class="comp2-range"><span>${faixa.min.toFixed(1)}</span><span>${faixa.max.toFixed(1)}</span></div>` : ''}
      </div>
    `;
  }

  function composicaoHtml() {
    const perfil = Storage.getPerfil();
    const ordenadas = Storage.getAll('medidas').filter(m => m.weight != null).sort((a, b) => b.date.localeCompare(a.date));
    const atual = ordenadas[0];
    if (!atual) return '';
    const anterior = ordenadas[1];
    const cAtual = Util.metricasComposicao(atual);
    const cAnterior = Util.metricasComposicao(anterior);
    const delta = (a, b) => (a != null && b != null ? a - b : null);

    const alturaM = perfil.altura ? perfil.altura / 100 : null;
    const imcAtual = alturaM ? cAtual.peso / (alturaM * alturaM) : null;
    const imcAnterior = alturaM && cAnterior ? cAnterior.peso / (alturaM * alturaM) : null;

    const faixaPeso = Util.faixaPesoSaudavel(perfil.altura);
    const faixaMagraPct = Util.faixaMassaMagraSaudavel(perfil.sexo);
    const faixaMagraKg = { min: cAtual.peso * faixaMagraPct.min / 100, max: cAtual.peso * faixaMagraPct.max / 100 };
    const faixaGorduraPct = Util.faixaGorduraSaudavel(perfil.sexo);
    const faixaGordaKg = { min: cAtual.peso * faixaGorduraPct.min / 100, max: cAtual.peso * faixaGorduraPct.max / 100 };
    const faixaAguaPct = Util.faixaAguaSaudavel(perfil.sexo);
    const faixaAguaKg = { min: cAtual.peso * faixaAguaPct.min / 100, max: cAtual.peso * faixaAguaPct.max / 100 };
    const faixaImc = Util.faixaImcSaudavel();

    return `
      <div class="card">
        <h2>Sua composição corporal</h2>
        ${comp2RowHtml('Peso', cAtual.peso, ' kg', 1, delta(cAtual.peso, cAnterior && cAnterior.peso), faixaPeso)}
        ${comp2RowHtml('Massa magra', cAtual.massaMagra, ' kg', 1, delta(cAtual.massaMagra, cAnterior && cAnterior.massaMagra), cAtual.massaMagra != null ? faixaMagraKg : null)}
        ${comp2RowHtml('Massa gorda', cAtual.massaGorda, ' kg', 1, delta(cAtual.massaGorda, cAnterior && cAnterior.massaGorda), cAtual.massaGorda != null ? faixaGordaKg : null)}
        ${comp2RowHtml('Água corporal', cAtual.agua, ' kg', 1, delta(cAtual.agua, cAnterior && cAnterior.agua), cAtual.agua != null ? faixaAguaKg : null)}
        <p class="meta" style="font-size:0.68rem;margin-top:4px">Massa gorda e água corporal são estimativas a partir do peso e % de gordura — não substitui avaliação profissional.</p>
      </div>
      <div class="card">
        <h2>Análise corporal</h2>
        ${comp2RowHtml('Gordura corporal', cAtual.bodyFat, ' %', 1, delta(cAtual.bodyFat, cAnterior && cAnterior.bodyFat), cAtual.bodyFat != null ? faixaGorduraPct : null)}
        ${comp2RowHtml('IMC', imcAtual, '', 1, delta(imcAtual, imcAnterior), imcAtual != null ? faixaImc : null)}
      </div>
    `;
  }

  function render($app, state, api) {
    const existing = Storage.getByDate('medidas', state.date)[0];
    $app.innerHTML = `
      ${composicaoHtml()}
      <div class="card">
        <h2>Medidas corporais</h2>
        ${pares(FIELDS).map(par => `
          <div class="row">
            ${par.map(f => fieldHtml(f, existing)).join('')}
          </div>
        `).join('')}
        <p class="meta" style="font-size:0.72rem">Se souber sua massa magra (balança de bioimpedância, etc.), preencha; se deixar em branco, o Início calcula automaticamente a partir do peso e % de gordura.</p>
        <label>Notas</label>
        <textarea id="medidas-notes" placeholder="Observações...">${Util.escapeHtml(existing ? existing.notes : '')}</textarea>
        <button class="primary" id="save-medidas">Salvar medidas</button>
      </div>
    `;
    document.getElementById('save-medidas').addEventListener('click', () => {
      const data = { notes: document.getElementById('medidas-notes').value.trim() };
      FIELDS.forEach(f => {
        const v = document.getElementById(`f-${f.key}`).value;
        data[f.key] = v === '' ? null : Number(v);
      });
      if (existing) {
        Storage.update('medidas', existing.id, data);
      } else {
        Storage.add('medidas', { date: state.date, ...data });
      }
      api.render();
    });
  }

  function fieldHtml(f, existing) {
    return Util.inputGroup({
      id: `f-${f.key}`,
      label: f.label,
      type: 'number',
      step: '0.1',
      value: existing && existing[f.key] != null ? existing[f.key] : '',
    });
  }

  return { render, FIELDS };
})();
