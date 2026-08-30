const ViewExames = (() => {
  function render($app, state, api) {
    const exames = Storage.getAll('exames_meta').sort((a, b) => b.date.localeCompare(a.date));

    $app.innerHTML = `
      ${ViewExamesTendencia.atalhoHtml()}
      <div class="card">
        <h2>Guardar o laudo</h2>
        <p class="meta">O arquivo fica só no aparelho. Pra ver evolução, lance os valores em "Resultados e tendência".</p>
        <label>Data</label>
        <input type="date" id="exame-date" value="${state.date}">
        <label>Tipo / nome do exame</label>
        <input type="text" id="exame-tipo" placeholder="Ex: Hemograma, Colesterol...">
        <label>Arquivo (foto ou PDF)</label>
        <input type="file" id="exame-file" accept="image/*,application/pdf">
        <button class="primary" id="save-exame" style="margin-top:10px">Salvar laudo</button>
      </div>
      <div class="card">
        <h2>Exames salvos</h2>
        <div id="exames-list">
          ${exames.length === 0 ? '<div class="empty">Nenhum exame registrado ainda</div>' : exames.map(ex => `
            <div class="list-item" data-id="${ex.id}">
              <div>
                <strong>${Util.escapeHtml(ex.tipo || 'Exame')}</strong>
                <div class="meta">${Util.fmtDate(ex.date)}${ex.fileName ? ' · ' + Util.escapeHtml(ex.fileName) : ''}</div>
              </div>
              <div style="display:flex;gap:6px">
                <button class="secondary" data-abrir-exame="${ex.id}" style="font-size:0.75rem;padding:6px 10px">Abrir</button>
                <button class="link" data-remove-exame="${ex.id}">✕</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    ViewExamesTendencia.bindAtalho($app, api);

    document.getElementById('save-exame').addEventListener('click', async () => {
      const file = document.getElementById('exame-file').files[0];
      if (!file) return;
      const date = document.getElementById('exame-date').value || state.date;
      const tipo = document.getElementById('exame-tipo').value.trim();
      const dataURL = await Util.fileToDataURL(file);
      const id = Storage.uid();
      await PhotoDB.addPhoto({ id, date, tipo, fileName: file.name, mimeType: file.type, dataURL });
      const items = Storage.getAll('exames_meta');
      items.push({ id, date, tipo, fileName: file.name });
      Storage.saveAll('exames_meta', items);
      api.render();
    });

    $app.querySelectorAll('[data-abrir-exame]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const arquivo = await PhotoDB.getPhoto(btn.dataset.abrirExame);
        if (!arquivo) return;
        const win = window.open();
        if (win) {
          if ((arquivo.mimeType || '').includes('pdf')) {
            win.location.href = arquivo.dataURL;
          } else {
            win.document.write(`<img src="${arquivo.dataURL}" style="max-width:100%">`);
          }
        }
      });
    });

    $app.querySelectorAll('[data-remove-exame]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!confirm('Excluir este exame?')) return;
        const id = btn.dataset.removeExame;
        PhotoDB.deletePhoto(id);
        Storage.remove('exames_meta', id);
        api.render();
      });
    });
  }

  return { render };
})();
