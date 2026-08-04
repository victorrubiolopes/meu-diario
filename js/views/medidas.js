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

  function render($app, state, api) {
    const existing = Storage.getByDate('medidas', state.date)[0];
    $app.innerHTML = `
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
