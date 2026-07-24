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
  const accent = styles.getPropertyValue('--accent').trim() || '#b5734a';
  const border = styles.getPropertyValue('--border').trim() || '#e8e1d6';
  const textMuted = styles.getPropertyValue('--text-muted').trim() || '#8a8177';

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

  // x labels (first, middle, last)
  ctx.fillStyle = textMuted;
  ctx.textAlign = 'center';
  const labelIdxs = points.length > 1 ? [0, points.length - 1] : [0];
  labelIdxs.forEach(i => {
    ctx.fillText(points[i].label, x(i), cssH - 6);
  });
}
