const ViewFotos = (() => {
  function render($app, state, api) {
    const fotos = Storage.getAll('fotos_meta').sort((a, b) => b.date.localeCompare(a.date));

    $app.innerHTML = `
      <div class="card">
        <h2>Adicionar foto</h2>
        <label>Data</label>
        <input type="date" id="photo-date" value="${state.date}">
        <label>Foto</label>
        <input type="file" id="photo-file" accept="image/*">
        <label>Nota (opcional)</label>
        <input type="text" id="photo-note" placeholder="Ex: pós-treino, em jejum...">
        <button class="primary" id="save-photo">Salvar foto</button>
      </div>
      <div class="card">
        <h2>Comparar datas</h2>
        <div class="row">
          <div>
            <label>Foto 1</label>
            <select id="compare-a"><option value="">Selecione</option>${fotos.map(f => `<option value="${f.id}">${Util.fmtDate(f.date)}${f.note ? ' - ' + Util.escapeHtml(f.note) : ''}</option>`).join('')}</select>
          </div>
          <div>
            <label>Foto 2</label>
            <select id="compare-b"><option value="">Selecione</option>${fotos.map(f => `<option value="${f.id}">${Util.fmtDate(f.date)}${f.note ? ' - ' + Util.escapeHtml(f.note) : ''}</option>`).join('')}</select>
          </div>
        </div>
        <div class="compare-row" style="margin-top:10px">
          <div class="compare-col"><img id="compare-img-a" style="display:none"><div class="lbl" id="compare-lbl-a"></div></div>
          <div class="compare-col"><img id="compare-img-b" style="display:none"><div class="lbl" id="compare-lbl-b"></div></div>
        </div>
      </div>
      <div class="card">
        <h2>Todas as fotos</h2>
        <div class="photo-grid" id="photo-grid">
          ${fotos.length === 0 ? `
            <div class="empty">
              Nenhuma foto ainda
              <div style="margin-top:10px"><button class="secondary" id="empty-cta-foto">+ Adicionar minha primeira foto</button></div>
            </div>
          ` : fotos.map(f => `
            <div class="photo-thumb" data-remove-wrap="${f.id}">
              <img data-photo-id="${f.id}">
              <div class="date-tag">${Util.fmtDate(f.date)}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    const emptyCtaFoto = document.getElementById('empty-cta-foto');
    if (emptyCtaFoto) {
      emptyCtaFoto.addEventListener('click', () => document.getElementById('photo-file').click());
    }

    // carrega thumbnails de forma assíncrona (blobs ficam no IndexedDB)
    $app.querySelectorAll('[data-photo-id]').forEach(async img => {
      const photo = await PhotoDB.getPhoto(img.dataset.photoId);
      if (photo) img.src = photo.dataURL;
    });
    $app.querySelectorAll('.photo-thumb').forEach(thumb => {
      thumb.addEventListener('click', () => {
        if (confirm('Excluir esta foto?')) {
          const id = thumb.dataset.removeWrap;
          PhotoDB.deletePhoto(id);
          Storage.remove('fotos_meta', id);
          api.render();
        }
      });
    });

    document.getElementById('save-photo').addEventListener('click', async () => {
      const file = document.getElementById('photo-file').files[0];
      if (!file) return;
      const date = document.getElementById('photo-date').value || state.date;
      const note = document.getElementById('photo-note').value.trim();
      const dataURL = await Util.fileToDataURL(file);
      const id = Storage.uid();
      await PhotoDB.addPhoto({ id, date, note, dataURL });
      const items = Storage.getAll('fotos_meta');
      items.push({ id, date, note });
      Storage.saveAll('fotos_meta', items);
      api.render();
    });

    const selA = document.getElementById('compare-a');
    const selB = document.getElementById('compare-b');
    async function updateCompare(sel, imgId, lblId) {
      const id = sel.value;
      const img = document.getElementById(imgId);
      const lbl = document.getElementById(lblId);
      if (!id) { img.style.display = 'none'; lbl.textContent = ''; return; }
      const photo = await PhotoDB.getPhoto(id);
      if (photo) {
        img.src = photo.dataURL;
        img.style.display = '';
        lbl.textContent = `${Util.fmtDate(photo.date)}${photo.note ? ' - ' + photo.note : ''}`;
      }
    }
    selA.addEventListener('change', () => updateCompare(selA, 'compare-img-a', 'compare-lbl-a'));
    selB.addEventListener('change', () => updateCompare(selB, 'compare-img-b', 'compare-lbl-b'));
  }

  return { render };
})();
