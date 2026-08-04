const Util = (() => {
  // Formata uma Date para 'YYYY-MM-DD' no fuso LOCAL (não em UTC).
  // Evita o bug de o "hoje" pular para o dia seguinte à noite (ex: após 21h no Brasil, UTC-3),
  // que fazia o app conferir o dia errado (treino registrado hoje não marcava).
  function toLocalISO(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function todayISO() {
    return toLocalISO(new Date());
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
    return toLocalISO(d);
  }

  function daysFromNow(n) {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return toLocalISO(d);
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
    // Ignora entradas cujo planoId não corresponde a nenhum plano atual (ex: plano apagado/recarregado),
    // senão a rotação "reseta" silenciosamente pro primeiro plano da lista.
    const ultimaValida = entradas.find(e => planos.some(p => p.id === e.planoId));
    if (!ultimaValida) return planos[0];
    const idx = planos.findIndex(p => p.id === ultimaValida.planoId);
    return planos[(idx + 1) % planos.length];
  }

  function ultimoTreinoFeito() {
    const planos = Storage.getAll('treino_planos');
    const entradas = Storage.getAll('treino').filter(t => t.planoId).sort((a, b) => b.date.localeCompare(a.date));
    const ultimaValida = entradas.find(e => planos.some(p => p.id === e.planoId));
    if (!ultimaValida) return null;
    const plano = planos.find(p => p.id === ultimaValida.planoId);
    return { nome: plano.nome, date: ultimaValida.date };
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

  // Extrai o ID do vídeo de links do YouTube (watch, youtu.be, embed, shorts) para permitir incorporar.
  // Retorna null se o link não for de um vídeo específico (ex: uma busca) — nesse caso não dá pra incorporar.
  function youtubeEmbedId(url) {
    if (!url) return null;
    const patterns = [
      /youtube\.com\/watch\?v=([\w-]{11})/,
      /youtu\.be\/([\w-]{11})/,
      /youtube\.com\/embed\/([\w-]{11})/,
      /youtube\.com\/shorts\/([\w-]{11})/,
    ];
    for (const p of patterns) {
      const m = url.match(p);
      if (m) return m[1];
    }
    return null;
  }

  function fileToDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Redimensiona/comprime uma imagem pra um dataURL pequeno (JPEG), pra caber junto dos
  // dados sincronizados (Firestore) — ex: foto de refeição, que o nutri precisa enxergar
  // de outro aparelho, então não pode ficar só no IndexedDB local do paciente.
  function compressImageToDataURL(file, maxDim = 480, quality = 0.6) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > height && width > maxDim) { height = Math.round((height * maxDim) / width); width = maxDim; }
          else if (height > maxDim) { width = Math.round((width * maxDim) / height); height = maxDim; }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          canvas.getContext('2d').drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = reject;
        img.src = reader.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  return { todayISO, fmtDate, escapeHtml, daysAgo, daysFromNow, movingAverage, getPesoAtual, planoSugerido, ultimoTreinoFeito, weekdayOf, daysBetween, inputGroup, youtubeSearchUrl, youtubeEmbedId, fileToDataURL, compressImageToDataURL };
})();
