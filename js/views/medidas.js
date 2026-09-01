const ViewMedidas = (() => {
  const FIELDS = [
    { key: 'weight', label: 'Peso (kg)' },
    { key: 'waist', label: 'Cintura (cm)' },
    { key: 'neck', label: 'Pescoço (cm) — pro cálculo de %BF' },
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

  // Campos além do peso — o que separa uma pesagem de uma avaliação completa.
  const FIELDS_AVALIACAO = FIELDS.filter(f => f.key !== 'weight');

  function temAvaliacao(m) {
    return !!m && FIELDS_AVALIACAO.some(f => m[f.key] != null);
  }

  function render($app, state, api) {
    if (state.subView === 'avaliacao') return renderAvaliacao($app, state, api);
    return renderRaiz($app, state, api);
  }

  // Tela raiz: consultar a composição e pesar. Pesar é o que ele faz 2x por semana e sai
  // em dois toques; a avaliação completa é mensal e vai pra tela própria — mesma regra que
  // vale pro resto do app (registro diário fica inline, montar/editar vira tela).
  function renderRaiz($app, state, api) {
    const existing = Storage.getByDate('medidas', state.date)[0];
    const anteriores = Storage.getAll('medidas')
      .filter(m => m.weight != null && m.date < state.date)
      .sort((a, b) => b.date.localeCompare(a.date));
    const ultima = anteriores[0];
    const completa = temAvaliacao(existing);
    const delta = existing && existing.weight != null && ultima ? existing.weight - ultima.weight : null;

    $app.innerHTML = `
      ${composicaoHtml()}
      <div class="card">
        <h2>Pesagem</h2>
        ${ultima ? `<p class="meta">Última: <strong>${ultima.weight.toFixed(1)} kg</strong> em ${Util.fmtDatePill(ultima.date)}</p>` : ''}
        ${Util.inputGroup({
          id: 'f-weight',
          label: 'Peso (kg)',
          type: 'number',
          step: '0.1',
          value: existing && existing.weight != null ? existing.weight : '',
        })}
        ${delta != null ? `<p class="meta">${delta > 0 ? '+' : ''}${delta.toFixed(1)} kg desde a última</p>` : ''}
        <button class="primary" id="save-peso">${existing && existing.weight != null ? 'Atualizar peso' : 'Salvar peso'}</button>
      </div>
      ${Util.menuCardHtml([
        Util.escolhaHtml(
          'id="ir-avaliacao"',
          '📏',
          completa ? 'Ver a avaliação deste dia' : 'Fazer avaliação completa',
          completa
            ? 'Cintura, abdômen, quadril, braço, coxa e composição já lançados.'
            : 'Cintura, abdômen, quadril, braço, coxa, % de gordura e notas.'
        ),
      ])}
    `;

    document.getElementById('save-peso').addEventListener('click', () => {
      const v = document.getElementById('f-weight').value;
      if (v === '') { alert('Preencha o peso.'); return; }
      // Update PARCIAL, só com o peso. Esta tela não tem os campos da avaliação, então
      // montar um objeto com todos eles (como faz a tela de avaliação, onde os campos
      // existem e vazio significa "não medi") mandaria null pra cintura, abdômen e o resto
      // toda vez que ele subisse na balança.
      if (existing) Storage.update('medidas', existing.id, { weight: Number(v) });
      else Storage.add('medidas', { date: state.date, weight: Number(v) });
      api.render();
    });

    document.getElementById('ir-avaliacao').addEventListener('click', () => api.goToSub('avaliacao'));
  }

  function renderAvaliacao($app, state, api) {
    const existing = Storage.getByDate('medidas', state.date)[0];
    $app.innerHTML = `
      <div class="card">
        <h2>Medidas corporais</h2>
        <p class="meta">Meça sempre no mesmo ponto e nas mesmas condições — no seu histórico a coxa oscila 10 cm entre aferições, o que é o ponto de medida mudando, não a perna.</p>
        ${pares(FIELDS).map(par => `
          <div class="row">
            ${par.map(f => fieldHtml(f, existing)).join('')}
          </div>
        `).join('')}
        <p class="meta" id="bf-estimativa" style="font-size:0.72rem"></p>
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
      // Volta pra raiz em vez de repintar: ver a composição corporal recalculada é o que
      // mostra que a avaliação entrou.
      api.back();
    });

    // Estimativa de % de gordura pra quem não tem esse número medido — só aparece
    // enquanto o campo "% Gordura corporal" estiver vazio, e recalcula ao digitar.
    function atualizarEstimativaBF() {
      const bfInput = document.getElementById('f-bodyFat');
      const hint = document.getElementById('bf-estimativa');
      if (!bfInput || !hint) return;
      if (bfInput.value !== '') { hint.innerHTML = ''; return; }
      const perfil = Storage.getPerfil();
      const medidaForm = {
        weight: Number(document.getElementById('f-weight').value) || null,
        waist: Number(document.getElementById('f-waist').value) || null,
        neck: Number(document.getElementById('f-neck').value) || null,
        hip: Number(document.getElementById('f-hip').value) || null,
      };
      const est = Util.estimarGorduraCorporal(perfil, medidaForm);
      if (!est) { hint.innerHTML = ''; return; }

      // Quando cai no método por IMC, aponta exatamente QUAIS campos deste formulário
      // faltam pra usar o método da Marinha (bem mais preciso) — antes o texto dizia
      // "meça cintura e pescoço", o que parecia pedir uma fita métrica em vez de
      // apontar pros campos que já existem logo acima.
      const precisaQuadril = perfil.sexo !== 'masculino';
      const faltando = [
        !medidaForm.waist ? { key: 'waist', nome: 'Cintura' } : null,
        !medidaForm.neck ? { key: 'neck', nome: 'Pescoço' } : null,
        precisaQuadril && !medidaForm.hip ? { key: 'hip', nome: 'Quadril' } : null,
      ].filter(Boolean);

      let baseTxt;
      if (est.metodo === 'marinha') {
        baseTxt = precisaQuadril
          ? 'pela cintura, pescoço e quadril que você preencheu'
          : 'pela cintura e pescoço que você preencheu';
      } else if (faltando.length) {
        const nomes = faltando.map(f => f.nome);
        const lista = nomes.length > 1 ? `${nomes.slice(0, -1).join(', ')} e ${nomes[nomes.length - 1]}` : nomes[0];
        baseTxt = `estimativa grosseira, só por peso/altura/idade — preencha ${lista} acima pra uma bem mais precisa`;
      } else {
        baseTxt = 'baseado em peso/altura/idade';
      }

      const irBtn = faltando.length
        ? ` <button type="button" class="link" id="ir-campo-bf">preencher ${faltando[0].nome.toLowerCase()}</button>`
        : '';
      hint.innerHTML = `💡 Sem esse número? Estimativa: <strong>${est.valor}%</strong> (${baseTxt}). <button type="button" class="link" id="usar-estimativa-bf">usar essa estimativa</button>${irBtn}`;

      const usarBtn = document.getElementById('usar-estimativa-bf');
      if (usarBtn) {
        usarBtn.addEventListener('click', () => {
          bfInput.value = est.valor;
          hint.innerHTML = '';
        });
      }
      const irEl = document.getElementById('ir-campo-bf');
      if (irEl) {
        irEl.addEventListener('click', () => {
          const alvo = document.getElementById(`f-${faltando[0].key}`);
          if (!alvo) return;
          alvo.scrollIntoView({ behavior: 'smooth', block: 'center' });
          alvo.focus({ preventScroll: true });
          alvo.classList.add('campo-destaque');
          setTimeout(() => alvo.classList.remove('campo-destaque'), 1600);
        });
      }
    }
    ['weight', 'waist', 'neck', 'hip', 'bodyFat'].forEach(key => {
      const el = document.getElementById(`f-${key}`);
      if (el) el.addEventListener('input', atualizarEstimativaBF);
    });
    atualizarEstimativaBF();
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
