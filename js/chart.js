function drawLineChart(canvas, points, opts = {}) {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const cssW = canvas.clientWidth || 300;
  const cssH = canvas.clientHeight || 200;
  canvas.width = cssW * dpr;
  canvas.height = cssH * dpr;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, cssW, cssH);

  const styles = getComputedStyle(document.documentElement);
  const accent = styles.getPropertyValue('--accent').trim() || '#3f8a5a';
  const border = styles.getPropertyValue('--border').trim() || '#e6e5e0';
  const textMuted = styles.getPropertyValue('--text-muted').trim() || '#837f76';

  if (!points || points.length === 0) {
    ctx.fillStyle = textMuted;
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Sem dados suficientes ainda', cssW / 2, cssH / 2);
    return;
  }

  const padding = { top: 14, right: 14, bottom: 24, left: 40 };
  const w = cssW - padding.left - padding.right;
  const h = cssH - padding.top - padding.bottom;

  const trend = opts.trend || null;
  const allValues = points.map(p => p.value).concat(trend ? trend.map(p => p.value) : []);
  let min = Math.min(...allValues);
  let max = Math.max(...allValues);
  if (min === max) { min -= 1; max += 1; }
  const pad = (max - min) * 0.1;
  min -= pad; max += pad;

  const x = i => padding.left + (points.length === 1 ? w / 2 : (i / (points.length - 1)) * w);
  const y = v => padding.top + h - ((v - min) / (max - min)) * h;

  // grid lines
  ctx.strokeStyle = border;
  ctx.lineWidth = 1;
  ctx.fillStyle = textMuted;
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'right';
  const gridCount = 4;
  for (let i = 0; i <= gridCount; i++) {
    const v = min + ((max - min) * i) / gridCount;
    const yy = y(v);
    ctx.beginPath();
    ctx.moveTo(padding.left, yy);
    ctx.lineTo(cssW - padding.right, yy);
    ctx.stroke();
    ctx.fillText(v.toFixed(1), padding.left - 6, yy + 4);
  }

  // trend line (média móvel), desenhada atrás da linha principal
  if (trend && trend.length > 1) {
    ctx.strokeStyle = textMuted;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    trend.forEach((p, i) => {
      const px = x(i), py = y(p.value);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    });
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // line
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  points.forEach((p, i) => {
    const px = x(i), py = y(p.value);
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  });
  ctx.stroke();

  // dots
  ctx.fillStyle = accent;
  points.forEach((p, i) => {
    ctx.beginPath();
    ctx.arc(x(i), y(p.value), 3.5, 0, Math.PI * 2);
    ctx.fill();
  });

  // Valor em cima de cada ponto. Com muitos pontos os rótulos se sobrepõem, então
  // só desenha os que cabem: percorre da esquerda pra direita pulando quem colidiria
  // com o anterior. O último ponto é reservado antes de tudo — é o número mais
  // recente, o que mais interessa, então ele nunca é o pulado.
  const surface = styles.getPropertyValue('--surface').trim() || '#ffffff';
  ctx.font = '600 10px sans-serif';
  ctx.textAlign = 'center';
  ctx.lineJoin = 'round';
  const fmtValor = v => String(Math.round(v * 10) / 10);
  const ultimo = points.length - 1;
  const larguraDe = i => ctx.measureText(fmtValor(points[i].value)).width;
  // Encosta no limite do canvas em vez de vazar quando o ponto está na borda.
  const posX = i => Math.max(
    padding.left + larguraDe(i) / 2,
    Math.min(cssW - padding.right - larguraDe(i) / 2, x(i))
  );
  const bordaEsqUltimo = posX(ultimo) - larguraDe(ultimo) / 2;
  let bordaDir = -Infinity;
  points.forEach((p, i) => {
    const tw = larguraDe(i);
    const px = posX(i);
    if (i !== ultimo) {
      if (px - tw / 2 < bordaDir + 6) return;
      if (px + tw / 2 > bordaEsqUltimo - 6) return;
    }
    const py = y(p.value);
    // Acima do ponto por padrão; abaixo só quando o texto vazaria pra fora do canvas
    // (fonte de 10px sobe ~8px acima da linha de base, que fica 9px acima do ponto).
    const ly = py - 9 - 8 >= 0 ? py - 9 : py + 17;
    const texto = fmtValor(p.value);
    ctx.strokeStyle = surface;
    ctx.lineWidth = 3;
    ctx.strokeText(texto, px, ly);
    ctx.fillStyle = accent;
    ctx.fillText(texto, px, ly);
    bordaDir = px + tw / 2;
  });

  // x labels (first, middle, last)
  ctx.font = '11px sans-serif';
  ctx.fillStyle = textMuted;
  ctx.textAlign = 'center';
  const labelIdxs = points.length > 1 ? [0, points.length - 1] : [0];
  labelIdxs.forEach(i => {
    ctx.fillText(points[i].label, x(i), cssH - 6);
  });
}
