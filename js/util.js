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

  // Faixas de referência de composição corporal (não são "metas" cadastradas — estimativas
  // gerais por altura/sexo, tipo IMC saudável). Usadas no Início e em Medidas.
  function faixaPesoSaudavel(alturaCm) {
    if (!alturaCm) return null;
    const h = alturaCm / 100;
    return { min: 18.5 * h * h, max: 24.9 * h * h };
  }
  function faixaGorduraSaudavel(sexo) {
    if (sexo === 'masculino') return { min: 10, max: 20 };
    if (sexo === 'feminino') return { min: 18, max: 28 };
    return { min: 14, max: 24 };
  }
  // % do peso total que costuma ser considerado massa magra saudável.
  function faixaMassaMagraSaudavel(sexo) {
    if (sexo === 'masculino') return { min: 75, max: 90 };
    if (sexo === 'feminino') return { min: 68, max: 85 };
    return { min: 72, max: 87 };
  }
  // % do peso total que costuma ser considerado água corporal saudável.
  function faixaAguaSaudavel(sexo) {
    if (sexo === 'masculino') return { min: 50, max: 65 };
    if (sexo === 'feminino') return { min: 45, max: 60 };
    return { min: 48, max: 62 };
  }
  function faixaImcSaudavel() { return { min: 18.5, max: 24.9 }; }

  // Métricas derivadas de um registro de medida (peso + % gordura + massa magra manual/opcional).
  // massaMagra: usa o valor manual se preenchido, senão calcula peso × (1 − %gordura/100).
  // água: estimada como 73% da massa magra (fração de água no tecido livre de gordura).
  function metricasComposicao(m) {
    if (!m || m.weight == null) return null;
    const peso = m.weight;
    const bodyFat = m.bodyFat != null ? m.bodyFat : null;
    const massaMagra = m.leanMass != null ? m.leanMass : (bodyFat != null ? peso * (1 - bodyFat / 100) : null);
    const massaGorda = bodyFat != null ? peso * (bodyFat / 100) : null;
    const agua = massaMagra != null ? massaMagra * 0.73 : null;
    return { peso, bodyFat, massaMagra, massaGorda, agua };
  }

  // Estimativa de % de gordura corporal pra quem não tem esse número medido (balança de
  // bioimpedância, adipômetro, etc.). Dois níveis, do mais pro menos preciso:
  //   1) Método da Marinha dos EUA (circunferências) — precisa cintura + pescoço (+ quadril
  //      pras mulheres) + altura. Mais confiável, mas exige medir o pescoço, algo que ninguém
  //      mede por padrão.
  //   2) Fórmula de Deurenberg (peso + altura + idade + sexo) — menos precisa, mas não exige
  //      nenhuma medida nova: já dá pra calcular só com o que está no Perfil.
  // Retorna null se não der pra estimar de jeito nenhum (falta perfil básico).
  function estimarGorduraCorporal(perfil, medida) {
    if (!perfil || !perfil.altura || !perfil.sexo) return null;
    const altura = perfil.altura;
    const sexoMasc = perfil.sexo === 'masculino';

    const cintura = medida && medida.waist;
    const pescoco = medida && medida.neck;
    const quadril = medida && medida.hip;

    if (cintura && pescoco && (sexoMasc || quadril)) {
      let bf = null;
      if (sexoMasc && cintura > pescoco) {
        bf = 495 / (1.0324 - 0.19077 * Math.log10(cintura - pescoco) + 0.15456 * Math.log10(altura)) - 450;
      } else if (!sexoMasc && (cintura + quadril) > pescoco) {
        bf = 495 / (1.29579 - 0.35004 * Math.log10(cintura + quadril - pescoco) + 0.22100 * Math.log10(altura)) - 450;
      }
      if (bf != null && bf > 0 && bf < 70) {
        return { valor: Math.round(bf * 10) / 10, metodo: 'marinha' };
      }
    }

    const peso = (medida && medida.weight) || perfil.peso || getPesoAtual();
    if (peso && perfil.idade) {
      const bmi = peso / ((altura / 100) * (altura / 100));
      const bf = 1.20 * bmi + 0.23 * perfil.idade - 10.8 * (sexoMasc ? 1 : 0) - 5.4;
      if (bf > 0 && bf < 70) {
        return { valor: Math.round(bf * 10) / 10, metodo: 'bmi' };
      }
    }

    return null;
  }

  // Histórico combinado de treinos (musculação + corrida), mais recente primeiro.
  function historicoTreinos(limit) {
    const lista = [
      ...Storage.getAll('treino').map(t => {
        const n = (t.exercises || []).length;
        return {
          tipo: 'treino', id: t.id, date: t.date,
          resumo: n === 0 ? 'Musculação — treino rápido' : `Musculação — ${n} exercício${n === 1 ? '' : 's'}`,
        };
      }),
      ...Storage.getAll('corridas').map(c => ({
        tipo: 'corridas', id: c.id, date: c.date,
        resumo: `Corrida — ${c.distanceKm}km em ${c.timeMin}min`,
      })),
    ].sort((a, b) => b.date.localeCompare(a.date));
    return limit ? lista.slice(0, limit) : lista;
  }

  function weekdayOf(dateISO) {
    const [y, m, d] = dateISO.split('-').map(Number);
    return new Date(y, m - 1, d).getDay();
  }

  function addDaysISO(dateISO, n) {
    const [y, m, d] = dateISO.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + n);
    return toLocalISO(date);
  }

  // Segunda-feira da semana (segunda a domingo) que contém dateISO.
  function mondayOf(dateISO) {
    const dow = weekdayOf(dateISO); // 0=domingo..6=sábado
    const diff = dow === 0 ? -6 : 1 - dow;
    return addDaysISO(dateISO, diff);
  }

  // Ex: "sex., 24 de jul."
  function fmtDatePill(dateISO) {
    const [y, m, d] = dateISO.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' });
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

  // Lista de pesos registrados pra um exercício já salvo — tolerante ao formato antigo
  // (peso único em `weight`) e ao novo (`weights`, um valor por série).
  function pesosExercicio(ex) {
    if (!ex) return [];
    if (Array.isArray(ex.weights) && ex.weights.length) {
      return ex.weights.map(Number).filter(w => !isNaN(w) && w > 0);
    }
    const w = Number(ex.weight);
    return !isNaN(w) && w > 0 ? [w] : [];
  }
  function maxPesoExercicio(ex) {
    const pesos = pesosExercicio(ex);
    return pesos.length ? Math.max(...pesos) : 0;
  }

  return { todayISO, fmtDate, escapeHtml, daysAgo, daysFromNow, movingAverage, getPesoAtual, planoSugerido, ultimoTreinoFeito, weekdayOf, daysBetween, addDaysISO, mondayOf, fmtDatePill, historicoTreinos,
    faixaPesoSaudavel, faixaGorduraSaudavel, faixaMassaMagraSaudavel, faixaAguaSaudavel, faixaImcSaudavel, metricasComposicao, estimarGorduraCorporal, inputGroup, youtubeSearchUrl, youtubeEmbedId, fileToDataURL, compressImageToDataURL,
    pesosExercicio, maxPesoExercicio };
})();
