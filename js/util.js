const Util = (() => {
  function todayISO() {
    return new Date().toISOString().slice(0, 10);
  }

  function fmtDate(iso) {
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  }

  function escapeHtml(str) {
    return (str == null ? '' : String(str)).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  function daysAgo(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().slice(0, 10);
  }

  function daysFromNow(n) {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  }

  function movingAverage(points, window) {
    return points.map((p, i) => {
      const slice = points.slice(Math.max(0, i - window + 1), i + 1);
      const avg = slice.reduce((s, x) => s + x.value, 0) / slice.length;
      return { label: p.label, value: avg };
    });
  }

  function getPesoAtual() {
    const medidas = Storage.getAll('medidas').filter(m => m.weight != null).sort((a, b) => b.date.localeCompare(a.date));
    if (medidas.length > 0) return medidas[0].weight;
    const perfil = Storage.getPerfil();
    return perfil.peso || null;
  }

  function planoSugerido() {
    const planos = Storage.getAll('treino_planos').sort((a, b) => a.ordem - b.ordem);
    if (planos.length === 0) return null;
    const entradas = Storage.getAll('treino').filter(t => t.planoId).sort((a, b) => b.date.localeCompare(a.date));
    if (entradas.length === 0) return planos[0];
    const idx = planos.findIndex(p => p.id === entradas[0].planoId);
    if (idx === -1) return planos[0];
    return planos[(idx + 1) % planos.length];
  }

  function weekdayOf(dateISO) {
    const [y, m, d] = dateISO.split('-').map(Number);
    return new Date(y, m - 1, d).getDay();
  }

  function daysBetween(d1ISO, d2ISO) {
    const [y1, m1, d1] = d1ISO.split('-').map(Number);
    const [y2, m2, d2] = d2ISO.split('-').map(Number);
    return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000);
  }

  // Fábrica para o par label+input repetido em vários formulários (Medidas, Perfil).
  // Só cobre o caso estático simples: sem eventos, sem validação especial.
  function inputGroup({ id, label, type = 'text', value = '', step, min, max, placeholder }) {
    const attrs = [
      step != null ? `step="${step}"` : '',
      min != null ? `min="${min}"` : '',
      max != null ? `max="${max}"` : '',
      placeholder ? `placeholder="${escapeHtml(placeholder)}"` : '',
    ].filter(Boolean).join(' ');
    return `
      <div>
        <label>${label}</label>
        <input type="${type}" id="${id}" value="${escapeHtml(value)}" ${attrs}>
      </div>
    `;
  }

  function youtubeSearchUrl(query) {
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(query + ' execução exercício')}`;
  }

  return { todayISO, fmtDate, escapeHtml, daysAgo, daysFromNow, movingAverage, getPesoAtual, planoSugerido, weekdayOf, daysBetween, inputGroup, youtubeSearchUrl };
})();
