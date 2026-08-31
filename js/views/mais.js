const ViewMais = (() => {
  const MENU = [
    { key: 'tarefas', icon: '📋', label: 'Tarefas' },
    { key: 'fotos', icon: '📸', label: 'Fotos' },
    { key: 'exames', icon: '🩺', label: 'Exames Médicos' },
    { key: 'historico', icon: '📊', label: 'Histórico' },
    { key: 'perfil', icon: '👤', label: 'Meu Perfil' },
    { key: 'biblioteca-alimentos', icon: '🍎', label: 'Biblioteca de Alimentos' },
    { key: 'biblioteca-exercicios', icon: '🏋️', label: 'Biblioteca de Exercícios' },
    { key: 'planos-treino', icon: '🔄', label: 'Planos de Treino' },
    { key: 'combos', icon: '🥗', label: 'Combos de Refeição' },
    { key: 'dietas-custom', icon: '📋', label: 'Minhas Dietas' },
    { key: 'refeicao-livre', icon: '🍔', label: 'Refeição Livre' },
    { key: 'backup', icon: '💾', label: 'Backup' },
  ];

  function render($app, state, api) {
    switch (state.maisView) {
      case 'tarefas': return ViewTarefas.render($app, state, api);
      case 'fotos': return ViewFotos.render($app, state, api);
      case 'exames': return ViewExames.render($app, state, api);
      case 'exames-tendencia': return ViewExamesTendencia.render($app, state, api);
      case 'exame-lancar': return ViewExamesTendencia.renderLancar($app, state, api);
      case 'historico': return ViewHistorico.render($app, state, api);
      case 'perfil': return renderPerfil($app, state, api);
      case 'biblioteca-alimentos': return renderBibliotecaAlimentos($app, state, api);
      case 'alimento-novo': return renderAlimentoNovo($app, state, api);
      case 'receita-sugerir': return renderReceitaSugerir($app, state, api);
      case 'biblioteca-exercicios': return renderBibliotecaExercicios($app, state, api);
      case 'exercicio-novo': return renderExercicioNovo($app, state, api);
      case 'planos-treino': return renderPlanosTreino($app, state, api);
      case 'treino-pacotes': return renderTreinoPacotes($app, state, api);
      case 'plano-editar': return renderPlanoEditar($app, state, api);
      case 'combos': return renderCombos($app, state, api);
      case 'combo-novo': return renderComboNovo($app, state, api);
      case 'dietas-custom': return renderDietasCustom($app, state, api);
      case 'dieta-pacotes': return renderDietaPacotes($app, state, api);
      case 'dieta-nova': return renderDietaNova($app, state, api);
      case 'refeicao-livre': return renderRegrasRefeicaoLivre($app, state, api);
      case 'backup': return renderBackup($app, state, api);
      case 'admin': return renderAdmin($app, state, api);
      // Todas as telas do paciente passam pelo renderAdmin: as funções de montagem
      // vivem lá dentro, e ele despacha pela maisView logo no começo.
      case 'paciente':
      case 'paciente-diario':
      case 'paciente-medidas':
      case 'paciente-dieta':
      case 'paciente-plano':
      case 'paciente-treino':
      case 'paciente-corrida':
      case 'paciente-lista':
      case 'paciente-livre':
      case 'paciente-solicitar':
      case 'paciente-relatorio':
      case 'paciente-papel':
        return renderAdmin($app, state, api);
      case 'notificacoes': return renderNotificacoes($app, state, api);
      default: return renderMenu($app, state, api);
    }
  }

  // ---------------- LINHA QUE ABRE OUTRA TELA ----------------
  // Mesmo desenho do menu raiz de Mais: ícone, título, uma linha explicando e a seta. Quem já
  // usou o app uma vez reconhece que ali se clica e vai pra algum lugar — por isso os
  // formulários de cadastro (alimento, exercício, combo, dieta) viraram destinos em vez de
  // ficarem empilhados acima da lista que a pessoa veio consultar.
  function escolhaHtml(attr, icone, titulo, sub) {
    return `
      <button class="menu-item" ${attr} style="align-items:flex-start;text-align:left">
        <span class="icon">${icone}</span>
        <div style="flex:1">
          <div><strong>${titulo}</strong></div>
          <div class="meta">${sub}</div>
        </div>
        <span class="chev">›</span>
      </button>`;
  }

  function menuCardHtml(itens) {
    return `<div class="card" style="padding:4px 16px"><div class="menu-list">${itens.join('')}</div></div>`;
  }

  // ---------------- PACIENTE NO PAINEL: CACHE, SEÇÕES E ADERÊNCIA ----------------
  // Abrir um paciente custa duas consultas ao Firestore (diário + prescrição). Com cada
  // seção virando tela própria, sem cache toda navegação recarregaria as duas. O cache
  // guarda só o último paciente aberto; trocar de paciente o substitui.
  let pacienteCache = { uid: null, info: null, dados: null, presc: null };

  function invalidarPacienteCache() { pacienteCache = { uid: null, info: null, dados: null, presc: null }; }

  async function carregarPaciente(uid, info) {
    if (pacienteCache.uid === uid) {
      if (info && !pacienteCache.info) pacienteCache.info = info;
      return pacienteCache;
    }
    let dados = null; let presc = null;
    try { dados = await Cloud.dadosUsuario(uid); } catch (e) { /* segue sem diário */ }
    try { presc = await Cloud.prescricaoDe(uid); } catch (e) { /* segue sem prescrição */ }
    pacienteCache = { uid, info: info || null, dados, presc };
    return pacienteCache;
  }

  // Cada seção do paciente é uma tela própria. `alvo` é o id do container que o montarX
  // correspondente procura — é assim que as funções de montagem seguem valendo sem mudar
  // de assinatura: a tela pinta o container certo e elas se acham dentro dele.
  const SECOES_PACIENTE = [
    { view: 'paciente-diario', icone: '📅', titulo: 'Diário do paciente', sub: 'O que ele registrou em cada dia' },
    { view: 'paciente-medidas', icone: '📏', titulo: 'Medidas da consulta', sub: 'Peso e circunferências — aceita a folha colada', alvo: 'admin-medidas' },
    { view: 'paciente-dieta', icone: '🎯', titulo: 'Metas de dieta', sub: 'Calorias e macros do dia' },
    { view: 'paciente-plano', icone: '🍽️', titulo: 'Plano alimentar', sub: 'Refeição a refeição — aceita texto colado', alvo: 'admin-plano' },
    { view: 'paciente-treino', icone: '🏋️', titulo: 'Plano de treino', sub: 'A/B/C — aceita texto colado', alvo: 'admin-treino' },
    { view: 'paciente-corrida', icone: '🏃', titulo: 'Treinos de corrida', sub: 'Planos de corrida do paciente', alvo: 'admin-corrida' },
    { view: 'paciente-lista', icone: '🛒', titulo: 'Lista de compras', sub: 'Manda a lista da semana', alvo: 'admin-lista-compras' },
    { view: 'paciente-livre', icone: '🍔', titulo: 'Refeição livre', sub: 'Regras e frequência permitidas', alvo: 'admin-refeicao-livre' },
    { view: 'paciente-solicitar', icone: '📣', titulo: 'Pedir algo ao paciente', sub: 'Medidas, peso, fotos ou exames', alvo: 'admin-solicitar' },
    { view: 'paciente-relatorio', icone: '📄', titulo: 'Relatório', sub: 'Resumo em texto de 15 a 90 dias' },
    { view: 'paciente-papel', icone: '🎓', titulo: 'Papel e profissional', sub: 'Tornar profissional ou reatribuir', alvo: 'admin-papel', soSuper: true },
  ];

  function secaoPaciente(view) { return SECOES_PACIENTE.find(s => s.view === view) || null; }
  function ehTelaPaciente(view) { return view === 'paciente' || !!secaoPaciente(view); }

  // As medidas que a nutri envia ficam em prescricoes/{uid} e só entram no diário do paciente
  // (users/{uid}) quando ELE abre o app — users/{uid} só o dono escreve. Mas pro painel as
  // duas listas são a mesma coisa: aferições daquela pessoa. Sem juntar, a nutri lançava as
  // medidas na consulta e voltava depois numa tela zerada, como se nada tivesse sido enviado.
  function medidasDoPaciente(dados, presc) {
    const doDiario = (dados && Array.isArray(dados.medidas)) ? dados.medidas : [];
    const daNutri = (presc && Array.isArray(presc.medidas)) ? presc.medidas : [];
    const juntas = doDiario.slice();
    daNutri.forEach(m => {
      if (!m || !m.date) return;
      // Mesma regra de casamento que o paciente usa ao aplicar (Cloud.aplicarPrescricao):
      // origemId primeiro, data como reserva. Assim uma aferição já aplicada não aparece
      // duas vezes, e a versão do paciente (que é a que vale) ganha.
      const jaEsta = doDiario.some(d => (m.id && d.origemId === m.id) || d.date === m.date);
      if (!jaEsta) juntas.push(m);
    });
    return juntas.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  }

  // Aderência a partir só do que o paciente registrou. Cada número carrega a própria base
  // ("22 de 30 dias"), porque uma porcentagem solta de "aderência" é um número bonito que
  // ninguém sabe interpretar — e as bases aqui são diferentes entre si de propósito.
  function aderenciaPaciente(dados, presc, dias) {
    const fim = Util.todayISO();
    const inicio = Util.addDaysISO(fim, -(dias - 1));
    const noPeriodo = lista => (Array.isArray(lista) ? lista : [])
      .filter(x => x && x.date && x.date >= inicio && x.date <= fim);

    const refeicoes = noPeriodo(dados && dados.alimentacao);
    const diasComComida = new Set(refeicoes.map(r => r.date)).size;
    const treinos = noPeriodo(dados && dados.treino).filter(t => (t.exercises || []).length > 0);
    const diasComTreino = new Set(treinos.map(t => t.date)).size;
    const pesagens = noPeriodo(medidasDoPaciente(dados, presc)).filter(m => m.weight != null).length;

    // Dias dentro da meta só contam sobre os dias em que ele REGISTROU comida: num dia sem
    // registro não dá pra saber se ele comeu fora da meta ou só não anotou. Misturar as
    // duas coisas faria um paciente que parou de anotar parecer um que estourou a dieta.
    let dentroMeta = null;
    const metaKcal = presc && presc.kcal;
    if (metaKcal) {
      const porDia = {};
      refeicoes.forEach(r => { porDia[r.date] = (porDia[r.date] || 0) + (r.kcal || 0); });
      const comRegistro = Object.keys(porDia);
      dentroMeta = {
        ok: comRegistro.filter(d => Math.abs(porDia[d] - metaKcal) <= metaKcal * 0.1).length,
        base: comRegistro.length,
        metaKcal,
      };
    }
    return { dias, diasComComida, diasComTreino, treinos: treinos.length, pesagens, dentroMeta };
  }

  function barraHtml(rotulo, feito, total, detalhe) {
    const pct = total > 0 ? Math.min(100, Math.round((feito / total) * 100)) : 0;
    return `
      <div class="progress-block">
        <div class="progress-label"><span>${rotulo}</span><span class="val">${feito}/${total}${detalhe ? ` · ${detalhe}` : ''}</span></div>
        <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
      </div>`;
  }

  // Classificação da OMS. Aparece embaixo do número porque "39,2" sozinho não diz nada pra
  // quem não decorou as faixas — e é o profissional que lê isso.
  function faixaImcTexto(imc) {
    if (imc < 18.5) return 'abaixo do peso';
    if (imc < 25) return 'peso adequado';
    if (imc < 30) return 'sobrepeso';
    if (imc < 35) return 'obesidade grau I';
    if (imc < 40) return 'obesidade grau II';
    return 'obesidade grau III';
  }

  function tileHtml(rotulo, valor, unidade, rodape) {
    return `
      <div class="macro-box">
        <div class="macro-box-lbl">${rotulo}</div>
        <div class="macro-box-val">${valor}${unidade ? `<span> ${unidade}</span>` : ''}</div>
        ${rodape ? `<div class="macro-box-pct">${rodape}</div>` : ''}
      </div>`;
  }

  // ---------------- IMPORTAR PLANO COLADO (painel do profissional) ----------------
  // Bloco reaproveitado pelos dois formulários do painel (treino e plano alimentar). O
  // texto colado só PREENCHE a lista de montagem — quem envia pro paciente continua sendo
  // o botão "Enviar" de sempre, depois da conferência. Importar não prescreve.
  function importadorHtml({ id, rotulo, ajuda, exemplo, avisos }) {
    return `
      <details style="margin-bottom:10px">
        <summary class="meta" style="cursor:pointer;padding:4px 0"><strong>📋 ${rotulo}</strong></summary>
        <p class="meta" style="margin:6px 0">${ajuda}</p>
        <textarea id="${id}-texto" rows="8" placeholder="${Util.escapeHtml(exemplo)}"></textarea>
        <button class="secondary" id="${id}-ler" style="width:100%;margin-top:6px">Ler texto e montar</button>
        ${avisos && avisos.length ? `
          <div class="meta" style="margin-top:8px;border-left:3px solid var(--danger);padding-left:8px">
            <strong>${avisos.length} linha(s) não entraram:</strong>
            <ul style="margin:4px 0 0;padding-left:16px;line-height:1.5">${avisos.map(a => `<li>${Util.escapeHtml(a)}</li>`).join('')}</ul>
          </div>` : ''}
      </details>`;
  }

  const EXEMPLO_TREINO = `Treino A - Peito e tríceps
Supino reto com barra 4x10 20kg 90s
Supino inclinado com halteres 3x12 14kg
Tríceps corda 3x15 // cotovelo parado

Treino B - Costas e bíceps
Puxada frontal 4x10 35kg
Remada curvada 4x12 30kg`;

  const EXEMPLO_PLANO = `Café da manhã 07:00
Pão para hambúrguer 1un
Requeijão light 61% menos gordura 30g

Almoço 12:00
Arroz branco cozido 150g
Peito de frango grelhado 120g`;

  const EXEMPLO_MEDIDAS = `Data: 29/08/2026
Peso: 88,4 kg
Cintura: 92 cm
Abdômen: 98 cm
Quadril: 101 cm
Braço: 33 cm
Coxa: 58 cm
% gordura: 28`;

  // ---------------- NOTIFICAÇÕES (avisos do profissional pro paciente) ----------------
  const NOTIF_ICONES = {
    dieta: '🥗', plano: '🍽️', treino: '🏋️', corrida: '🏃',
    lista: '🛒', refeicaoLivre: '🍔', solicitacao: '📣', medidas: '📏',
  };
  // Pedidos levam o paciente direto pra tela onde ele resolve — um aviso que não leva
  // a lugar nenhum vira só barulho.
  const NOTIF_DESTINO = {
    medidas: { tab: 'medidas', rotulo: 'Registrar medidas' },
    // Aferição já lançada pela nutri: o paciente vai conferir, não preencher.
    medidasAferidas: { tab: 'medidas', rotulo: 'Ver minhas medidas' },
    peso: { tab: 'medidas', rotulo: 'Registrar peso' },
    fotos: { tab: 'mais', maisView: 'fotos', rotulo: 'Abrir Fotos' },
    exames: { tab: 'mais', maisView: 'exames', rotulo: 'Abrir Exames' },
  };

  // "há 2h" é mais útil que a data crua pra um aviso recente; acima de um dia, mostra a data.
  function quandoTexto(ms) {
    if (!ms) return '';
    const d = new Date(ms);
    const min = Math.floor((Date.now() - ms) / 60000);
    if (min < 1) return 'agora';
    if (min < 60) return `há ${min} min`;
    if (min < 60 * 24) return `há ${Math.floor(min / 60)}h`;
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    return `${dia}/${mes} às ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  function renderNotificacoes($app, state, api) {
    const lista = Storage.getAll('notificacoes').sort((a, b) => (b.criadoEm || 0) - (a.criadoEm || 0));
    const naoLidas = lista.filter(n => !n.lida).length;

    $app.innerHTML = `
      <div class="card">
        <div class="row" style="align-items:center;justify-content:space-between">
          <h2 style="margin:0">Notificações</h2>
          ${naoLidas > 0 ? '<button class="link" id="marcar-todas" style="font-size:0.8rem">marcar todas como lidas</button>' : ''}
        </div>
        ${lista.length === 0 ? `
          <div class="empty" style="margin-top:10px">Nenhuma notificação ainda.<br>
            <span style="font-size:0.8rem">Quando seu profissional enviar uma dieta, um treino ou pedir alguma coisa, aparece aqui.</span>
          </div>
        ` : lista.map(n => {
          const destino = n.tipoSolicitacao ? NOTIF_DESTINO[n.tipoSolicitacao] : null;
          return `
            <div class="notif-item ${n.lida ? '' : 'nao-lida'}">
              <div class="notif-icone">${NOTIF_ICONES[n.tipo] || '🔔'}</div>
              <div class="notif-corpo">
                <div class="notif-titulo">${Util.escapeHtml(n.titulo || '')}</div>
                ${n.texto ? `<div class="notif-texto">${Util.escapeHtml(n.texto)}</div>` : ''}
                <div class="notif-quando">${quandoTexto(n.criadoEm)}</div>
                ${destino ? `<button class="secondary" data-ir="${Util.escapeHtml(n.id)}" style="margin-top:8px;font-size:0.78rem;padding:6px 12px">${destino.rotulo}</button>` : ''}
              </div>
              <button class="link" data-del-notif="${Util.escapeHtml(n.id)}" aria-label="Remover">✕</button>
            </div>
          `;
        }).join('')}
      </div>
    `;

    const btnTodas = document.getElementById('marcar-todas');
    if (btnTodas) {
      btnTodas.addEventListener('click', () => {
        Storage.saveAll('notificacoes', Storage.getAll('notificacoes').map(n => ({ ...n, lida: true })));
        api.render();
      });
    }
    $app.querySelectorAll('[data-del-notif]').forEach(b => {
      b.addEventListener('click', () => { Storage.remove('notificacoes', b.dataset.delNotif); api.render(); });
    });
    $app.querySelectorAll('[data-ir]').forEach(b => {
      b.addEventListener('click', () => {
        const n = Storage.getAll('notificacoes').find(x => x.id === b.dataset.ir);
        const destino = n && n.tipoSolicitacao ? NOTIF_DESTINO[n.tipoSolicitacao] : null;
        if (!destino) return;
        Storage.update('notificacoes', n.id, { lida: true });
        state.tab = destino.tab;
        state.maisView = destino.maisView || null;
        api.render();
      });
    });

    // Abrir a tela já conta como ler. Marca depois de pintar, pra o destaque das novas
    // ainda aparecer nesta visita — se marcasse antes, o paciente nunca veria o realce.
    if (naoLidas > 0) {
      setTimeout(() => {
        Storage.saveAll('notificacoes', Storage.getAll('notificacoes').map(n => ({ ...n, lida: true })));
        if (typeof atualizarSino === 'function') atualizarSino();
      }, 1200);
    }
  }

  function contaCardHtml() {
    if (typeof Cloud === 'undefined' || !Cloud.isEnabled()) return '';
    const user = Cloud.currentUser();
    if (user) {
      const st = Cloud.getStatus();
      const stTxt = st === 'syncing' ? '⏳ sincronizando…' : st === 'error' ? '⚠️ erro ao sincronizar' : '✅ sincronizado';
      const ehAdmin = typeof Cloud.isAdmin === 'function' && Cloud.isAdmin();
      return `
        <div class="card">
          <h2>☁️ Conta e sincronização</h2>
          <p class="meta">Conectado como <strong>${Util.escapeHtml(user.email || user.displayName || 'usuário')}</strong>${ehAdmin ? ' <span class="badge pr">profissional</span>' : ''}</p>
          <p class="meta">${stTxt} — seus dados abrem em qualquer navegador com este login.</p>
          ${ehAdmin ? `<p class="meta">Seu ID: <code id="cloud-uid" style="font-size:0.72rem">${Util.escapeHtml(user.uid)}</code> <button class="secondary" id="cloud-copy-uid" style="padding:3px 8px;font-size:0.7rem">copiar</button></p>` : ''}
          ${ehAdmin ? '<button class="primary" id="cloud-admin" style="margin-top:6px">Abrir painel profissional</button>' : ''}
          <button class="secondary" id="cloud-logout" style="margin-top:8px">Sair</button>
        </div>
      `;
    }
    return `
      <div class="card">
        <h2>☁️ Sincronizar na nuvem</h2>
        <p class="meta">Entre para salvar seus dados na sua conta e abrir o app em qualquer navegador/aparelho.</p>
        ${Util.isInAppBrowser() ? '<p class="auth-warning">⚠️ Você abriu pelo navegador do WhatsApp/Instagram — o login com Google costuma falhar aqui. Toque em ⋯ → "Abrir no navegador" (Safari/Chrome), ou entre com e-mail e senha abaixo.</p>' : ''}
        <button class="primary" id="cloud-google">Entrar com Google</button>
        <div style="text-align:center;color:var(--text-muted);font-size:0.75rem;margin:10px 0">ou com e-mail</div>
        <input type="email" id="cloud-email" placeholder="seu@email.com" autocomplete="email">
        <input type="password" id="cloud-senha" placeholder="senha (mín. 6 caracteres)" autocomplete="current-password" style="margin-top:8px">
        <div class="row" style="margin-top:8px">
          <button class="secondary" id="cloud-entrar">Entrar</button>
          <button class="secondary" id="cloud-criar">Criar conta</button>
        </div>
        <p class="meta" id="cloud-erro" style="color:var(--danger);margin-top:8px"></p>
      </div>
    `;
  }

  function bindContaCard($app, api) {
    if (typeof Cloud === 'undefined' || !Cloud.isEnabled()) return;
    const erroEl = $app.querySelector('#cloud-erro');
    const showErro = e => {
      const map = {
        'auth/invalid-credential': 'E-mail ou senha incorretos.',
        'auth/wrong-password': 'Senha incorreta.',
        'auth/user-not-found': 'Conta não encontrada — use "Criar conta".',
        'auth/email-already-in-use': 'Este e-mail já tem conta — use "Entrar".',
        'auth/weak-password': 'Senha muito curta (mínimo 6 caracteres).',
        'auth/invalid-email': 'E-mail inválido.',
        'auth/popup-closed-by-user': 'Login cancelado.',
        'auth/unauthorized-domain': 'Domínio não autorizado no Firebase (configuração pendente).',
        'auth/missing-initial-state': 'O login com Google não funciona neste navegador (ex: aberto pelo WhatsApp/Instagram). Toque em ⋯ → "Abrir no navegador", ou entre com e-mail e senha abaixo.',
        'auth/web-storage-unsupported': 'Este navegador está bloqueando o armazenamento necessário pro login com Google. Toque em ⋯ → "Abrir no navegador" (Safari/Chrome), ou use e-mail e senha.',
        'auth/operation-not-supported-in-this-environment': 'O login com Google não é permitido neste navegador embutido. Abra o link no Safari/Chrome, ou use e-mail e senha.',
      };
      if (erroEl) erroEl.textContent = (e && map[e.code]) || (e && e.message) || 'Falha no login.';
    };
    const logoutBtn = $app.querySelector('#cloud-logout');
    if (logoutBtn) logoutBtn.addEventListener('click', () => { Cloud.logout(); });
    const copyBtn = $app.querySelector('#cloud-copy-uid');
    if (copyBtn) copyBtn.addEventListener('click', () => {
      const uid = Cloud.uid && Cloud.uid();
      if (uid && navigator.clipboard) navigator.clipboard.writeText(uid).then(() => { copyBtn.textContent = 'copiado!'; });
      else if (uid) { window.prompt('Seu ID (copie):', uid); }
    });
    const adminBtn = $app.querySelector('#cloud-admin');
    if (adminBtn) adminBtn.addEventListener('click', () => api.goToMais('admin'));
    const googleBtn = $app.querySelector('#cloud-google');
    if (googleBtn) googleBtn.addEventListener('click', () => { Cloud.loginGoogle().catch(showErro); });
    const entrarBtn = $app.querySelector('#cloud-entrar');
    if (entrarBtn) entrarBtn.addEventListener('click', () => {
      const email = $app.querySelector('#cloud-email').value.trim();
      const senha = $app.querySelector('#cloud-senha').value;
      Cloud.loginEmail(email, senha).catch(showErro);
    });
    const criarBtn = $app.querySelector('#cloud-criar');
    if (criarBtn) criarBtn.addEventListener('click', () => {
      const email = $app.querySelector('#cloud-email').value.trim();
      const senha = $app.querySelector('#cloud-senha').value;
      Cloud.signupEmail(email, senha).catch(showErro);
    });
  }

  // O app não segue mais o modo escuro do celular sozinho — é sempre claro a não ser
  // que a pessoa escolha escuro aqui. O <script> no <head> do index.html já aplica
  // esse valor salvo antes do CSS carregar, pra não dar flash de tela clara.
  function temaEscuroAtivo() {
    return localStorage.getItem('tema_escuro') === '1';
  }
  function aparenciaCardHtml() {
    const escuro = temaEscuroAtivo();
    return `
      <div class="card">
        <h2>🎨 Aparência</h2>
        <div class="row">
          <button class="secondary theme-btn ${!escuro ? 'active' : ''}" data-tema="claro">☀️ Claro</button>
          <button class="secondary theme-btn ${escuro ? 'active' : ''}" data-tema="escuro">🌙 Escuro</button>
        </div>
      </div>
    `;
  }
  function bindAparenciaCard($app, api) {
    $app.querySelectorAll('[data-tema]').forEach(btn => {
      btn.addEventListener('click', () => {
        const escuro = btn.dataset.tema === 'escuro';
        localStorage.setItem('tema_escuro', escuro ? '1' : '0');
        if (escuro) document.documentElement.setAttribute('data-theme', 'dark');
        else document.documentElement.removeAttribute('data-theme');
        api.render();
      });
    });
  }

  function renderMenu($app, state, api) {
    $app.innerHTML = `
      ${contaCardHtml()}
      ${aparenciaCardHtml()}
      <div class="card" style="padding:4px 16px">
        <div class="menu-list">
          ${MENU.map(m => `
            <button class="menu-item" data-go="${m.key}">
              <span class="icon">${m.icon}</span> ${m.label} <span class="chev">›</span>
            </button>
          `).join('')}
        </div>
      </div>
    `;
    bindContaCard($app, api);
    bindAparenciaCard($app, api);
    $app.querySelectorAll('[data-go]').forEach(btn => {
      btn.addEventListener('click', () => api.goToMais(btn.dataset.go));
    });
  }

  // ---------------- PERFIL ----------------
  function renderPerfil($app, state, api) {
    const perfil = Storage.getPerfil();
    const pesoAtual = Util.getPesoAtual();
    const isEmagrecimentoAtual = (perfil.dietaTemplate || '').startsWith('emagrecimento_');
    const nivelAtual = isEmagrecimentoAtual ? perfil.dietaTemplate : EMAGRECIMENTO_PADRAO;

    $app.innerHTML = `
      <div class="card">
        <h2>Seus dados</h2>
        <div class="row">
          ${Util.inputGroup({ id: 'p-peso', label: 'Peso (kg)', type: 'number', step: '0.1', value: perfil.peso ?? pesoAtual ?? '' })}
          ${Util.inputGroup({ id: 'p-altura', label: 'Altura (cm)', type: 'number', value: perfil.altura ?? '' })}
        </div>
        <div class="row">
          ${Util.inputGroup({ id: 'p-idade', label: 'Idade', type: 'number', value: perfil.idade ?? '' })}
          <div>
            <label>Sexo</label>
            <select id="p-sexo">
              <option value="masculino" ${perfil.sexo === 'masculino' ? 'selected' : ''}>Masculino</option>
              <option value="feminino" ${perfil.sexo === 'feminino' ? 'selected' : ''}>Feminino</option>
            </select>
          </div>
        </div>
        <label>Nível de atividade</label>
        <select id="p-atividade">
          ${NIVEIS_ATIVIDADE.map(n => `<option value="${n.id}" ${perfil.nivelAtividade === n.id ? 'selected' : ''}>${n.label}</option>`).join('')}
        </select>
        <label>Objetivo</label>
        <select id="p-dieta">
          <option value="emagrecimento" ${isEmagrecimentoAtual ? 'selected' : ''}>Emagrecimento</option>
          ${DIETA_TEMPLATES.filter(d => !d.id.startsWith('emagrecimento_')).map(d => `<option value="${d.id}" ${perfil.dietaTemplate === d.id ? 'selected' : ''}>${d.nome}</option>`).join('')}
          ${Storage.getAll('dietas_custom').map(d => `<option value="dc:${d.id}" ${perfil.dietaCustomId === d.id ? 'selected' : ''}>${Util.escapeHtml(d.nome)}</option>`).join('')}
          <option value="custom" ${perfil.metaCustom && !perfil.dietaCustomId ? 'selected' : ''}>Personalizado (definir eu mesmo)</option>
        </select>
        <div id="emagrecimento-nivel-fields" style="display:${isEmagrecimentoAtual ? '' : 'none'}">
          <label>Nível</label>
          <select id="p-emagrecimento-nivel">
            ${EMAGRECIMENTO_NIVEIS.map(n => `<option value="${n.id}" ${nivelAtual === n.id ? 'selected' : ''}>${n.nome.replace('Emagrecimento — ', '')}</option>`).join('')}
          </select>
        </div>
        <p class="meta" id="dieta-desc" style="color:var(--text-muted);font-size:0.78rem"></p>
        <button type="button" class="secondary" id="go-dietas-custom" style="margin:8px 0">+ Gerenciar minhas dietas</button>
        <div id="template-fields">
          <label>Estilo de macros</label>
          <select id="p-macro-style">
            ${MACRO_STYLES.map(m => `<option value="${m.id}" ${perfil.macroStyle === m.id ? 'selected' : ''}>${m.nome}</option>`).join('')}
          </select>
          <p class="meta" id="macro-style-desc" style="color:var(--text-muted);font-size:0.78rem"></p>
          <label>Estratégia alimentar</label>
          <select id="p-meal-strategy">
            ${MEAL_STRATEGIES.map(m => `<option value="${m.id}" ${perfil.mealStrategy === m.id ? 'selected' : ''}>${m.nome}</option>`).join('')}
          </select>
          <p class="meta" id="meal-strategy-desc" style="color:var(--text-muted);font-size:0.78rem"></p>
        </div>
        <div id="custom-fields" style="display:none">
          <div class="row">
            <div><label>Meta de calorias (kcal)</label><input type="number" id="p-kcal" value="${perfil.metaCustom?.kcal ?? ''}"></div>
            <div><label>Proteína (g)</label><input type="number" id="p-protein" value="${perfil.metaCustom?.protein ?? ''}"></div>
          </div>
          <div class="row">
            <div><label>Carboidrato (g)</label><input type="number" id="p-carb" value="${perfil.metaCustom?.carb ?? ''}"></div>
            <div><label>Gordura (g)</label><input type="number" id="p-fat" value="${perfil.metaCustom?.fat ?? ''}"></div>
          </div>
          <label>Fibras (g) — opcional</label>
          <input type="number" id="p-fiber" value="${perfil.metaCustom?.fiber ?? ''}">
        </div>
        <label>Em quantas refeições você quer dividir o dia</label>
        <input type="number" id="p-num-refeicoes" min="1" max="12" value="${perfil.numRefeicoes ?? 5}">
        <label>Meta de água (ml) — deixe em branco para calcular automaticamente (35ml × seu peso)</label>
        <input type="number" id="p-agua-meta" placeholder="${Math.round((perfil.peso || pesoAtual || 70) * 35)}" value="${perfil.aguaMetaCustom ?? ''}">
        <button class="primary" id="save-perfil">Salvar perfil</button>
      </div>
      <div class="card" id="preview-card"></div>
    `;

    const dietaSelect = document.getElementById('p-dieta');
    const nivelSelect = document.getElementById('p-emagrecimento-nivel');
    const nivelFields = document.getElementById('emagrecimento-nivel-fields');
    const customFields = document.getElementById('custom-fields');
    const templateFields = document.getElementById('template-fields');

    // "Emagrecimento" no select principal é só uma categoria — o valor de verdade (o nível
    // escolhido) vem do select secundário que só aparece quando essa categoria é selecionada.
    function dietaValResolvido() {
      return dietaSelect.value === 'emagrecimento' ? nivelSelect.value : dietaSelect.value;
    }

    function currentFormPerfil() {
      const dietaVal = dietaValResolvido();
      const isDietaCustom = dietaVal.startsWith('dc:');
      const p = {
        peso: Number(document.getElementById('p-peso').value) || null,
        altura: Number(document.getElementById('p-altura').value) || null,
        idade: Number(document.getElementById('p-idade').value) || null,
        sexo: document.getElementById('p-sexo').value,
        nivelAtividade: document.getElementById('p-atividade').value,
        dietaTemplate: (dietaVal === 'custom' || isDietaCustom) ? null : dietaVal,
        macroStyle: document.getElementById('p-macro-style').value,
        mealStrategy: document.getElementById('p-meal-strategy').value,
        numRefeicoes: Math.max(1, Number(document.getElementById('p-num-refeicoes').value) || 5),
        aguaMetaCustom: Number(document.getElementById('p-agua-meta').value) || null,
      };
      if (isDietaCustom) {
        p.dietaCustomId = dietaVal.slice(3);
      } else if (dietaVal === 'custom') {
        p.metaCustom = {
          kcal: Number(document.getElementById('p-kcal').value) || null,
          protein: Number(document.getElementById('p-protein').value) || null,
          carb: Number(document.getElementById('p-carb').value) || null,
          fat: Number(document.getElementById('p-fat').value) || null,
          fiber: Number(document.getElementById('p-fiber').value) || null,
        };
      }
      return p;
    }

    function updatePreview() {
      const isCustom = dietaSelect.value === 'custom';
      const isDietaCustom = dietaSelect.value.startsWith('dc:');
      customFields.style.display = isCustom ? '' : 'none';
      templateFields.style.display = (isCustom || isDietaCustom) ? 'none' : '';
      nivelFields.style.display = dietaSelect.value === 'emagrecimento' ? '' : 'none';

      const dietaTemplate = DIETA_TEMPLATES.find(d => d.id === dietaValResolvido());
      document.getElementById('dieta-desc').textContent = dietaTemplate ? dietaTemplate.descricao : '';

      const macroStyle = MACRO_STYLES.find(m => m.id === document.getElementById('p-macro-style').value);
      document.getElementById('macro-style-desc').textContent = macroStyle ? macroStyle.descricao : '';
      const mealStrategy = MEAL_STRATEGIES.find(m => m.id === document.getElementById('p-meal-strategy').value);
      document.getElementById('meal-strategy-desc').textContent = mealStrategy ? mealStrategy.dica : '';

      const formPerfil = currentFormPerfil();
      const meta = calcularMetas(formPerfil);
      const preview = document.getElementById('preview-card');
      if (!meta) {
        const aguaSemMeta = calcularMetaAgua(formPerfil);
        preview.innerHTML = `
          <p class="empty">Preencha peso, altura, idade e sexo para calcular sua meta de calorias.</p>
          ${aguaSemMeta ? `<p class="meta" style="text-align:center">Meta de água: ${aguaSemMeta}ml/dia</p>` : ''}
        `;
        return;
      }
      const numRefeicoes = Math.max(1, Number(document.getElementById('p-num-refeicoes').value) || 5);
      preview.innerHTML = `
        <h2>Sua meta calculada</h2>
        <div class="kcal-summary">
          <div><div class="num">${meta.bmr ?? '—'}</div><div class="lbl">BMR</div></div>
          <div><div class="num">${meta.tdee ?? '—'}</div><div class="lbl">TDEE</div></div>
          <div><div class="num">${meta.kcal}</div><div class="lbl">Meta kcal</div></div>
        </div>
        <p class="meta" style="text-align:center">Proteína ${meta.protein}g · Carboidrato ${meta.carb}g · Gordura ${meta.fat}g${meta.fiber ? ` · Fibras ${meta.fiber}g` : ''}</p>
        ${meta.tdee == null ? `<p class="meta" style="text-align:center;color:var(--text-muted);font-size:0.78rem">Preencha altura, idade, sexo e nível de atividade para calcular seu gasto (TDEE) e ver o déficit/superávit real.</p>` : ''}
        <p class="meta" style="text-align:center;margin-top:10px">Por refeição (÷${numRefeicoes}): ${Math.round(meta.kcal / numRefeicoes)} kcal · P ${Math.round(meta.protein / numRefeicoes)}g · C ${Math.round(meta.carb / numRefeicoes)}g · G ${Math.round(meta.fat / numRefeicoes)}g</p>
        <p class="meta" style="text-align:center">Meta de água: ${calcularMetaAgua(formPerfil) ?? '—'}ml/dia</p>
      `;
    }

    $app.querySelectorAll('#p-peso, #p-altura, #p-idade, #p-sexo, #p-atividade, #p-dieta, #p-emagrecimento-nivel, #p-macro-style, #p-meal-strategy, #p-num-refeicoes, #p-agua-meta, #p-kcal, #p-protein, #p-carb, #p-fat, #p-fiber').forEach(el => {
      el.addEventListener('input', updatePreview);
      el.addEventListener('change', updatePreview);
    });
    updatePreview();

    document.getElementById('save-perfil').addEventListener('click', () => {
      Storage.savePerfil(currentFormPerfil());
      alert('Perfil salvo!');
      api.render();
    });

    document.getElementById('go-dietas-custom').addEventListener('click', () => {
      api.goToMais('dietas-custom');
    });
  }

  // ---------------- REGRAS DA REFEIÇÃO LIVRE ----------------
  function renderRegrasRefeicaoLivre($app, state, api) {
    const cfg = RefeicaoLivre.getConfig();

    $app.innerHTML = `
      <div class="card">
        <h2>🍔 Regras da refeição livre</h2>
        <p class="meta">Ajuste como a semana (segunda a sexta) precisa ser batida pra liberar refeições livres no fim de semana, sem quebrar sua ofensiva.</p>

        <label>Calorias: no máximo quanto % acima da meta (por dia)?</label>
        <input type="number" id="rl-tolerancia" min="0" max="100" step="1" value="${cfg.toleranciaMaxPct}">
        <p class="meta" style="font-size:0.75rem">Ficar abaixo da meta nunca conta contra — só ultrapassar esse limite reprova o dia.</p>

        <label style="margin-top:10px">Refeições obrigatórias no dia</label>
        <div class="livre-refeicoes-check">
          ${RefeicaoLivre.TODAS_REFEICOES.map(r => `
            <label class="check-item">
              <input type="checkbox" data-rl-refeicao value="${Util.escapeHtml(r)}" ${cfg.refeicoesObrigatorias.includes(r) ? 'checked' : ''}>
              ${Util.escapeHtml(r)}
            </label>
          `).join('')}
        </div>

        <label style="margin-top:10px">Água: em pelo menos quanto % dos dias da semana (seg-dom)?</label>
        <input type="number" id="rl-agua" min="0" max="100" step="1" value="${cfg.aguaPercentMin}">

        <label style="margin-top:10px">Quantas refeições livres por semana</label>
        <input type="number" id="rl-usos" min="1" max="7" step="1" value="${cfg.maxUsosSemana}">

        <div class="row" style="margin-top:12px">
          <button class="secondary" id="rl-restaurar">Restaurar padrão</button>
          <button class="primary" id="rl-salvar">Salvar regras</button>
        </div>
      </div>
    `;

    function preencherCampos(c) {
      document.getElementById('rl-tolerancia').value = c.toleranciaMaxPct;
      document.getElementById('rl-agua').value = c.aguaPercentMin;
      document.getElementById('rl-usos').value = c.maxUsosSemana;
      $app.querySelectorAll('[data-rl-refeicao]').forEach(chk => {
        chk.checked = c.refeicoesObrigatorias.includes(chk.value);
      });
    }

    document.getElementById('rl-salvar').addEventListener('click', () => {
      const refeicoesObrigatorias = Array.from($app.querySelectorAll('[data-rl-refeicao]:checked')).map(chk => chk.value);
      const novaConfig = {
        toleranciaMaxPct: Math.max(0, Number(document.getElementById('rl-tolerancia').value) || 0),
        refeicoesObrigatorias,
        aguaPercentMin: Math.min(100, Math.max(0, Number(document.getElementById('rl-agua').value) || 0)),
        maxUsosSemana: Math.max(1, Number(document.getElementById('rl-usos').value) || 1),
      };
      RefeicaoLivre.saveConfig(novaConfig);
      alert('Regras da refeição livre salvas!');
      api.render();
    });

    document.getElementById('rl-restaurar').addEventListener('click', () => {
      preencherCampos(RefeicaoLivre.CONFIG_PADRAO);
    });
  }

  // ---------------- MINHAS DIETAS (personalizadas nomeadas) ----------------
  // Pacote pessoal do dono do app (mesma regra de visibilidade da ficha do Bronyer em
  // Planos de Treino): carrega metas + as refeições como combos de uma vez.
  function souDonoDoApp() {
    return typeof Cloud === 'undefined' || !Cloud.isEnabled()
      || (typeof Cloud.isSuperAdmin === 'function' && Cloud.isSuperAdmin());
  }
  function temDietaPronta() {
    return souDonoDoApp() && (typeof DIETA_VICTOR !== 'undefined' || typeof META_VICTOR !== 'undefined');
  }

  // Tela raiz: os dois caminhos (pacote pronto ou digitar as metas) e as dietas já salvas.
  // Mesmo desenho de Planos de Treino — a escolha vem antes do formulário, não depois de
  // rolar por ele.
  function renderDietasCustom($app, state, api) {
    const dietas = Storage.getAll('dietas_custom');
    const perfil = Storage.getPerfil();

    $app.innerHTML = `
      <div class="card">
        <p class="meta">Uma dieta salva vira opção no <strong>Objetivo</strong> do seu Perfil — é ela que passa a definir as metas de calorias e macros do seu dia.</p>
      </div>
      ${menuCardHtml([
        ...(temDietaPronta() ? [escolhaHtml('id="ir-dieta-pacotes"', '📦', 'Usar uma dieta pronta', 'Carrega as metas e já cria as refeições como combos.')] : []),
        escolhaHtml('id="ir-dieta-nova"', '✏️', 'Criar minha própria dieta', 'Você digita as metas de calorias e macros.'),
      ])}
      <div class="card">
        <h2>Dietas salvas (${dietas.length})</h2>
        <div id="dietas-custom-list">
          ${dietas.length === 0 ? '<div class="empty">Nenhuma dieta salva ainda. Escolha uma das opções acima pra começar.</div>' : dietas.map(d => `
            <div class="list-item" data-id="${d.id}">
              <div>
                <div>${Util.escapeHtml(d.nome)} ${perfil.dietaCustomId === d.id ? '<span class="badge pr">Em uso</span>' : ''}</div>
                <div class="meta">${d.kcal} kcal · P ${d.protein}g · C ${d.carb}g · G ${d.fat}g${d.fiber ? ` · Fibras ${d.fiber}g` : ''}</div>
              </div>
              <div style="display:flex;gap:6px">
                <button class="secondary" data-usar="${d.id}" style="font-size:0.75rem;padding:6px 10px">Usar</button>
                <button class="link" data-remove-dieta="${d.id}">✕</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    const btnPacotes = document.getElementById('ir-dieta-pacotes');
    if (btnPacotes) btnPacotes.addEventListener('click', () => api.goToMais('dieta-pacotes'));
    document.getElementById('ir-dieta-nova').addEventListener('click', () => api.goToMais('dieta-nova'));

    $app.querySelectorAll('[data-usar]').forEach(btn => {
      btn.addEventListener('click', () => {
        Storage.savePerfil({ ...perfil, dietaTemplate: null, metaCustom: null, dietaCustomId: btn.dataset.usar });
        alert('Dieta selecionada como objetivo atual!');
        api.render();
      });
    });

    $app.querySelectorAll('[data-remove-dieta]').forEach(btn => {
      btn.addEventListener('click', () => {
        Storage.remove('dietas_custom', btn.dataset.removeDieta);
        api.render();
      });
    });
  }

  function renderDietaNova($app, state, api) {
    $app.innerHTML = `
      <div class="card">
        <p class="meta">Salve um plano recebido de nutricionista (ou outra meta fixa) com um nome, pra escolher depois no Objetivo do seu Perfil.</p>
        <label>Nome</label>
        <input type="text" id="dc-nome" placeholder="Ex: Dieta do mês 08/2026">
        <div class="row">
          <div><label>Calorias (kcal)</label><input type="number" id="dc-kcal"></div>
          <div><label>Proteína (g)</label><input type="number" id="dc-protein"></div>
        </div>
        <div class="row">
          <div><label>Carboidrato (g)</label><input type="number" id="dc-carb"></div>
          <div><label>Gordura (g)</label><input type="number" id="dc-fat"></div>
        </div>
        <label>Fibras (g) — opcional</label>
        <input type="number" id="dc-fiber">
        <button class="primary" id="save-dieta-custom" style="margin-top:10px">Salvar dieta</button>
      </div>
    `;

    document.getElementById('save-dieta-custom').addEventListener('click', () => {
      const nome = document.getElementById('dc-nome').value.trim();
      const kcal = Number(document.getElementById('dc-kcal').value) || null;
      if (!nome || !kcal) return;
      Storage.add('dietas_custom', {
        nome,
        kcal,
        protein: Number(document.getElementById('dc-protein').value) || null,
        carb: Number(document.getElementById('dc-carb').value) || null,
        fat: Number(document.getElementById('dc-fat').value) || null,
        fiber: Number(document.getElementById('dc-fiber').value) || null,
      });
      api.back();
    });
  }

  function renderDietaPacotes($app, state, api) {
    const dietas = Storage.getAll('dietas_custom');
    const temPacote = typeof DIETA_VICTOR !== 'undefined';
    const pacoteJaCarregado = temPacote && dietas.some(d => d.fonte === DIETA_VICTOR.fonte);

    $app.innerHTML = `
      ${temPacote ? `
        <div class="card">
          <h2>📋 ${Util.escapeHtml(DIETA_VICTOR.dieta.nome)}</h2>
          <p class="meta">${DIETA_VICTOR.dieta.kcal} kcal · P ${DIETA_VICTOR.dieta.protein}g · C ${DIETA_VICTOR.dieta.carb}g · G ${DIETA_VICTOR.dieta.fat}g · F ${DIETA_VICTOR.dieta.fiber}g · ${DIETA_VICTOR.aguaMetaMl / 1000}L de água</p>
          <p class="meta">Por ${Util.escapeHtml(DIETA_VICTOR.profissional)}. Macros transcritos do PDF, alimento por alimento.</p>
          <p class="meta" style="border-left:3px solid var(--accent);padding-left:8px">
            A meta de ${DIETA_VICTOR.dieta.kcal} kcal é a <strong>média semanal</strong>: as 5 refeições somam
            <strong>${DIETA_VICTOR.kcalDiaNormal} kcal</strong> e a refeição livre (${DIETA_VICTOR.refeicaoLivre.kcal} kcal, ${DIETA_VICTOR.refeicaoLivre.porSemana}x/semana)
            entra diluída por 7 dias. Em dia normal você fecha em ${DIETA_VICTOR.kcalDiaNormal} kcal.
            A livre <strong>substitui</strong> uma das 5 refeições, não se soma a elas.
          </p>
          <p class="meta">Carrega a dieta como objetivo e cria as ${DIETA_VICTOR.combos.length} refeições como combos, prontos pra lançar em um toque.</p>
          <button class="${pacoteJaCarregado ? 'secondary' : 'primary'}" id="carregar-dieta-victor" style="margin-top:8px">
            ${pacoteJaCarregado ? 'Recarregar (atualiza o que já existe)' : 'Carregar minha dieta'}
          </button>
          <details style="margin-top:10px">
            <summary class="meta">Suplementação</summary>
            <ul class="meta" style="margin:6px 0 0;padding-left:18px;line-height:1.5">
              ${DIETA_VICTOR.suplementos.map(s => `<li>${Util.escapeHtml(s)}</li>`).join('')}
            </ul>
          </details>
          <details style="margin-top:6px">
            <summary class="meta">Substituições e observações do plano</summary>
            <ul class="meta" style="margin:6px 0 0;padding-left:18px;line-height:1.5">
              ${DIETA_VICTOR.observacoes.map(o => `<li>${Util.escapeHtml(o)}</li>`).join('')}
            </ul>
          </details>
        </div>
      ` : ''}
      ${typeof META_VICTOR !== 'undefined' ? `
        <div class="card">
          <h2>🧮 ${Util.escapeHtml(META_VICTOR.meta.nome)}</h2>
          <p class="meta">${META_VICTOR.meta.kcal} kcal · P ${META_VICTOR.meta.protein}g · C ${META_VICTOR.meta.carb}g · G ${META_VICTOR.meta.fat}g${META_VICTOR.meta.fiber ? ` · F ${META_VICTOR.meta.fiber}g` : ''}</p>
          ${META_VICTOR.refeicaoLivre ? `
            <p class="meta" style="border-left:3px solid var(--accent);padding-left:8px">
              As ${META_VICTOR.meta.kcal} kcal são do <strong>dia normal</strong>. A refeição livre
              (<strong>${META_VICTOR.refeicaoLivre.kcal} kcal</strong>, ${META_VICTOR.refeicaoLivre.porSemana}x/semana)
              <strong>substitui</strong> uma das refeições, não se soma a elas — com ela, a média da semana fica em ~1840 kcal.
            </p>` : ''}
          <p class="meta" style="border-left:3px solid var(--accent);padding-left:8px">${Util.escapeHtml(META_VICTOR.disclaimer)}</p>
          <p class="meta">Carrega a meta como objetivo e atualiza as ${META_VICTOR.combos.length} refeições como combos (mesmos horários da dieta do Matheus, com variantes intercambiáveis em cada um). Refeição que saiu do cardápio some da lista.</p>
          <button class="${dietas.some(d => d.fonte === META_VICTOR.fonte) ? 'secondary' : 'primary'}" id="carregar-meta-victor" style="margin-top:8px">
            ${dietas.some(d => d.fonte === META_VICTOR.fonte) ? 'Recarregar (atualiza o que já existe)' : 'Carregar minha meta'}
          </button>
          <details style="margin-top:10px">
            <summary class="meta">Como cheguei nesses números</summary>
            <ul class="meta" style="margin:6px 0 0;padding-left:18px;line-height:1.5">
              ${META_VICTOR.baseCalculo.map(o => `<li>${Util.escapeHtml(o)}</li>`).join('')}
            </ul>
          </details>
        </div>
      ` : ''}
    `;

    const btnPacote = document.getElementById('carregar-dieta-victor');
    if (btnPacote) {
      btnPacote.addEventListener('click', () => {
        // Upsert por nome nos dois lados: recarregar atualiza o que já existe em vez de
        // criar uma segunda cópia de tudo.
        const existente = Storage.getAll('dietas_custom').find(d => d.fonte === DIETA_VICTOR.fonte);
        let dietaId;
        if (existente) {
          Storage.update('dietas_custom', existente.id, { ...DIETA_VICTOR.dieta, fonte: DIETA_VICTOR.fonte });
          dietaId = existente.id;
        } else {
          dietaId = Storage.add('dietas_custom', { ...DIETA_VICTOR.dieta, fonte: DIETA_VICTOR.fonte }).id;
        }

        const combos = Storage.getAll('combos');
        DIETA_VICTOR.combos.forEach(c => {
          const novo = { nome: c.nome, horario: c.horario, itens: c.itens.map(i => ({ ...i })), fonte: DIETA_VICTOR.fonte };
          const j = combos.findIndex(x => (x.nome || '').trim().toLowerCase() === c.nome.trim().toLowerCase());
          if (j >= 0) { novo.id = combos[j].id; combos[j] = novo; }
          else { novo.id = Storage.uid(); combos.push(novo); }
        });
        Storage.saveAll('combos', combos);

        // Seleciona como objetivo atual e aplica a meta de água prescrita.
        const p = Storage.getPerfil();
        Storage.savePerfil({ ...p, dietaTemplate: null, metaCustom: null, dietaCustomId: dietaId, aguaMetaCustom: DIETA_VICTOR.aguaMetaMl });

        // O resumo saía num <p> da própria tela — que o api.render() seguinte repintava no
        // mesmo instante, então nunca chegava a ser lido. Agora avisa e volta pra lista, onde
        // a dieta aparece marcada como "Em uso".
        alert(`✅ Dieta aplicada como objetivo, ${DIETA_VICTOR.combos.length} combos criados e meta de água em ${DIETA_VICTOR.aguaMetaMl / 1000}L.`);
        api.back();
      });
    }

    const btnMeta = document.getElementById('carregar-meta-victor');
    if (btnMeta) {
      btnMeta.addEventListener('click', () => {
        const existente = Storage.getAll('dietas_custom').find(d => d.fonte === META_VICTOR.fonte);
        let dietaId;
        if (existente) {
          Storage.update('dietas_custom', existente.id, { ...META_VICTOR.meta, fonte: META_VICTOR.fonte });
          dietaId = existente.id;
        } else {
          dietaId = Storage.add('dietas_custom', { ...META_VICTOR.meta, fonte: META_VICTOR.fonte }).id;
        }

        // Casa primeiro por nome dentro da própria fonte (recarregar é idempotente, mesmo
        // havendo várias variantes no mesmo horário — batata/arroz/arroz+feijão). Só na
        // primeira migração (vindo da fonte antiga do Matheus) casa por horário — e cada
        // combo antigo só pode ser reaproveitado por UMA variante nova, pra três variantes
        // do mesmo horário não brigarem pelo mesmo id.
        const combos = Storage.getAll('combos');
        const idsUsadosNesteCarregamento = new Set();
        META_VICTOR.combos.forEach(c => {
          const novo = { nome: c.nome, horario: c.horario, itens: c.itens.map(i => ({ ...i })), fonte: META_VICTOR.fonte };
          let j = combos.findIndex(x => x.fonte === META_VICTOR.fonte && (x.nome || '').trim().toLowerCase() === c.nome.trim().toLowerCase());
          if (j < 0) j = combos.findIndex(x => x.fonte === META_VICTOR.fonte && (x.horario || '') === c.horario && !idsUsadosNesteCarregamento.has(x.id));
          if (j < 0) j = combos.findIndex(x => typeof DIETA_VICTOR !== 'undefined' && x.fonte === DIETA_VICTOR.fonte && (x.horario || '') === c.horario && !idsUsadosNesteCarregamento.has(x.id));
          if (j < 0) j = combos.findIndex(x => (x.nome || '').trim().toLowerCase() === c.nome.trim().toLowerCase());
          if (j >= 0) { novo.id = combos[j].id; combos[j] = novo; }
          else { novo.id = Storage.uid(); combos.push(novo); }
          // Marca como usado nos dois casos — senão uma variante recém-criada neste mesmo
          // carregamento (ex: R3 Batata) fica "livre" e a próxima do mesmo horário (R3 Arroz)
          // rouba o id dela em vez de criar a sua própria.
          idsUsadosNesteCarregamento.add(novo.id);
        });
        // Tira da lista o que sobrou de cargas anteriores DESTA fonte e não existe mais no
        // cardápio (ex: as três variantes antigas de jantar com tilápia, aposentadas em
        // 30/08). Sem isso o upsert só cria e atualiza, e o menu ia acumulando refeição
        // velha pra sempre. Só mexe nos combos desta fonte — os do Matheus e os que o
        // Victor montou na mão ficam intactos.
        const limpos = combos.filter(x => x.fonte !== META_VICTOR.fonte || idsUsadosNesteCarregamento.has(x.id));
        Storage.saveAll('combos', limpos);

        // Não mexe na meta de água — essa decisão é independente da meta calórica.
        const p = Storage.getPerfil();
        Storage.savePerfil({ ...p, dietaTemplate: null, metaCustom: null, dietaCustomId: dietaId });

        alert(`✅ Meta aplicada como objetivo e ${META_VICTOR.combos.length} refeições atualizadas como combos.`);
        api.back();
      });
    }
  }

  // ---------------- BIBLIOTECA DE ALIMENTOS ----------------
  // Tela raiz é a LISTA: 99% das visitas aqui são pra consultar ou apagar algo. Os dois
  // formulários (cadastrar com a tabela inteira, sugerir receita pro nutri) saíram de cima
  // da lista e viraram telas próprias — antes era preciso rolar dois formulários longos
  // pra chegar na busca.
  function renderBibliotecaAlimentos($app, state, api) {
    const lib = Storage.getAll('alimentos_biblioteca').sort((a, b) => a.name.localeCompare(b.name));
    $app.innerHTML = `
      ${menuCardHtml([
        escolhaHtml('id="ir-alimento-novo"', '✏️', 'Cadastrar um alimento', 'Você copia a tabela nutricional do rótulo.'),
        escolhaHtml('id="ir-receita"', '🍲', 'Sugerir uma receita', 'Escreva os ingredientes e seu profissional monta a conta.'),
      ])}
      <div class="card">
        <h2>Alimentos cadastrados (${lib.length})</h2>
        <input type="text" id="food-filter" placeholder="Buscar..." style="margin-bottom:10px">
        <div id="food-lib-list">${libListHtml(lib)}</div>
      </div>
    `;

    document.getElementById('ir-alimento-novo').addEventListener('click', () => api.goToMais('alimento-novo'));
    document.getElementById('ir-receita').addEventListener('click', () => api.goToMais('receita-sugerir'));

    document.getElementById('food-filter').addEventListener('input', e => {
      const q = e.target.value.trim().toLowerCase();
      document.getElementById('food-lib-list').innerHTML = libListHtml(lib.filter(f => f.name.toLowerCase().includes(q)));
      attachDelete();
    });

    function attachDelete() {
      $app.querySelectorAll('[data-del-food]').forEach(btn => {
        btn.addEventListener('click', () => {
          Storage.remove('alimentos_biblioteca', btn.dataset.delFood);
          api.render();
        });
      });
    }
    attachDelete();
  }

  function renderAlimentoNovo($app, state, api) {
    $app.innerHTML = `
      <div class="card">
        <p class="meta">Copie os valores como estão no rótulo e informe a que porção eles se referem — o app reescala sozinho quando você pesar outra quantidade.</p>
        <label>Nome</label>
        <input type="text" id="f-name" placeholder="Ex: Arroz branco cozido">
        <div class="row">
          <div><label>Porção (rótulo)</label><input type="text" id="f-portionLabel" placeholder="100g"></div>
          <div><label>Porção (gramas)</label><input type="number" id="f-portionGrams" placeholder="100"></div>
        </div>
        <label>Tabela nutricional (valores por porção acima)</label>
        <div class="nutri-grid">
          ${nutriInput('kcal', 'Calorias (kcal)')}
          ${nutriInput('protein', 'Proteína (g)')}
          ${nutriInput('carbs', 'Carboidratos (g)')}
          ${nutriInput('sugars', 'Açúcares (g)')}
          ${nutriInput('fat', 'Gorduras totais (g)')}
          ${nutriInput('satFat', 'Gorduras saturadas (g)')}
          ${nutriInput('transFat', 'Gorduras trans (g)')}
          ${nutriInput('fiber', 'Fibra alimentar (g)')}
          ${nutriInput('sodium', 'Sódio (mg)')}
        </div>
        <button class="primary" id="add-food">Adicionar à biblioteca</button>
      </div>
    `;

    document.getElementById('add-food').addEventListener('click', () => {
      const name = document.getElementById('f-name').value.trim();
      const portionLabel = document.getElementById('f-portionLabel').value.trim() || '100g';
      const portionGrams = Number(document.getElementById('f-portionGrams').value) || 100;
      if (!name) return;
      const entry = { name, portionLabel, portionGrams, custom: true };
      ['kcal', 'protein', 'carbs', 'sugars', 'fat', 'satFat', 'transFat', 'fiber', 'sodium'].forEach(k => {
        entry[k] = Number(document.getElementById(`f-${k}`).value) || 0;
      });
      Storage.add('alimentos_biblioteca', entry);
      // Volta pra lista: é lá que dá pra ver o alimento cadastrado, e ficar num formulário
      // já limpo não dá nenhum sinal de que deu certo.
      api.back();
    });
  }

  // Sugerir receita: o paciente só escreve nome + ingredientes. Quem monta a conta
  // (ingrediente por ingrediente + peso final) e decide o que entra na biblioteca é o
  // admin/nutri, no painel dele — ver renderAdmin/carregarReceitas.
  function renderReceitaSugerir($app, state, api) {
    $app.innerHTML = `
      <div class="card">
        <p class="meta">Escreva o nome e a lista de ingredientes (com quantidade, se souber) — seu profissional revisa, monta a conta certinha e adiciona à biblioteca. Assim que atendida, ela avisa.</p>
        <label>Nome da receita</label>
        <input type="text" id="rc-nome" placeholder="Ex: Frango com quinoa da vovó">
        <label>Ingredientes</label>
        <textarea id="rc-ingredientes" rows="5" placeholder="Ex:&#10;200g de peito de frango&#10;1 xícara de quinoa cozida&#10;1 colher de azeite&#10;..."></textarea>
        <button class="primary" id="rc-enviar" style="margin-top:8px">Enviar sugestão</button>
      </div>
    `;

    document.getElementById('rc-enviar').addEventListener('click', async () => {
      const nome = document.getElementById('rc-nome').value.trim();
      const ingredientes = document.getElementById('rc-ingredientes').value.trim();
      if (!nome || !ingredientes) {
        alert('Escreva o nome da receita e a lista de ingredientes.');
        return;
      }
      if (typeof Cloud === 'undefined' || !Cloud.isEnabled() || !Cloud.currentUser()) {
        alert('Pra sugerir uma receita você precisa estar conectado (entre com sua conta em Mais). Assim seu profissional consegue ver e adicionar à biblioteca.');
        return;
      }
      try {
        await Cloud.sugerirReceita(nome, ingredientes);
        alert('Receita enviada! Assim que ela for montada e aprovada, você recebe aviso.');
        api.back();
      } catch (e) {
        alert('Não deu pra enviar agora — tenta de novo em instantes.');
      }
    });
  }

  function nutriInput(key, label) {
    return `<div><label>${label}</label><input type="number" step="0.1" id="f-${key}"></div>`;
  }

  function libListHtml(list) {
    if (list.length === 0) return '<div class="empty">Nenhum alimento encontrado</div>';
    return list.map(f => `
      <div class="list-item" data-id="${f.id}">
        <div>
          <strong>${Util.escapeHtml(f.name)}</strong>
          <div class="meta">${f.kcal} kcal / ${f.portionLabel} · P ${f.protein}g C ${f.carbs}g G ${f.fat}g</div>
        </div>
        <button class="link" data-del-food="${f.id}">✕</button>
      </div>
    `).join('');
  }

  // ---------------- BIBLIOTECA DE EXERCÍCIOS ----------------
  function renderBibliotecaExercicios($app, state, api) {
    const lib = Storage.getAll('exercicios_biblioteca').sort((a, b) => a.grupo.localeCompare(b.grupo) || a.name.localeCompare(b.name));
    $app.innerHTML = `
      ${menuCardHtml([
        escolhaHtml('id="ir-exercicio-novo"', '✏️', 'Cadastrar um exercício', 'Nome, grupo muscular, equipamento e link do vídeo.'),
      ])}
      <div class="card">
        <h2>Exercícios cadastrados (${lib.length})</h2>
        <div class="chip-group" id="grupo-filter">
          <button class="chip active" data-grupo="todos">Todos</button>
          ${GRUPOS_MUSCULARES.map(g => `<button class="chip" data-grupo="${g}">${g}</button>`).join('')}
        </div>
        <div id="exercicio-lib-list">${exercicioListHtml(lib)}</div>
      </div>
    `;

    function attachDelete() {
      $app.querySelectorAll('[data-del-ex]').forEach(btn => {
        btn.addEventListener('click', () => {
          Storage.remove('exercicios_biblioteca', btn.dataset.delEx);
          api.render();
        });
      });
    }
    attachDelete();

    // Permite corrigir o grupo muscular de exercícios já cadastrados (ex: os que foram
    // digitados livremente durante um treino e nunca tiveram grupo definido) sem precisar
    // apagar e recriar — assim que salvo, a ilustração do músculo já aparece.
    function attachGrupoSelect() {
      $app.querySelectorAll('[data-grupo-ex]').forEach(sel => {
        sel.addEventListener('change', () => {
          Storage.update('exercicios_biblioteca', sel.dataset.grupoEx, { grupo: sel.value });
          api.render();
        });
      });
    }
    attachGrupoSelect();

    $app.querySelectorAll('#grupo-filter .chip').forEach(chip => {
      chip.addEventListener('click', () => {
        $app.querySelectorAll('#grupo-filter .chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const grupo = chip.dataset.grupo;
        const filtered = grupo === 'todos' ? lib : lib.filter(e => e.grupo === grupo);
        document.getElementById('exercicio-lib-list').innerHTML = exercicioListHtml(filtered);
        attachDelete();
        attachEditLink();
        attachGrupoSelect();
      });
    });

    document.getElementById('ir-exercicio-novo').addEventListener('click', () => api.goToMais('exercicio-novo'));

    function attachEditLink() {
      $app.querySelectorAll('[data-edit-link]').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.editLink;
          const atual = lib.find(e => e.id === id);
          const novoLink = prompt('Cole o link do vídeo (deixe em branco para voltar a usar a busca automática do YouTube):', atual?.videoUrl || '');
          if (novoLink === null) return;
          const link = novoLink.trim();
          Storage.update('exercicios_biblioteca', id, { videoUrl: link });
          if (link && atual && typeof Cloud !== 'undefined' && Cloud.isEnabled() && Cloud.sugerirVideo) Cloud.sugerirVideo(atual.name, link);
          api.render();
        });
      });
    }
    attachEditLink();
  }

  function renderExercicioNovo($app, state, api) {
    $app.innerHTML = `
      <div class="card">
        <p class="meta">O grupo muscular define a ilustração que aparece no treino. Sem link de vídeo, o app cai numa busca automática pelo nome no YouTube.</p>
        <label>Nome</label>
        <input type="text" id="e-name" placeholder="Ex: Supino reto com barra">
        <div class="row">
          <div>
            <label>Grupo muscular</label>
            <select id="e-grupo">${GRUPOS_MUSCULARES.map(g => `<option value="${g}">${g}</option>`).join('')}</select>
          </div>
          <div><label>Equipamento</label><input type="text" id="e-equipamento" placeholder="Ex: Barra"></div>
        </div>
        <label>Link do vídeo (opcional)</label>
        <input type="text" id="e-video" placeholder="Cole aqui um link do YouTube ou outro site">
        <button class="primary" id="add-exercicio">Adicionar à biblioteca</button>
      </div>
    `;

    document.getElementById('add-exercicio').addEventListener('click', () => {
      const name = document.getElementById('e-name').value.trim();
      const grupo = document.getElementById('e-grupo').value;
      const equipamento = document.getElementById('e-equipamento').value.trim();
      const videoUrl = document.getElementById('e-video').value.trim();
      if (!name) return;
      Storage.add('exercicios_biblioteca', { name, grupo, equipamento, videoUrl, custom: true });
      if (videoUrl && typeof Cloud !== 'undefined' && Cloud.isEnabled() && Cloud.sugerirVideo) Cloud.sugerirVideo(name, videoUrl);
      api.back();
    });
  }

  function exercicioListHtml(list) {
    if (list.length === 0) return '<div class="empty">Nenhum exercício encontrado</div>';
    return list.map(e => {
      const img = GRUPO_ICONE_PATH[e.grupo];
      const thumbConteudo = img
        ? `<img src="${img}" alt="${Util.escapeHtml(e.grupo)}" class="ex-thumb-img">`
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 12h12"/><rect x="2.5" y="9" width="3" height="6" rx="1"/><rect x="18.5" y="9" width="3" height="6" rx="1"/><rect x="5.5" y="7" width="2" height="10" rx="1"/><rect x="16.5" y="7" width="2" height="10" rx="1"/></svg>';
      return `
      <div class="list-item" data-id="${e.id}">
        <div style="display:flex;align-items:center;gap:10px">
          <span class="ex-thumb" style="position:static">${thumbConteudo}</span>
          <div>
            <strong>${Util.escapeHtml(e.name)}</strong>
            <div class="meta" style="display:flex;align-items:center;gap:4px;flex-wrap:wrap">
              <select class="grupo-inline-select" data-grupo-ex="${e.id}" style="width:auto;padding:2px 6px;font-size:0.78rem">
                ${!e.grupo ? '<option value="">— sem grupo —</option>' : ''}
                ${GRUPOS_MUSCULARES.map(g => `<option value="${g}" ${g === e.grupo ? 'selected' : ''}>${g}</option>`).join('')}
              </select>
              ${e.equipamento ? '· ' + Util.escapeHtml(e.equipamento) : ''}
            </div>
            <a href="${e.videoUrl || Util.youtubeSearchUrl(e.name)}" target="_blank" rel="noopener" class="meta" style="color:var(--accent)">▶ Ver vídeo${e.videoUrl ? '' : ' (busca automática)'}</a>
            · <button class="link" data-edit-link="${e.id}" style="color:var(--text-muted)">${e.videoUrl ? 'editar link' : 'definir link'}</button>
          </div>
        </div>
        <button class="link" data-del-ex="${e.id}">✕</button>
      </div>
    `;
    }).join('');
  }

  // ---------------- PLANOS DE TREINO ----------------
  // As fichas pessoais do Victor (Bronyer, MFIT) só aparecem pra ele — não são pacotes
  // genéricos do app (flag pessoal: true na entrada de TREINOS_PREDEFINIDOS).
  function pacotesVisiveis() {
    return Object.keys(TREINOS_PREDEFINIDOS).filter(id => souDonoDoApp() || !TREINOS_PREDEFINIDOS[id].pessoal);
  }
  function rotuloPacote(id) {
    const dieta = DIETA_TEMPLATES.find(d => d.id === id);
    return dieta ? `${dieta.nome} — ${TREINOS_PREDEFINIDOS[id].label}` : TREINOS_PREDEFINIDOS[id].label;
  }

  // Tela raiz de Planos de Treino: os dois caminhos (pacote pronto ou montar do zero) viraram
  // escolhas explícitas em vez de um dropdown escondido num card e um botão no rodapé. Cada
  // uma abre a própria tela, com voltar no topo — quem chega aqui pela primeira vez precisa
  // entender que existem dois caminhos antes de escolher um.
  function renderPlanosTreino($app, state, api) {
    const planos = Storage.getAll('treino_planos').sort((a, b) => a.ordem - b.ordem);

    $app.innerHTML = `
      <div class="card">
        <p class="meta">Monte seus treinos (ex: A, B, C) e o app sugere automaticamente qual vem a seguir, em rotação, com base no último que você registrou — não importa o dia da semana.</p>
      </div>
      ${menuCardHtml([
        escolhaHtml('id="ir-pacotes"', '📦', 'Usar um pacote pronto', 'Treinos já montados por objetivo. Dá pra editar tudo depois.'),
        escolhaHtml('id="criar-plano"', '✏️', 'Criar meu próprio treino', 'Você escolhe os exercícios, séries e cargas do zero.'),
      ])}
      ${planos.length ? `
        <div class="card" style="padding:4px 16px">
          <div class="menu-list">
            ${planos.map(p => `
              <button class="menu-item" data-plano="${Util.escapeHtml(p.id)}" style="align-items:flex-start;text-align:left">
                <span class="icon">🏋️</span>
                <div style="flex:1">
                  <div><strong>${Util.escapeHtml(p.nome)}</strong></div>
                  <div class="meta">${(p.exercises || []).filter(e => e.name).length} exercício(s)</div>
                </div>
                <span class="chev">›</span>
              </button>`).join('')}
          </div>
        </div>`
      : '<div class="card"><div class="empty">Nenhum treino ainda. Escolha uma das duas opções acima pra começar.</div></div>'}
    `;

    document.getElementById('ir-pacotes').addEventListener('click', () => api.goToMais('treino-pacotes'));
    document.getElementById('criar-plano').addEventListener('click', () => {
      const maxOrdem = planos.reduce((m, p) => Math.max(m, p.ordem), 0);
      const novo = Storage.add('treino_planos', {
        nome: `Treino ${String.fromCharCode(65 + planos.length)}`,
        ordem: maxOrdem + 1,
        exercises: [{ name: '', sets: '', reps: '', weight: '' }],
      });
      // Vai direto pro editor: antes o plano vazio nascia no fim da lista e cabia ao usuário
      // perceber que algo tinha aparecido lá embaixo.
      api.goToMais('plano-editar', novo.id);
    });
    $app.querySelectorAll('[data-plano]').forEach(btn => {
      btn.addEventListener('click', () => api.goToMais('plano-editar', btn.dataset.plano));
    });
  }

  // Tela de escolha de pacote: um card por pacote, com a descrição e quantos treinos vêm
  // junto, em vez de um <select> onde só dá pra ler um de cada vez.
  function renderTreinoPacotes($app, state, api) {
    const ids = pacotesVisiveis();
    $app.innerHTML = `
      <div class="card">
        <p class="meta">Ponto de partida baseado em ciência do esporte (volume e frequência por grupo muscular). Depois de carregar, todos os treinos ficam editáveis — ajuste exercícios, séries, reps e cargas ao seu nível.</p>
      </div>
      ${ids.map(id => {
        const pack = TREINOS_PREDEFINIDOS[id];
        return `
          <div class="card">
            <h2 style="font-size:1rem;margin:0 0 4px">${Util.escapeHtml(rotuloPacote(id))}</h2>
            <p class="meta" style="margin-top:0">${Util.escapeHtml(pack.descricao || '')}</p>
            <p class="meta">${pack.planos.length} treino(s): ${Util.escapeHtml(pack.planos.map(p => p.nome).join(' · '))}</p>
            <button class="primary" data-usar="${Util.escapeHtml(id)}" style="margin-top:8px">Usar este pacote</button>
          </div>`;
      }).join('')}
    `;

    $app.querySelectorAll('[data-usar]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.usar;
        const pack = TREINOS_PREDEFINIDOS[id];
        if (!confirm(`Adicionar ${pack.planos.length} treino(s) do pacote "${rotuloPacote(id)}" aos seus planos?`)) return;
        const planos = Storage.getAll('treino_planos');
        const maxOrdem = planos.reduce((m, p) => Math.max(m, p.ordem || 0), 0);
        pack.planos.forEach((p, i) => {
          Storage.add('treino_planos', { nome: p.nome, ordem: maxOrdem + i + 1, exercises: p.exercises.map(e => ({ ...e })) });
          // Exercícios de um pacote pré-definido (ex: ficha do personal) só existiam dentro do
          // plano, nunca na biblioteca — sem isso, ficavam sem grupo muscular/ilustração.
          p.exercises.forEach(e => garantirExercicioNaBiblioteca(e.name));
        });
        // Volta pra lista em vez de ficar na tela de pacotes: o resultado da ação está lá,
        // e é onde o usuário confere o que entrou.
        api.back();
      });
    });
  }

  // Editor de um treino só. Reaproveita o card que antes era repetido na lista inteira.
  function renderPlanoEditar($app, state, api) {
    const planos = Storage.getAll('treino_planos').sort((a, b) => a.ordem - b.ordem);
    const plano = planos.find(p => p.id === state.maisParam);
    // Excluir dentro do card chama api.render(), que cai aqui de novo sem o plano — nesse
    // caso a tela não existe mais e o certo é voltar, não pintar uma tela vazia.
    if (!plano) { api.back(); return; }

    const biblioteca = Storage.getAll('exercicios_biblioteca');
    $app.innerHTML = `
      <datalist id="exercicios-datalist-planos">
        ${biblioteca.map(e => `<option value="${Util.escapeHtml(e.name)}">`).join('')}
      </datalist>
      <div id="plano-editor"></div>
    `;
    document.getElementById('plano-editor').appendChild(renderPlanoCard(plano, planos, api));
  }

  function renderPlanoCard(plano, allPlanos, api) {
    const card = document.createElement('div');
    card.className = 'card';
    let rows = (plano.exercises && plano.exercises.length ? plano.exercises : [{ name: '', sets: '', reps: '', weight: '' }]).map(e => ({ ...e }));

    function paint() {
      const idx = allPlanos.findIndex(p => p.id === plano.id);
      card.innerHTML = `
        <div class="row" style="align-items:center">
          <input type="text" id="nome-${plano.id}" value="${Util.escapeHtml(plano.nome)}" style="font-weight:600">
          <div style="display:flex;gap:4px">
            <button class="secondary" data-up>▲</button>
            <button class="secondary" data-down>▼</button>
          </div>
        </div>
        <div class="exercise-list-${plano.id}" style="margin-top:10px"></div>
        <button class="secondary" data-add-row>+ Adicionar exercício</button>
        <div class="row" style="margin-top:10px">
          <button class="primary" data-save>Salvar plano</button>
          <button class="link" data-delete style="flex:0 0 auto">Excluir</button>
        </div>
      `;
      const rowsWrap = card.querySelector(`.exercise-list-${plano.id}`);
      rowsWrap.innerHTML = rows.map((r, i) => `
        <div class="exercise-row" data-i="${i}">
          <input type="text" class="ex-name" list="exercicios-datalist-planos" placeholder="Exercício" value="${Util.escapeHtml(r.name)}">
          <input type="number" class="small ex-sets" placeholder="Séries" value="${Util.escapeHtml(r.sets)}">
          <input type="text" class="small ex-reps" placeholder="Reps" value="${Util.escapeHtml(r.reps)}">
          <input type="number" class="small ex-weight" placeholder="Kg" value="${Util.escapeHtml(r.weight)}">
          <input type="text" class="ex-descanso" placeholder="Descanso (ex: 1m30s)" value="${Util.escapeHtml(r.descanso || '')}" style="flex-basis:100%">
          <input type="text" class="ex-obs" placeholder="Observação (ex: 1ª série aquecimento)" value="${Util.escapeHtml(r.obs || '')}" style="flex-basis:100%">
          <button class="link" data-remove-row="${i}">✕</button>
        </div>
      `).join('');

      function syncRows() {
        const names = rowsWrap.querySelectorAll('.ex-name');
        const sets = rowsWrap.querySelectorAll('.ex-sets');
        const reps = rowsWrap.querySelectorAll('.ex-reps');
        const weights = rowsWrap.querySelectorAll('.ex-weight');
        const descansos = rowsWrap.querySelectorAll('.ex-descanso');
        const obses = rowsWrap.querySelectorAll('.ex-obs');
        rows = rows.map((r, i) => ({
          name: names[i] ? names[i].value : r.name,
          sets: sets[i] ? sets[i].value : r.sets,
          reps: reps[i] ? reps[i].value : r.reps,
          weight: weights[i] ? weights[i].value : r.weight,
          descanso: descansos[i] ? descansos[i].value : (r.descanso || ''),
          obs: obses[i] ? obses[i].value : (r.obs || ''),
        }));
      }

      rowsWrap.querySelectorAll('[data-remove-row]').forEach(btn => {
        btn.addEventListener('click', () => {
          syncRows();
          rows.splice(Number(btn.dataset.removeRow), 1);
          if (rows.length === 0) rows.push({ name: '', sets: '', reps: '', weight: '' });
          paint();
        });
      });

      card.querySelector('[data-add-row]').addEventListener('click', () => {
        syncRows();
        rows.push({ name: '', sets: '', reps: '', weight: '' });
        paint();
      });

      card.querySelector('[data-up]').addEventListener('click', () => {
        if (idx <= 0) return;
        const other = allPlanos[idx - 1];
        const tmp = plano.ordem;
        Storage.update('treino_planos', plano.id, { ordem: other.ordem });
        Storage.update('treino_planos', other.id, { ordem: tmp });
        api.render();
      });
      card.querySelector('[data-down]').addEventListener('click', () => {
        if (idx >= allPlanos.length - 1) return;
        const other = allPlanos[idx + 1];
        const tmp = plano.ordem;
        Storage.update('treino_planos', plano.id, { ordem: other.ordem });
        Storage.update('treino_planos', other.id, { ordem: tmp });
        api.render();
      });

      card.querySelector('[data-save]').addEventListener('click', () => {
        syncRows();
        const nome = document.getElementById(`nome-${plano.id}`).value.trim() || plano.nome;
        const cleaned = rows.filter(r => r.name.trim() !== '');
        Storage.update('treino_planos', plano.id, { nome, exercises: cleaned });
        api.render();
      });

      card.querySelector('[data-delete]').addEventListener('click', () => {
        if (confirm(`Excluir o plano "${plano.nome}"?`)) {
          Storage.remove('treino_planos', plano.id);
          api.render();
        }
      });
    }

    paint();
    return card;
  }

  // ---------------- COMBOS DE REFEIÇÃO ----------------
  const NUTRI_FIELDS_COMBO = ['kcal', 'protein', 'carbs', 'sugars', 'fat', 'satFat', 'transFat', 'fiber', 'sodium'];

  function renderCombos($app, state, api) {
    const combos = Storage.getAll('combos');

    $app.innerHTML = `
      ${menuCardHtml([
        escolhaHtml('id="ir-combo-novo"', '✏️', 'Criar um combo', 'Junte os alimentos que você come sempre juntos.'),
      ])}
      <div class="card">
        <h2>Combos salvos (${combos.length})</h2>
        <div id="combos-list">${combosListHtml(combos)}</div>
      </div>
    `;

    attachComboDelete();

    document.getElementById('ir-combo-novo').addEventListener('click', () => api.goToMais('combo-novo'));
    const emptyCta = document.getElementById('empty-cta-combo');
    if (emptyCta) emptyCta.addEventListener('click', () => api.goToMais('combo-novo'));

    function attachComboDelete() {
      $app.querySelectorAll('[data-del-combo]').forEach(btn => {
        btn.addEventListener('click', () => {
          Storage.remove('combos', btn.dataset.delCombo);
          api.render();
        });
      });
    }
  }

  // Montagem do combo em tela própria. Os itens ficam numa lista local que só some quando a
  // tela sai — por isso adicionar um item repinta só a lista (renderItensList), nunca a tela
  // inteira: um api.render() aqui apagaria o que já foi montado.
  function renderComboNovo($app, state, api) {
    let itensNovoCombo = [];

    $app.innerHTML = `
      <div class="card">
        <p class="meta">Salve alimentos que você come juntos com frequência (ex: seu café da manhã de sempre) para adicionar tudo com um clique depois.</p>
        <label>Nome do combo</label>
        <input type="text" id="combo-nome" placeholder="Ex: Café da manhã de sempre">
        <label>Horário (opcional) — usado para sugerir a refeição no Início quando uma dieta específica está selecionada</label>
        <input type="time" id="combo-horario">
        <label>Adicionar alimento</label>
        <div class="autocomplete-wrap">
          <input type="text" id="combo-food-search" placeholder="Buscar na biblioteca..." autocomplete="off">
          <div class="autocomplete-list" id="combo-food-results" style="display:none"></div>
        </div>
        <div id="combo-selected-food-box"></div>
        <div id="combo-itens-list" style="margin-top:12px"></div>
        <button class="primary" id="save-combo" style="margin-top:12px">Salvar combo</button>
      </div>
    `;

    const searchInput = document.getElementById('combo-food-search');
    const resultsBox = document.getElementById('combo-food-results');
    let selectedFood = null;

    function renderItensList() {
      const wrap = document.getElementById('combo-itens-list');
      if (itensNovoCombo.length === 0) {
        wrap.innerHTML = '<div class="empty">Nenhum alimento adicionado ainda</div>';
        return;
      }
      wrap.innerHTML = itensNovoCombo.map((it, i) => `
        <div class="list-item">
          <div>
            <div>${Util.escapeHtml(it.foodName)} ${it.qty !== 1 ? `<span class="meta">(${it.qty}x)</span>` : ''}</div>
            <div class="meta">${it.kcal} kcal · P ${it.protein}g · C ${it.carbs}g · G ${it.fat}g</div>
          </div>
          <button class="link" data-remove-item="${i}">✕</button>
        </div>
      `).join('');
      wrap.querySelectorAll('[data-remove-item]').forEach(btn => {
        btn.addEventListener('click', () => {
          itensNovoCombo.splice(Number(btn.dataset.removeItem), 1);
          renderItensList();
        });
      });
    }
    renderItensList();

    searchInput.addEventListener('input', () => {
      const q = searchInput.value.trim().toLowerCase();
      selectedFood = null;
      document.getElementById('combo-selected-food-box').innerHTML = '';
      if (!q) { resultsBox.style.display = 'none'; return; }
      const lib = Storage.getAll('alimentos_biblioteca');
      const matches = lib.filter(f => f.name.toLowerCase().includes(q)).slice(0, 8);
      resultsBox.innerHTML = matches.length === 0
        ? `<div class="autocomplete-item">Nenhum resultado</div>`
        : matches.map(f => `<div class="autocomplete-item" data-id="${f.id}">${Util.escapeHtml(f.name)}<div class="meta">${f.kcal} kcal / ${f.portionLabel}</div></div>`).join('');
      resultsBox.style.display = '';
      resultsBox.querySelectorAll('[data-id]').forEach(el => {
        el.addEventListener('click', () => selectFood(lib.find(f => f.id === el.dataset.id)));
      });
    });

    function selectFood(food) {
      selectedFood = food;
      searchInput.value = food.name;
      resultsBox.style.display = 'none';
      document.getElementById('combo-selected-food-box').innerHTML = `
        <div class="row">
          <div>
            <label>Porções (de ${Util.escapeHtml(food.portionLabel)})</label>
            <input type="number" id="combo-qty-input" value="1" min="0.01" step="0.1">
          </div>
          <div>
            <label>ou gramas direto</label>
            <input type="number" id="combo-qty-grams-input" value="${food.portionGrams}" min="1" step="1">
          </div>
        </div>
        <button class="secondary" id="combo-add-item" style="margin-top:8px">Adicionar ao combo</button>
      `;
      const qtyInput = document.getElementById('combo-qty-input');
      const gramsInput = document.getElementById('combo-qty-grams-input');
      qtyInput.addEventListener('input', () => {
        gramsInput.value = Math.round((Number(qtyInput.value) || 0) * food.portionGrams * 10) / 10;
      });
      gramsInput.addEventListener('input', () => {
        qtyInput.value = Math.round(((Number(gramsInput.value) || 0) / food.portionGrams) * 1000) / 1000;
      });
      document.getElementById('combo-add-item').addEventListener('click', () => {
        const qty = Number(qtyInput.value) || 1;
        const item = { foodName: food.name, qty };
        NUTRI_FIELDS_COMBO.forEach(f => { item[f] = Math.round((food[f] || 0) * qty * 10) / 10; });
        itensNovoCombo.push(item);
        searchInput.value = '';
        document.getElementById('combo-selected-food-box').innerHTML = '';
        renderItensList();
      });
    }

    document.getElementById('save-combo').addEventListener('click', () => {
      const nome = document.getElementById('combo-nome').value.trim();
      const horario = document.getElementById('combo-horario').value || null;
      if (!nome || itensNovoCombo.length === 0) {
        alert('Dê um nome ao combo e adicione pelo menos um alimento.');
        return;
      }
      Storage.add('combos', { nome, horario, itens: itensNovoCombo });
      api.back();
    });
  }

  function combosListHtml(combos) {
    if (combos.length === 0) {
      return `
        <div class="empty">
          Nenhum combo salvo ainda
          <div style="margin-top:10px"><button class="secondary" id="empty-cta-combo">+ Criar meu primeiro combo</button></div>
        </div>
      `;
    }
    return combos.map(c => {
      const totalKcal = c.itens.reduce((s, i) => s + (i.kcal || 0), 0);
      return `
        <div class="list-item" data-id="${c.id}">
          <div>
            <strong>${Util.escapeHtml(c.nome)}</strong> ${c.horario ? `<span class="meta">⏰ ${c.horario}</span>` : ''}
            <div class="meta">${c.itens.map(i => i.foodName).join(', ')}</div>
            <div class="meta">${totalKcal.toFixed(0)} kcal no total</div>
          </div>
          <button class="link" data-del-combo="${c.id}">✕</button>
        </div>
      `;
    }).join('');
  }

  // ---------------- BACKUP ----------------
  function renderBackup($app, state, api) {
    $app.innerHTML = `
      <div class="card">
        <h2>Exportar / Importar</h2>
        <p class="meta">Como os dados ficam salvos só neste navegador, exporte periodicamente para não perder nada.</p>
        <button class="primary" id="export-json">Exportar backup (.json)</button>
        <label style="margin-top:14px">Importar backup</label>
        <input type="file" id="import-json" accept="application/json">
      </div>
      ${(() => {
        // Cópias que o próprio app guarda antes de sobrescrever o diário inteiro
        // (sincronização com a nuvem, importação de backup). O card só aparece quando
        // existe alguma — em aparelho novo não há o que mostrar.
        const copias = Storage.copiasSeguranca();
        if (!copias.length) return '';
        return `
          <div class="card">
            <h2>Cópias de segurança automáticas</h2>
            <p class="meta">O app guarda o estado anterior antes de sincronizar com a nuvem ou importar um backup. Ficam as 3 últimas — use se algum registro sumir. Restaurar <strong>traz de volta</strong> o que estava na cópia; não apaga o que você registrou depois.</p>
            <div class="menu-list" style="margin-top:10px">
              ${copias.map(c => `
                <div class="menu-item" data-restaurar="${c.id}">
                  <div>
                    <div>${Util.escapeHtml(new Date(c.em).toLocaleString('pt-BR'))}</div>
                    <div class="meta">${c.registros} registros · ${Util.escapeHtml(c.motivo)}</div>
                  </div>
                  <span class="chev">↩</span>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      })()}
      <div class="card">
        <h2>Relatório para análise com IA ou treinador</h2>
        <p class="meta">Gera um resumo em texto do período escolhido, pronto para colar numa conversa com uma IA ou mandar pro seu treinador.</p>
        <label>Período</label>
        <select id="report-periodo">
          <option value="15" selected>Últimos 15 dias</option>
          <option value="30">Últimos 30 dias</option>
          <option value="60">Últimos 60 dias</option>
          <option value="90">Últimos 90 dias</option>
        </select>
        <button class="secondary" id="gen-report" style="margin-top:10px">Gerar relatório</button>
        <textarea id="report-box" readonly style="min-height:280px;margin-top:10px;display:none;font-family:monospace;font-size:0.8rem"></textarea>
        <button class="secondary" id="copy-report" style="display:none;margin-top:8px">Copiar</button>
      </div>
    `;

    document.getElementById('export-json').addEventListener('click', () => {
      const data = Storage.exportAll();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `diario-backup-${Util.todayISO()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });

    $app.querySelectorAll('[data-restaurar]').forEach(el => {
      el.addEventListener('click', () => {
        const copia = Storage.copiasSeguranca().find(c => c.id === el.dataset.restaurar);
        if (!copia) return;
        const quando = new Date(copia.em).toLocaleString('pt-BR');
        if (!window.confirm(
          `Restaurar a cópia de ${quando} (${copia.registros} registros)?\n\n` +
          'Os registros dessa cópia voltam pro diário. O que você registrou depois continua lá ' +
          '— a sincronização junta os dois, não troca um pelo outro.'
        )) return;
        Storage.restaurarCopiaSeguranca(copia.id);
        alert(`✅ Cópia de ${quando} restaurada.`);
        api.render();
      });
    });

    document.getElementById('import-json').addEventListener('change', async e => {
      const file = e.target.files[0];
      if (!file) return;
      const text = await file.text();
      try {
        const data = JSON.parse(text);
        Storage.importAll(data);
        alert('Backup importado com sucesso!');
        api.render();
      } catch {
        alert('Arquivo inválido.');
      }
    });

    document.getElementById('gen-report').addEventListener('click', () => {
      const dias = Number(document.getElementById('report-periodo').value) || 15;
      const report = gerarRelatorio(dias);
      const box = document.getElementById('report-box');
      box.value = report;
      box.style.display = '';
      document.getElementById('copy-report').style.display = '';
    });

    document.getElementById('copy-report').addEventListener('click', () => {
      navigator.clipboard.writeText(document.getElementById('report-box').value);
    });
  }

  // dadosExternos é opcional — snapshot no formato { treino, alimentacao, medidas, ...,
  // perfil, dietas_custom } (mesmo shape de Cloud.dadosUsuario()). Sem isso, lê do usuário
  // logado (comportamento de sempre, usado em Mais → Backup). O painel profissional passa
  // o snapshot do PACIENTE, pra gerar o relatório dele sem misturar com os dados de quem
  // está logado (o profissional). RefeicaoLivre.getConfig() também é pulado nesse caso —
  // ela lê a config do usuário logado, que não é a do paciente.
  function gerarRelatorio(dias, dadosExternos) {
    dias = dias || 15;
    const desde = Util.daysAgo(dias);
    const hoje = Util.todayISO();
    const ler = key => dadosExternos ? (dadosExternos[key] || []) : Storage.getAll(key);
    const perfil = dadosExternos ? (dadosExternos.perfil || {}) : Storage.getPerfil();
    const meta = calcularMetas(perfil, dadosExternos ? dadosExternos.dietas_custom : undefined);

    const medidas = ler('medidas').filter(m => m.date >= desde).sort((a, b) => a.date.localeCompare(b.date));
    const pesos = medidas.filter(m => m.weight != null);
    const comidas = ler('alimentacao').filter(a => a.date >= desde);
    const treinos = ler('treino').filter(t => t.date >= desde);
    const corridas = ler('corridas').filter(c => c.date >= desde);
    const aguas = ler('agua').filter(a => a.date >= desde);
    const gastos = ler('gastos').filter(g => g.date >= desde);
    const tarefas = ler('tarefas');
    const conclusoes = ler('tarefas_conclusoes').filter(c => c.date >= desde);

    // Só conta como dia registrado quem tem as refeições principais lançadas — mesma
    // regra da Refeição Livre e do Dias em Foco, pra não existirem duas definições
    // diferentes de "dia completo de alimentação". Um dia em que só entrou um lanche
    // não representa o que a pessoa comeu e puxaria a média pra baixo.
    const refeicoesObrigatorias = (!dadosExternos && typeof RefeicaoLivre !== 'undefined')
      ? RefeicaoLivre.getConfig().refeicoesObrigatorias
      : ['Café da manhã', 'Almoço', 'Jantar'];
    const refeicoesPorData = {};
    comidas.forEach(c => {
      if (!refeicoesPorData[c.date]) refeicoesPorData[c.date] = new Set();
      refeicoesPorData[c.date].add(c.mealType);
    });
    const todosDiasComRegistro = Object.keys(refeicoesPorData);
    const diasComComida = todosDiasComRegistro.filter(d => refeicoesObrigatorias.every(r => refeicoesPorData[d].has(r)));
    const diasIncompletos = todosDiasComRegistro.length - diasComComida.length;
    // A soma também precisa ficar restrita a esses dias: manter os lançamentos dos dias
    // incompletos no numerador enquanto eles saem do divisor inflaria todas as médias.
    const completos = new Set(diasComComida);
    const comidasCompletas = comidas.filter(c => completos.has(c.date));

    const media = (arr, campo) => arr.length ? arr.reduce((s, x) => s + (x[campo] || 0), 0) / arr.length : null;
    const kcalMedia = diasComComida.length ? comidasCompletas.reduce((s, c) => s + (c.kcal || 0), 0) / diasComComida.length : null;
    const proteinaMedia = diasComComida.length ? comidasCompletas.reduce((s, c) => s + (c.protein || 0), 0) / diasComComida.length : null;
    const carbMedia = diasComComida.length ? comidasCompletas.reduce((s, c) => s + (c.carbs || 0), 0) / diasComComida.length : null;
    const gorduraMedia = diasComComida.length ? comidasCompletas.reduce((s, c) => s + (c.fat || 0), 0) / diasComComida.length : null;
    const aguaMedia = media(aguas, 'ml');
    const gastoMedio = media(gastos, 'kcal');

    const tendencia = typeof calcularTendenciaPeso === 'function'
      ? calcularTendenciaPeso(dadosExternos ? { perfil, medidas: ler('medidas'), dietasCustomList: dadosExternos.dietas_custom } : undefined)
      : null;

    let linhas = [`Relatório dos últimos ${dias} dias (${Util.fmtDate(desde)} a ${Util.fmtDate(hoje)})`, ''];

    linhas.push('== Perfil e objetivo ==');
    if (meta) {
      const objetivoNome = (DIETA_TEMPLATES.find(t => t.id === perfil.dietaTemplate) || {}).nome || 'Personalizado';
      linhas.push(`Objetivo: ${objetivoNome} · Meta: ${meta.kcal} kcal/dia (P ${meta.protein}g · C ${meta.carb}g · G ${meta.fat}g)`);
    } else {
      linhas.push('Perfil incompleto (sem meta calculada)');
    }
    linhas.push('');

    linhas.push('== Peso ==');
    if (pesos.length > 0) {
      linhas.push(`${pesos[0].weight}kg → ${pesos[pesos.length - 1].weight}kg (${pesos.length} registros no período)`);
    } else {
      linhas.push('Sem registros de peso no período');
    }
    if (tendencia) {
      linhas.push(`Tendência esperada pela dieta: ${tendencia.taxaEsperada >= 0 ? '+' : ''}${tendencia.taxaEsperada.toFixed(2)}kg/semana`);
      linhas.push(`Tendência real (${tendencia.janelaRecente ? 'últimos' : 'todo o histórico,'} ${tendencia.dias} dias): ${tendencia.taxaReal >= 0 ? '+' : ''}${tendencia.taxaReal.toFixed(2)}kg/semana`);
    }
    linhas.push('');

    linhas.push('== Alimentação ==');
    linhas.push(`Calorias: média de ${kcalMedia != null ? kcalMedia.toFixed(0) : 'sem dados'} kcal/dia (${diasComComida.length} de ${dias} dias com ${refeicoesObrigatorias.join(', ')} registrados)`);
    if (diasIncompletos > 0) {
      linhas.push(`Obs: outros ${diasIncompletos} dia(s) tiveram registro parcial (sem todas as refeições principais) e ficaram fora das médias acima.`);
    }
    if (proteinaMedia != null) {
      linhas.push(`Macros médios: P ${proteinaMedia.toFixed(0)}g · C ${carbMedia.toFixed(0)}g · G ${gorduraMedia.toFixed(0)}g por dia`);
    }
    if (gastoMedio != null) {
      linhas.push(`Calorias extras gastas (manual): média de ${gastoMedio.toFixed(0)} kcal/dia`);
    }
    if (aguaMedia != null) {
      linhas.push(`Água: média de ${aguaMedia.toFixed(0)}ml/dia`);
    }
    linhas.push('');

    linhas.push('== Treino ==');
    linhas.push(`Musculação: ${treinos.length} sessões registradas`);
    if (corridas.length > 0) {
      const paces = corridas.filter(c => c.distanceKm && c.timeMin).map(c => c.timeMin / c.distanceKm);
      linhas.push(`Corridas: ${corridas.length} registradas, melhor pace ${Math.min(...paces).toFixed(2)} min/km`);
    } else {
      linhas.push('Corridas: sem registros no período');
    }
    linhas.push('');

    linhas.push('== Tarefas/hábitos ==');
    const diasComTarefa = tarefas.length > 0 ? [...Array(dias)].map((_, i) => Util.daysAgo(i)).filter(d => tarefas.some(t => ViewTarefas.isApplicable(t, d))) : [];
    if (diasComTarefa.length > 0) {
      const totalEsperado = diasComTarefa.reduce((s, d) => s + tarefas.filter(t => ViewTarefas.isApplicable(t, d)).length, 0);
      const totalFeito = conclusoes.length;
      const pct = totalEsperado > 0 ? Math.round((totalFeito / totalEsperado) * 100) : 0;
      linhas.push(`Adesão: ${totalFeito} de ${totalEsperado} tarefas concluídas (${pct}%)`);
    } else {
      linhas.push('Sem tarefas configuradas');
    }

    return linhas.join('\n');
  }

  // ---------------- PAINEL DO NUTRI/ADMIN ----------------
  function renderAdmin($app, state, api) {
    if (typeof Cloud === 'undefined' || !Cloud.isEnabled() || !Cloud.isAdmin()) {
      $app.innerHTML = '<div class="card"><p class="empty">Acesso restrito a profissionais.</p></div>';
      return;
    }
    const souSuperAdmin = typeof Cloud.isSuperAdmin === 'function' && Cloud.isSuperAdmin();

    // `detailEl` é a raiz onde os montarX() procuram seus containers por id. No painel ele é
    // o bloco embaixo da lista; nas telas do paciente passa a ser a própria tela. Por isso é
    // `let`: é o que permite reaproveitar as nove funções de montagem sem tocar em nenhuma.
    let detailEl = null;

    if (ehTelaPaciente(state.maisView)) { pintarTelaPaciente(); return; }

    $app.innerHTML = `
      <div class="card">
        <h2>🔗 Convidar paciente</h2>
        <p class="meta">Compartilhe este link com seus pacientes — ao criar conta por ele, ficam vinculados a você automaticamente.</p>
        <div class="row">
          <div style="flex:2"><input type="text" id="admin-invite-link" readonly value="Gerando…"></div>
          <div style="flex:0 0 auto"><button class="secondary" id="admin-invite-copy">copiar</button></div>
        </div>
      </div>
      ${souSuperAdmin ? `
      <div class="card">
        <h2>🎬 Vídeos para aprovar</h2>
        <div id="admin-videos"><div class="empty">Carregando…</div></div>
      </div>
      <div class="card">
        <h2>🍲 Receitas para aprovar</h2>
        <div id="admin-receitas"><div class="empty">Carregando…</div></div>
      </div>
      ` : ''}
      <div class="card">
        <h2>👥 ${souSuperAdmin ? 'Todos os pacientes (todos os profissionais)' : 'Seus pacientes'}</h2>
        ${souSuperAdmin ? '<p class="meta"><span class="badge pr">super-admin</span> Você vê pacientes de todos os profissionais.</p>' : ''}
        <p class="meta">Toque num paciente pra ver o resumo e enviar uma dieta.</p>
        <input type="text" id="admin-users-filter" placeholder="Buscar por nome, e-mail ou profissional...">
        ${souSuperAdmin ? `
          <div class="chip-group" id="admin-users-chip-filter" style="margin-top:8px">
            <button class="chip active" data-nutri-filter="todos">Todos</button>
            <button class="chip" data-nutri-filter="sem-nutri">Sem profissional</button>
          </div>
        ` : ''}
        <div id="admin-users" style="margin-top:8px"><div class="empty">Carregando…</div></div>
      </div>
      <div id="admin-detail"></div>
    `;
    const usersEl = $app.querySelector('#admin-users');
    detailEl = $app.querySelector('#admin-detail');
    const videosEl = $app.querySelector('#admin-videos');
    const receitasEl = $app.querySelector('#admin-receitas');

    const inviteInput = $app.querySelector('#admin-invite-link');
    Cloud.gerarConviteLink().then(link => { inviteInput.value = link; })
      .catch(() => { inviteInput.value = ''; inviteInput.placeholder = 'Erro ao gerar link — tente reabrir o painel.'; });
    $app.querySelector('#admin-invite-copy').addEventListener('click', () => {
      const link = inviteInput.value;
      if (!link) return;
      const btn = $app.querySelector('#admin-invite-copy');
      if (navigator.clipboard) navigator.clipboard.writeText(link).then(() => { btn.textContent = 'copiado!'; });
      else window.prompt('Seu link de convite (copie):', link);
    });

    function carregarVideos() {
      Cloud.listarVideosPendentes().then(vids => {
        if (!vids.length) { videosEl.innerHTML = '<div class="empty">Nenhum vídeo pendente.</div>'; return; }
        videosEl.innerHTML = vids.map(v => `
          <div class="list-item" data-vid="${Util.escapeHtml(v.id)}">
            <div>
              <strong>${Util.escapeHtml(v.exercicio || '')}</strong>
              <div class="meta">sugerido por ${Util.escapeHtml(v.byEmail || v.byUid || '')}</div>
              <a href="${Util.escapeHtml(v.videoUrl || '')}" target="_blank" rel="noopener" class="meta" style="color:var(--accent)">▶ ver vídeo</a>
            </div>
            <div style="display:flex;gap:6px">
              <button class="secondary" data-aprovar="${Util.escapeHtml(v.id)}" style="font-size:0.75rem;padding:6px 10px">Aprovar</button>
              <button class="link" data-rejeitar="${Util.escapeHtml(v.id)}">Rejeitar</button>
            </div>
          </div>
        `).join('');
        videosEl.querySelectorAll('[data-aprovar]').forEach(btn => {
          btn.addEventListener('click', async () => {
            const v = vids.find(x => x.id === btn.dataset.aprovar);
            btn.textContent = '...';
            try { await Cloud.aprovarVideoPendente(v.id, v.exercicio, v.videoUrl); carregarVideos(); }
            catch (e) { btn.textContent = 'erro'; }
          });
        });
        videosEl.querySelectorAll('[data-rejeitar]').forEach(btn => {
          btn.addEventListener('click', async () => {
            try { await Cloud.rejeitarVideoPendente(btn.dataset.rejeitar); carregarVideos(); }
            catch (e) { /* segue */ }
          });
        });
      }).catch(e => { videosEl.innerHTML = `<div class="empty">Erro: ${Util.escapeHtml(e.message || '')}</div>`; });
    }
    if (souSuperAdmin) carregarVideos();

    // O paciente só manda nome + ingredientes em texto; o admin monta a conta de verdade
    // aqui (ingrediente por ingrediente da biblioteca + peso final) antes de adicionar.
    let recsCache = [];
    let receitaEmMontagemId = null;

    function carregarReceitas() {
      Cloud.listarReceitasPendentes().then(recs => {
        recsCache = recs;
        pintarReceitas();
      }).catch(e => { receitasEl.innerHTML = `<div class="empty">Erro: ${Util.escapeHtml(e.message || '')}</div>`; });
    }

    function pintarReceitas() {
      if (receitaEmMontagemId) {
        const r = recsCache.find(x => x.id === receitaEmMontagemId);
        if (!r) { receitaEmMontagemId = null; return pintarReceitas(); }
        renderMontarReceita(r);
        return;
      }
      if (!recsCache.length) { receitasEl.innerHTML = '<div class="empty">Nenhuma receita pendente.</div>'; return; }
      receitasEl.innerHTML = recsCache.map(r => `
        <div class="list-item" data-rid="${Util.escapeHtml(r.id)}" style="display:block">
          <strong>${Util.escapeHtml(r.nomeReceita || '')}</strong>
          <div class="meta">sugerido por ${Util.escapeHtml(r.byEmail || r.byUid || '')}</div>
          <div class="meta" style="white-space:pre-wrap;margin-top:4px">${Util.escapeHtml(r.ingredientesTexto || '')}</div>
          <div style="display:flex;gap:6px;margin-top:8px">
            <button class="secondary" data-montar-receita="${Util.escapeHtml(r.id)}" style="font-size:0.75rem;padding:6px 10px">Montar e adicionar</button>
            <button class="link" data-rejeitar-receita="${Util.escapeHtml(r.id)}">Rejeitar</button>
          </div>
        </div>
      `).join('');
      receitasEl.querySelectorAll('[data-montar-receita]').forEach(btn => {
        btn.addEventListener('click', () => { receitaEmMontagemId = btn.dataset.montarReceita; pintarReceitas(); });
      });
      receitasEl.querySelectorAll('[data-rejeitar-receita]').forEach(btn => {
        btn.addEventListener('click', async () => {
          try { await Cloud.rejeitarReceitaPendente(btn.dataset.rejeitarReceita); carregarReceitas(); }
          catch (e) { /* segue */ }
        });
      });
    }

    // Construtor de receita (ingrediente da biblioteca + peso final calcula sozinho),
    // mesmo padrão do picker de combos/plano alimentar, mas só acessível aqui pro admin.
    function renderMontarReceita(r) {
      let itensMontagem = [];
      const bibliotecaAtual = Storage.getAll('alimentos_biblioteca');
      receitasEl.innerHTML = `
        <div class="list-item" style="display:block">
          <button class="link" id="montar-voltar">‹ Voltar pra lista</button>
          <p class="meta" style="margin-top:6px">${Util.escapeHtml(r.byEmail || r.byUid || 'Paciente')} escreveu:</p>
          <div class="meta" style="white-space:pre-wrap;background:var(--bg);padding:8px;border-radius:8px">${Util.escapeHtml(r.ingredientesTexto || '')}</div>
          <label style="margin-top:10px">Nome da receita</label>
          <input type="text" id="mr-nome" value="${Util.escapeHtml(r.nomeReceita || '')}">
          <label>Adicionar ingrediente (da biblioteca)</label>
          <div class="autocomplete-wrap">
            <input type="text" id="mr-food-search" placeholder="Buscar na biblioteca..." autocomplete="off">
            <div class="autocomplete-list" id="mr-food-results" style="display:none"></div>
          </div>
          <div id="mr-selected-food-box"></div>
          <div id="mr-itens-list" style="margin-top:12px"></div>
          <label style="margin-top:10px">Peso da receita pronta (gramas)</label>
          <input type="number" id="mr-peso-final" placeholder="Ex: 850">
          <div id="mr-preview" class="meta" style="margin-top:8px"></div>
          <button class="primary" id="mr-adicionar" style="margin-top:8px">Adicionar à biblioteca</button>
        </div>
      `;
      receitasEl.querySelector('#montar-voltar').addEventListener('click', () => { receitaEmMontagemId = null; pintarReceitas(); });

      const mrSearchInput = receitasEl.querySelector('#mr-food-search');
      const mrResultsBox = receitasEl.querySelector('#mr-food-results');

      function mrUpdatePreview() {
        const previewEl = receitasEl.querySelector('#mr-preview');
        const pesoFinal = Number(receitasEl.querySelector('#mr-peso-final').value) || 0;
        if (itensMontagem.length === 0 || pesoFinal <= 0) { previewEl.textContent = ''; return; }
        const totais = {};
        NUTRI_FIELDS_COMBO.forEach(f => { totais[f] = itensMontagem.reduce((s, it) => s + (it[f] || 0), 0); });
        const fator = 100 / pesoFinal;
        previewEl.innerHTML = `Por 100g da receita pronta: <strong>${Math.round(totais.kcal * fator)} kcal</strong> · P ${(totais.protein * fator).toFixed(1)}g · C ${(totais.carbs * fator).toFixed(1)}g · G ${(totais.fat * fator).toFixed(1)}g · Fibra ${(totais.fiber * fator).toFixed(1)}g`;
      }

      function mrRenderItensList() {
        const wrap = receitasEl.querySelector('#mr-itens-list');
        if (itensMontagem.length === 0) {
          wrap.innerHTML = '<div class="empty">Nenhum ingrediente adicionado ainda</div>';
        } else {
          wrap.innerHTML = itensMontagem.map((it, i) => `
            <div class="list-item">
              <div>
                <div>${Util.escapeHtml(it.foodName)} ${it.qty !== 1 ? `<span class="meta">(${it.qty}x)</span>` : ''}</div>
                <div class="meta">${it.kcal} kcal · P ${it.protein}g · C ${it.carbs}g · G ${it.fat}g</div>
              </div>
              <button class="link" data-mr-remove-item="${i}">✕</button>
            </div>
          `).join('');
          wrap.querySelectorAll('[data-mr-remove-item]').forEach(btn => {
            btn.addEventListener('click', () => {
              itensMontagem.splice(Number(btn.dataset.mrRemoveItem), 1);
              mrRenderItensList();
            });
          });
        }
        mrUpdatePreview();
      }
      mrRenderItensList();

      receitasEl.querySelector('#mr-peso-final').addEventListener('input', mrUpdatePreview);

      mrSearchInput.addEventListener('input', () => {
        const q = mrSearchInput.value.trim().toLowerCase();
        receitasEl.querySelector('#mr-selected-food-box').innerHTML = '';
        if (!q) { mrResultsBox.style.display = 'none'; return; }
        const matches = bibliotecaAtual.filter(f => f.name.toLowerCase().includes(q)).slice(0, 8);
        mrResultsBox.innerHTML = matches.length === 0
          ? `<div class="autocomplete-item">Nenhum resultado</div>`
          : matches.map(f => `<div class="autocomplete-item" data-id="${f.id}">${Util.escapeHtml(f.name)}<div class="meta">${f.kcal} kcal / ${f.portionLabel}</div></div>`).join('');
        mrResultsBox.style.display = '';
        mrResultsBox.querySelectorAll('[data-id]').forEach(el => {
          el.addEventListener('click', () => mrSelectFood(bibliotecaAtual.find(f => f.id === el.dataset.id)));
        });
      });

      function mrSelectFood(food) {
        mrSearchInput.value = food.name;
        mrResultsBox.style.display = 'none';
        receitasEl.querySelector('#mr-selected-food-box').innerHTML = `
          <div class="row">
            <div><label>Porções (de ${Util.escapeHtml(food.portionLabel)})</label><input type="number" id="mr-qty-input" value="1" min="0.01" step="0.1"></div>
            <div><label>ou gramas direto</label><input type="number" id="mr-qty-grams-input" value="${food.portionGrams}" min="1" step="1"></div>
          </div>
          <button class="secondary" id="mr-add-item" style="margin-top:8px">Adicionar ingrediente</button>
        `;
        const qtyInput = receitasEl.querySelector('#mr-qty-input');
        const gramsInput = receitasEl.querySelector('#mr-qty-grams-input');
        qtyInput.addEventListener('input', () => {
          gramsInput.value = Math.round((Number(qtyInput.value) || 0) * food.portionGrams * 10) / 10;
        });
        gramsInput.addEventListener('input', () => {
          qtyInput.value = Math.round(((Number(gramsInput.value) || 0) / food.portionGrams) * 1000) / 1000;
        });
        receitasEl.querySelector('#mr-add-item').addEventListener('click', () => {
          const qty = Number(qtyInput.value) || 1;
          const item = { foodName: food.name, qty };
          NUTRI_FIELDS_COMBO.forEach(f => { item[f] = Math.round((food[f] || 0) * qty * 10) / 10; });
          itensMontagem.push(item);
          mrSearchInput.value = '';
          receitasEl.querySelector('#mr-selected-food-box').innerHTML = '';
          mrRenderItensList();
        });
      }

      receitasEl.querySelector('#mr-adicionar').addEventListener('click', async () => {
        const nome = receitasEl.querySelector('#mr-nome').value.trim();
        const pesoFinal = Number(receitasEl.querySelector('#mr-peso-final').value) || 0;
        if (!nome || itensMontagem.length === 0 || pesoFinal <= 0) {
          alert('Preencha o nome, pelo menos 1 ingrediente e o peso da receita pronta.');
          return;
        }
        const totais = {};
        NUTRI_FIELDS_COMBO.forEach(f => { totais[f] = itensMontagem.reduce((s, it) => s + (it[f] || 0), 0); });
        const fator = 100 / pesoFinal;
        const entry = { name: nome, portionLabel: '100g', portionGrams: 100, custom: true };
        NUTRI_FIELDS_COMBO.forEach(f => { entry[f] = Math.round(totais[f] * fator * 10) / 10; });
        const btnSalvar = receitasEl.querySelector('#mr-adicionar');
        btnSalvar.textContent = '...';
        try {
          await Cloud.aprovarReceitaPendente(r.id, entry);
          alert('Receita adicionada à biblioteca! Agora é só avisar quem pediu.');
          receitaEmMontagemId = null;
          carregarReceitas();
        } catch (e) { btnSalvar.textContent = 'erro'; }
      });
    }
    if (souSuperAdmin) carregarReceitas();

    function formatarUltimaAtividade(ts) {
      if (!ts) return 'nunca';
      const dias = Math.floor((Date.now() - ts) / 86400000);
      if (dias <= 0) return 'hoje';
      if (dias === 1) return 'ontem';
      if (dias < 30) return `há ${dias}d`;
      return Util.fmtDate(new Date(ts).toISOString().slice(0, 10));
    }

    let usersCache = [];
    let nutriPorUid = {};
    let nutriChipAtivo = 'todos';

    function pintarUsuarios() {
      const filtroEl = $app.querySelector('#admin-users-filter');
      const q = (filtroEl ? filtroEl.value : '').trim().toLowerCase();
      let lista = usersCache;
      if (nutriChipAtivo === 'sem-nutri') lista = lista.filter(u => !u.nutriId);
      if (q) {
        lista = lista.filter(u => {
          const nutriLabel = u.nutriId ? (nutriPorUid[u.nutriId] || u.nutriId) : '';
          return (u.displayName || '').toLowerCase().includes(q)
            || (u.email || '').toLowerCase().includes(q)
            || nutriLabel.toLowerCase().includes(q);
        });
      }
      if (!lista.length) { usersEl.innerHTML = '<div class="empty">Nenhum paciente encontrado.</div>'; return; }
      usersEl.innerHTML = lista.map(u => `
        <button class="menu-item" data-uid="${Util.escapeHtml(u.uid)}" style="align-items:flex-start;text-align:left">
          <span class="icon">👤</span>
          <div style="flex:1">
            <div><strong>${Util.escapeHtml(u.displayName || u.email || u.uid)}</strong></div>
            ${u.displayName && u.email ? `<div class="meta">${Util.escapeHtml(u.email)}</div>` : ''}
            <div class="meta">Nutri: ${u.nutriId ? Util.escapeHtml(nutriPorUid[u.nutriId] || u.nutriId) : '— (solto)'}</div>
            <div class="meta">Última atividade: ${formatarUltimaAtividade(u.updatedAt)}</div>
          </div>
          <span class="chev">›</span>
        </button>
      `).join('');
      usersEl.querySelectorAll('[data-uid]').forEach(btn => {
        btn.addEventListener('click', () => abrirUsuario(btn.dataset.uid, usersCache.find(x => x.uid === btn.dataset.uid)));
      });
    }

    Promise.all([
      Cloud.listarUsuarios(),
      souSuperAdmin && typeof Cloud.listarNutris === 'function' ? Cloud.listarNutris() : Promise.resolve([]),
    ]).then(([users, nutris]) => {
      usersCache = users.sort((a, b) => (a.displayName || a.email || '').localeCompare(b.displayName || b.email || ''));
      nutris.forEach(n => { nutriPorUid[n.uid] = n.displayName || n.email || n.uid; });
      if (!usersCache.length) { usersEl.innerHTML = '<div class="empty">Nenhum usuário ainda.</div>'; return; }
      pintarUsuarios();
      const filtroEl = $app.querySelector('#admin-users-filter');
      if (filtroEl) filtroEl.addEventListener('input', pintarUsuarios);
      $app.querySelectorAll('[data-nutri-filter]').forEach(chip => {
        chip.addEventListener('click', () => {
          nutriChipAtivo = chip.dataset.nutriFilter;
          $app.querySelectorAll('[data-nutri-filter]').forEach(c => c.classList.toggle('active', c === chip));
          pintarUsuarios();
        });
      });
    }).catch(e => { usersEl.innerHTML = `<div class="empty">Erro ao listar: ${Util.escapeHtml(e.message || '')}</div>`; });

    // Abrir um paciente virou navegar pra tela dele, em vez de despejar 12 cards embaixo da
    // lista. Baixa aqui (com o "carregando" na lista, onde o dedo já está) e só então navega,
    // pra tela do paciente abrir com conteúdo em vez de piscar vazia.
    async function abrirUsuario(uid, info) {
      detailEl.innerHTML = '<div class="card"><div class="empty">Carregando dados…</div></div>';
      invalidarPacienteCache();
      await carregarPaciente(uid, info);
      detailEl.innerHTML = '';
      api.goToMais('paciente', uid);
    }

    // ---- Telas do paciente ----
    function pintarTelaPaciente() {
      const uid = state.maisParam;
      const cache = pacienteCache;
      if (!uid || cache.uid !== uid) {
        // Sem cache (ex: recarregou a página no meio da navegação) não há como remontar a
        // tela sem os dados; volta pra lista, que é de onde o paciente se abre.
        $app.innerHTML = '<div class="card"><div class="empty">Abra o paciente pela lista do painel.</div></div>';
        return;
      }
      const secao = secaoPaciente(state.maisView);
      if (!secao) { pintarVisaoGeral(uid, cache); return; }
      if (secao.soSuper && !souSuperAdmin) { api.back(); return; }

      $app.innerHTML = `<div id="paciente-secao"></div>`;
      detailEl = $app.querySelector('#paciente-secao');
      const { dados, presc, info } = cache;

      if (secao.view === 'paciente-diario') { montarDiario(dados); return; }
      if (secao.view === 'paciente-relatorio') { montarRelatorio(dados); return; }
      if (secao.view === 'paciente-dieta') { montarDieta(uid, presc); return; }

      // Demais seções: pinta o container que o montarX correspondente procura.
      detailEl.innerHTML = `<div id="${secao.alvo}"></div>${secao.view === 'paciente-papel' ? '<div id="admin-reatribuir"></div>' : ''}`;
      if (secao.view === 'paciente-medidas') montarMedidasPaciente(uid, dados, presc);
      else if (secao.view === 'paciente-plano') montarPlano(uid, presc);
      else if (secao.view === 'paciente-treino') montarTreino(uid, presc);
      else if (secao.view === 'paciente-corrida') montarCorrida(uid, presc);
      else if (secao.view === 'paciente-lista') montarListaCompras(uid, presc);
      else if (secao.view === 'paciente-livre') montarRegrasRefeicaoLivre(uid, presc);
      else if (secao.view === 'paciente-solicitar') montarSolicitacao(uid, presc);
      else if (secao.view === 'paciente-papel') { montarPapel(uid, info); montarReatribuir(uid, info); }
    }

    function pintarVisaoGeral(uid, cache) {
      const { dados, presc, info } = cache;
      const perfil = (dados && dados.perfil) || {};
      const nome = (info && (info.displayName || info.email)) || perfil.nome || uid;
      const pesos = medidasDoPaciente(dados, presc).filter(m => m.weight != null);
      const atual = pesos.length ? pesos[pesos.length - 1] : null;
      const primeiro = pesos.length ? pesos[0] : null;
      const delta = atual && primeiro && pesos.length > 1
        ? Math.round((atual.weight - primeiro.weight) * 10) / 10 : null;
      // A nutri manda a altura junto da folha da consulta; ela só cai no perfil do paciente
      // quando ele abre o app. Até lá, vale a última enviada — senão o IMC fica sem base.
      const alturaEnviada = medidasDoPaciente(dados, presc).filter(m => m.altura != null).pop();
      const altura = perfil.altura ? Number(perfil.altura) : (alturaEnviada ? Number(alturaEnviada.altura) : null);
      const imc = atual && altura ? Math.round((atual.weight / Math.pow(altura / 100, 2)) * 10) / 10 : null;
      const ad = aderenciaPaciente(dados, presc, 30);
      const p = presc || {};
      const nRefPlano = Array.isArray(p.refeicoes) ? p.refeicoes.length : 0;
      const nTreinoPlano = Array.isArray(p.planosTreino) ? p.planosTreino.length : 0;
      const nCorridaPlano = Array.isArray(p.planosCorrida) ? p.planosCorrida.length : 0;

      const secoesVisiveis = SECOES_PACIENTE.filter(s => !s.soSuper || souSuperAdmin);

      $app.innerHTML = `
        <div class="card">
          <h2 style="margin-bottom:2px">${Util.escapeHtml(nome)}</h2>
          <p class="meta" style="margin-top:0">${Util.escapeHtml((info && info.email) || perfil.email || '')}</p>
          <div class="macro-box-row">
            ${tileHtml('Peso', atual ? atual.weight : '—', atual ? 'kg' : '',
              delta != null ? `${delta > 0 ? '+' : ''}${delta} kg desde ${Util.fmtDate(primeiro.date)}` : (atual ? `em ${Util.fmtDate(atual.date)}` : 'sem pesagem'))}
            ${tileHtml('IMC', imc != null ? imc : '—', '', imc != null ? faixaImcTexto(imc) : 'falta altura')}
            ${tileHtml('Treinos', ad.diasComTreino, '', 'dias nos últimos 30')}
            ${tileHtml('Registrou', ad.diasComComida, '', 'dias com comida em 30')}
          </div>
        </div>

        <div class="card">
          <h3 style="font-size:0.92rem;margin:0 0 8px">📉 Evolução do peso</h3>
          ${pesos.length >= 2
            ? '<canvas id="pac-chart-peso"></canvas><p class="meta" style="font-size:0.76rem">Linha tracejada = tendência (média móvel)</p>'
            : '<div class="empty">Precisa de pelo menos duas pesagens pra desenhar a evolução.</div>'}
        </div>

        <div class="card">
          <h3 style="font-size:0.92rem;margin:0 0 4px">📊 Aderência — últimos 30 dias</h3>
          <p class="meta" style="margin-top:0;font-size:0.76rem">Calculado só sobre o que ele registrou no app.</p>
          ${barraHtml('Dias com comida registrada', ad.diasComComida, 30)}
          ${barraHtml('Dias com treino registrado', ad.diasComTreino, 30)}
          ${ad.dentroMeta && ad.dentroMeta.base > 0
            ? barraHtml(`Dias dentro da meta (${ad.dentroMeta.metaKcal} kcal ±10%)`, ad.dentroMeta.ok, ad.dentroMeta.base, 'dias registrados')
            : `<p class="meta">${p.kcal ? 'Sem dia registrado no período pra comparar com a meta.' : 'Envie uma meta de calorias pra medir isso.'}</p>`}
          <p class="meta" style="font-size:0.76rem">${ad.pesagens} pesagem(ns) no período · ${ad.treinos} treino(s) no total</p>
        </div>

        <div class="card">
          <h3 style="font-size:0.92rem;margin:0 0 8px">📋 O que está prescrito</h3>
          <div class="stat-row" style="margin-bottom:10px">
            <div class="stat-row-info">
              <div class="stat-row-label">DIETA</div>
              <div class="stat-row-value">${p.kcal ? `${p.kcal} kcal` : '—'} <span class="stat-row-unit">${p.nome ? Util.escapeHtml(p.nome) : 'nenhuma enviada'}</span></div>
              ${p.kcal ? `<div class="meta">P ${p.protein || '—'}g · C ${p.carb || '—'}g · G ${p.fat || '—'}g</div>` : ''}
            </div>
          </div>
          <p class="meta">🍽️ Plano alimentar: <strong>${nRefPlano}</strong> refeição(ões) · 🏋️ Treino: <strong>${nTreinoPlano}</strong> plano(s) · 🏃 Corrida: <strong>${nCorridaPlano}</strong></p>
        </div>

        ${menuCardHtml(secoesVisiveis.map(s => escolhaHtml(`data-secao="${s.view}"`, s.icone, s.titulo, s.sub)))}
      `;

      if (pesos.length >= 2) {
        const points = pesos.map(m => ({ label: Util.fmtDate(m.date).slice(0, 5), value: m.weight }));
        const trend = points.length >= 3 ? Util.movingAverage(points, 5) : null;
        drawLineChart(document.getElementById('pac-chart-peso'), points, { trend });
      }
      $app.querySelectorAll('[data-secao]').forEach(btn => {
        btn.addEventListener('click', () => api.goToMais(btn.dataset.secao, uid));
      });
    }

    function montarDiario(dados) {
      detailEl.innerHTML = `
        <div class="card">
          <label>Escolha o dia</label>
          <input type="date" id="ad-diario-data" value="${Util.todayISO()}">
          <div id="ad-diario-conteudo" style="margin-top:10px"></div>
        </div>`;
      const conteudo = detailEl.querySelector('#ad-diario-conteudo');
      const data = detailEl.querySelector('#ad-diario-data');
      const pintar = () => { conteudo.innerHTML = renderDiarioDia(dados || {}, data.value); };
      data.addEventListener('change', pintar);
      pintar();
    }

    function montarRelatorio(dados) {
      detailEl.innerHTML = `
        <div class="card">
          <p class="meta">Mesmo relatório que o paciente pode gerar em Mais → Backup — resumo em texto pronto pra colar numa IA ou pra sua própria análise.</p>
          <label>Período</label>
          <select id="ad-report-periodo">
            <option value="15" selected>Últimos 15 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="60">Últimos 60 dias</option>
            <option value="90">Últimos 90 dias</option>
          </select>
          <button class="secondary" id="ad-gen-report" style="margin-top:10px">Gerar relatório</button>
          <textarea id="ad-report-box" readonly style="min-height:280px;margin-top:10px;display:none;font-family:monospace;font-size:0.8rem"></textarea>
          <button class="secondary" id="ad-copy-report" style="display:none;margin-top:8px">Copiar</button>
        </div>`;
      detailEl.querySelector('#ad-gen-report').addEventListener('click', () => {
        const diasRel = Number(detailEl.querySelector('#ad-report-periodo').value) || 15;
        const box = detailEl.querySelector('#ad-report-box');
        box.value = gerarRelatorio(diasRel, dados || {});
        box.style.display = '';
        detailEl.querySelector('#ad-copy-report').style.display = '';
      });
      detailEl.querySelector('#ad-copy-report').addEventListener('click', () => {
        navigator.clipboard.writeText(detailEl.querySelector('#ad-report-box').value);
      });
    }

    function montarDieta(uid, presc) {
      const p = presc || {};
      detailEl.innerHTML = `
        <div class="card">
          ${presc ? `<p class="meta">Dieta atual: <strong>${Util.escapeHtml(p.nome || '')}</strong> · ${p.kcal || '—'} kcal</p>` : '<p class="meta">Nenhuma dieta enviada ainda.</p>'}
          <label>Nome da dieta</label>
          <input type="text" id="ad-nome" value="${Util.escapeHtml(p.nome || '')}" placeholder="Ex: Dieta agosto">
          <div class="row">
            <div><label>Calorias</label><input type="number" id="ad-kcal" value="${p.kcal || ''}"></div>
            <div><label>Proteína (g)</label><input type="number" id="ad-protein" value="${p.protein || ''}"></div>
          </div>
          <div class="row">
            <div><label>Carbo (g)</label><input type="number" id="ad-carb" value="${p.carb || ''}"></div>
            <div><label>Gordura (g)</label><input type="number" id="ad-fat" value="${p.fat || ''}"></div>
          </div>
          <label>Fibras (g) — opcional</label>
          <input type="number" id="ad-fiber" value="${p.fiber || ''}">
          <button class="primary" id="ad-enviar" style="margin-top:10px">Enviar dieta para este usuário</button>
          <p class="meta" id="ad-msg" style="margin-top:8px"></p>
        </div>`;
      detailEl.querySelector('#ad-enviar').addEventListener('click', async () => {
        const msg = detailEl.querySelector('#ad-msg');
        const nome = detailEl.querySelector('#ad-nome').value.trim();
        const kcal = Number(detailEl.querySelector('#ad-kcal').value) || null;
        if (!nome || !kcal) { msg.textContent = 'Informe ao menos nome e calorias.'; return; }
        const dieta = {
          nome, kcal,
          protein: Number(detailEl.querySelector('#ad-protein').value) || null,
          carb: Number(detailEl.querySelector('#ad-carb').value) || null,
          fat: Number(detailEl.querySelector('#ad-fat').value) || null,
          fiber: Number(detailEl.querySelector('#ad-fiber').value) || null,
        };
        msg.textContent = 'Enviando…';
        try {
          await Cloud.enviarDieta(uid, dieta);
          // A visão geral lê a prescrição do cache; sem atualizar, voltar mostraria a dieta
          // velha e daria a impressão de que o envio não pegou.
          pacienteCache.presc = Object.assign({}, pacienteCache.presc || {}, dieta);
          msg.textContent = '✅ Dieta enviada! O usuário verá ao abrir/entrar no app.';
        } catch (e) { msg.textContent = '⚠️ Falha ao enviar: ' + (e.message || ''); }
      });
    }

    // Espelha o diário do paciente (Alimentação + Treino + Corrida + Água) num dia específico,
    // só leitura — usa o snapshot já baixado (dados), sem nova consulta por troca de data.
    function renderDiarioDia(dados, dateISO) {
      const alimentacao = (dados.alimentacao || []).filter(e => e.date === dateISO).sort((a, b) => (a.order || 0) - (b.order || 0));
      const treinos = (dados.treino || []).filter(t => t.date === dateISO);
      const corridas = (dados.corridas || []).filter(c => c.date === dateISO);
      const agua = (dados.agua || []).filter(a => a.date === dateISO);
      const aguaTotal = agua.reduce((s, a) => s + (a.ml || 0), 0);

      const totals = { kcal: 0, carbs: 0, protein: 0, fat: 0, fiber: 0 };
      alimentacao.forEach(e => {
        totals.kcal += e.kcal || 0; totals.carbs += e.carbs || 0;
        totals.protein += e.protein || 0; totals.fat += e.fat || 0; totals.fiber += e.fiber || 0;
      });

      const grupos = {};
      alimentacao.forEach(e => { grupos[e.mealType] = grupos[e.mealType] || []; grupos[e.mealType].push(e); });
      const fotosRefeicao = (dados.refeicao_fotos || []).filter(f => f.date === dateISO);
      const fotoDe = tipo => fotosRefeicao.find(f => f.mealType === tipo);

      return `
        <p class="meta"><strong>${totals.kcal.toFixed(0)} kcal</strong> · P ${totals.protein.toFixed(0)}g · C ${totals.carbs.toFixed(0)}g · G ${totals.fat.toFixed(0)}g · Fibra ${totals.fiber.toFixed(0)}g</p>
        <p class="meta">💧 Água: ${aguaTotal}ml</p>
        <p class="meta">${treinos.length > 0 ? `✅ Treino: ${treinos.map(t => (t.exercises || []).map(e => `${Util.escapeHtml(e.name)}${e.weight ? ` (${e.weight}kg)` : ''}`).join(', ') || 'sem exercícios').join(' | ')}` : '⬜ Sem treino registrado'}</p>
        <p class="meta">${corridas.length > 0 ? `🏃 Corrida: ${corridas.map(c => `${c.distanceKm}km em ${c.timeMin}min`).join(', ')}` : '⬜ Sem corrida registrada'}</p>
        ${Object.keys(grupos).length === 0 ? '<p class="empty">Nenhuma refeição registrada neste dia</p>' : Object.keys(grupos).map(tipo => {
          const foto = fotoDe(tipo);
          return `
          <div style="margin-top:10px">
            <div class="row" style="align-items:center">
              ${foto ? `<img src="${foto.fotoDataURL}" class="meal-thumb" alt="Foto do prato">` : ''}
              <strong style="font-size:0.85rem">${Util.escapeHtml(tipo)}</strong>
            </div>
            ${grupos[tipo].map(e => `
              <div class="list-item">
                <div>
                  <div>${Util.escapeHtml(e.foodName)} ${e.qty !== 1 ? `<span class="meta">(${e.qty}x)</span>` : ''}</div>
                  <div class="meta">${e.kcal} kcal · P ${e.protein}g · C ${e.carbs}g · G ${e.fat}g</div>
                </div>
              </div>
            `).join('')}
          </div>
        `;
        }).join('')}
      `;
    }

    // Medidas aferidas na consulta: a nutri lança e vai parar no diário do paciente.
    // O envio é uma prescrição (prescricoes/{uid}.medidas), não escrita direta em
    // users/{uid} — as regras dão essa escrita só ao dono do diário, e o app dele aplica
    // no login seguinte. Campos vêm de ViewMedidas.FIELDS pra tela da nutri e a do paciente
    // nunca divergirem.
    function montarMedidasPaciente(uid, dados, presc) {
      const cont = detailEl.querySelector('#admin-medidas');
      if (!cont) return;
      if (typeof Cloud.enviarMedidas !== 'function') return;
      const campos = (typeof ViewMedidas !== 'undefined' && Array.isArray(ViewMedidas.FIELDS)) ? ViewMedidas.FIELDS : [];
      if (!campos.length) return;

      const medidas = medidasDoPaciente(dados, presc)
        .slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      const ultima = medidas[0] || null;
      const perfil = (dados && dados.perfil) || {};
      const val = k => (ultima && ultima[k] != null ? ultima[k] : '');
      const input = (id, label, valor) => `
        <div>
          <label style="font-size:0.75rem">${Util.escapeHtml(label)}</label>
          <input type="number" step="0.1" id="${id}" value="${valor}">
        </div>`;
      // Altura entra junto dos campos de medida na tela, mas não é medida: não muda com o
      // tempo, então vai direto pro perfil em vez de virar ponto no histórico.
      const todos = campos.map(f => ({ id: `am-${f.key}`, label: f.label, valor: val(f.key) }))
        .concat([{ id: 'am-altura', label: 'Altura (cm) — vai pro perfil', valor: perfil.altura != null ? perfil.altura : '' }]);
      const linhas = [];
      for (let i = 0; i < todos.length; i += 2) linhas.push(todos.slice(i, i + 2));
      let avisosImport = [];

      function paint() {
      cont.innerHTML = `
        <div class="card">
          <h3 style="font-size:0.92rem;margin:0 0 6px">📏 Medidas da consulta</h3>
          <p class="meta" style="margin-top:0">${ultima
            ? `Última do paciente: ${Util.escapeHtml(ultima.date)}${ultima.weight != null ? ` · ${ultima.weight}kg` : ''}. Os campos já vêm com ela — ajuste o que você mediu hoje.`
            : 'O paciente ainda não tem medidas registradas.'}</p>
          ${importadorHtml({
            id: 'am-imp',
            rotulo: 'Colar a folha da consulta',
            ajuda: 'Cole as medidas como você anotou, uma por linha. Elas só PREENCHEM os campos abaixo — nada é enviado até você conferir e apertar o botão no fim.',
            exemplo: EXEMPLO_MEDIDAS,
            avisos: avisosImport,
          })}
          <label>Data da aferição</label>
          <input type="date" id="am-data" value="${Util.escapeHtml(Util.todayISO())}">
          ${linhas.map(par => `<div class="row">${par.map(c => input(c.id, c.label, c.valor)).join('')}</div>`).join('')}
          <label style="margin-top:8px">Observações da consulta</label>
          <textarea id="am-notes" placeholder="Ex: retorno em 30 dias, manter o treino atual..."></textarea>
          <button class="primary" id="am-enviar" style="margin-top:10px">Enviar medidas para o paciente</button>
          <p class="meta" id="am-msg" style="margin-top:8px">Peso e altura também atualizam o cadastro dele, não só o gráfico.</p>
          <p class="meta" style="font-size:0.74rem">Aqui no painel a medida já vale na hora. No diário DELE ela entra quando ele abrir o app.</p>
        </div>
      `;

      // Importar preenche os CAMPOS, não envia. Aqui isso é ainda mais literal que no
      // treino e no plano alimentar: a nutri vê cada número no seu campo antes de mandar.
      cont.querySelector('#am-imp-ler').addEventListener('click', () => {
        const r = ParsePlano.parseMedidas(cont.querySelector('#am-imp-texto').value);
        const texto = cont.querySelector('#am-imp-texto').value;
        avisosImport = r.avisos;
        paint();
        cont.querySelector('#am-imp-texto').value = texto;
        if (avisosImport.length) cont.querySelector('#am-imp-texto').closest('details').open = true;

        let preenchidos = 0;
        Object.keys(r.medida).forEach(k => {
          if (k === 'date') { cont.querySelector('#am-data').value = r.medida.date; return; }
          const el = cont.querySelector(`#am-${k}`);
          if (el) { el.value = r.medida[k]; preenchidos++; }
        });
        cont.querySelector('#am-msg').textContent = preenchidos
          ? `✅ ${preenchidos} campo(s) preenchido(s). Confira e envie.`
          : '⚠️ Nenhum campo reconhecido — veja os avisos.';
      });

      cont.querySelector('#am-enviar').addEventListener('click', async () => {
        const msg = cont.querySelector('#am-msg');
        const data = cont.querySelector('#am-data').value;
        if (!data) { msg.textContent = '⚠️ Escolha a data da aferição.'; return; }
        const medida = { date: data };
        campos.forEach(f => {
          const v = cont.querySelector(`#am-${f.key}`).value;
          if (v !== '') medida[f.key] = Number(v);
        });
        const alturaV = cont.querySelector('#am-altura').value;
        if (alturaV !== '') medida.altura = Number(alturaV);
        const notes = cont.querySelector('#am-notes').value.trim();
        if (notes) medida.notes = notes;
        // Só a data não é aferição: sem isso um clique sem querer viraria um registro vazio
        // no histórico do paciente.
        if (Object.keys(medida).length <= 1) { msg.textContent = '⚠️ Preencha pelo menos um campo.'; return; }
        msg.textContent = 'Enviando…';
        try {
          const nova = await Cloud.enviarMedidas(uid, medida);
          // Sem isso, sair da tela e voltar mostraria o formulário zerado de novo: a lista
          // que alimenta o pré-preenchimento vem do cache, não de uma nova consulta.
          const p = pacienteCache.presc || {};
          pacienteCache.presc = Object.assign({}, p, { medidas: (p.medidas || []).concat([nova || medida]) });
          msg.textContent = '✅ Enviado! Entra no diário dele na próxima vez que abrir o app.';
        } catch (e) { msg.textContent = '⚠️ Falha: ' + (e.message || ''); }
      });
      }
      paint();
    }

    // Promover/remover profissional (só super-admin). O papel de nutri é a existência do
    // documento admins/{uid} no Firestore, que antes só nascia pelo Console — cadastrar
    // uma nutri obrigava a sair do app. `aviso` existe pra reaproveitar o card depois de
    // uma promoção: repinta com o estado novo já carregando a mensagem de sucesso, em vez
    // de deixar o botão com o rótulo velho.
    function montarPapel(uid, info, aviso) {
      const cont = detailEl.querySelector('#admin-papel');
      if (!cont) return;
      if (typeof Cloud.isSuperAdmin !== 'function' || !Cloud.isSuperAdmin()) return;
      if (typeof Cloud.papelDe !== 'function') return;

      const card = corpo => `<div class="card"><h3 style="font-size:0.92rem;margin:0 0 6px">🎓 Papel</h3>${corpo}</div>`;

      // O próprio dono não aparece com botão: rebaixar a si mesmo deixaria o app sem
      // ninguém capaz de promover, e só o Console desfaria. As regras recusam do mesmo
      // jeito — isto aqui é só pra não oferecer um botão que vai falhar.
      if (typeof Cloud.uid === 'function' && Cloud.uid() === uid) {
        cont.innerHTML = card('<p class="meta">Este é você (super-admin). O papel do próprio dono só muda pelo Console do Firebase.</p>');
        return;
      }

      cont.innerHTML = card('<div class="empty">Carregando papel…</div>');
      Cloud.papelDe(uid).then(papel => {
        if (papel.super) {
          cont.innerHTML = card('<p class="meta"><strong>Super-admin.</strong> Esse papel só muda pelo Console do Firebase.</p>');
          return;
        }
        const nome = (info && (info.displayName || info.email)) || uid;
        const nPacientes = usersCache.filter(u => u.nutriId === uid).length;
        const plural = nPacientes > 1;
        cont.innerHTML = card(`
          <p class="meta">Atual: <strong>${papel.nutri ? 'Profissional (nutri)' : 'Paciente'}</strong></p>
          ${papel.nutri && nPacientes > 0
            ? `<p class="meta">Tem ${nPacientes} paciente${plural ? 's' : ''} vinculado${plural ? 's' : ''} — ao remover o papel, ${plural ? 'eles ficam soltos' : 'ele fica solto'} até você reatribuir.</p>`
            : ''}
          <button class="${papel.nutri ? '' : 'primary'}" id="papel-btn" style="margin-top:10px">
            ${papel.nutri ? 'Remover papel de profissional' : `Tornar profissional`}
          </button>
          <p class="meta" id="papel-msg" style="margin-top:6px">${aviso
            ? Util.escapeHtml(aviso)
            : (papel.nutri ? '' : 'Passa a ter painel de pacientes e link de convite.')}</p>
        `);
        cont.querySelector('#papel-btn').addEventListener('click', async () => {
          const msg = cont.querySelector('#papel-msg');
          if (papel.nutri && !confirm(`Remover o papel de profissional de ${nome}?`)) return;
          msg.textContent = 'Salvando…';
          try {
            if (papel.nutri) await Cloud.removerNutri(uid);
            else await Cloud.promoverNutri(uid, info || {});
            // Repinta os dois cards: o papel mudou e a lista de nutris do reatribuir
            // ficou desatualizada (quem virou profissional passa a ser opção lá).
            montarPapel(uid, info, papel.nutri
              ? '✅ Papel removido. Ele precisa entrar de novo pro painel sumir.'
              : '✅ Agora é profissional. Ele precisa sair e entrar de novo pro painel aparecer.');
            montarReatribuir(uid, info);
          } catch (e) {
            msg.textContent = '⚠️ Falha: ' + (e.message || '') + ' — confira se as regras novas do Firestore já foram publicadas no Console.';
          }
        });
      }).catch(e => { cont.innerHTML = card(`<div class="empty">Erro ao ler o papel: ${Util.escapeHtml(e.message || '')}</div>`); });
    }

    // Reatribuir paciente a uma nutri (só super-admin). Resolve pacientes "soltos"
    // (sem nutriId) ou vinculados à nutri errada, sem o paciente precisar recriar a conta.
    function montarReatribuir(uid, info) {
      const cont = detailEl.querySelector('#admin-reatribuir');
      if (!cont) return;
      if (typeof Cloud.isSuperAdmin !== 'function' || !Cloud.isSuperAdmin()) return;
      cont.innerHTML = '<div class="card"><div class="empty">Carregando profissionais…</div></div>';
      Cloud.listarNutris().then(nutris => {
        const atual = (info && info.nutriId) || '';
        const nomeDe = n => Util.escapeHtml(n.displayName || n.email || n.nome || n.uid);
        const atualNome = nutris.find(n => n.uid === atual);
        cont.innerHTML = `
          <div class="card">
            <h3 style="font-size:0.92rem;margin:0 0 6px">🔗 Profissional responsável (super-admin)</h3>
            <p class="meta">Atual: <strong>${atual ? (atualNome ? nomeDe(atualNome) : Util.escapeHtml(atual)) : 'nenhum (paciente solto)'}</strong></p>
            <label>Vincular a</label>
            <select id="reat-nutri">
              ${nutris.map(n => `<option value="${Util.escapeHtml(n.uid)}" ${n.uid === atual ? 'selected' : ''}>${nomeDe(n)}</option>`).join('')}
            </select>
            <button class="primary" id="reat-btn" style="margin-top:10px">Reatribuir paciente</button>
            <p class="meta" id="reat-msg" style="margin-top:6px"></p>
          </div>
        `;
        cont.querySelector('#reat-btn').addEventListener('click', async () => {
          const nutriUid = cont.querySelector('#reat-nutri').value;
          const msg = cont.querySelector('#reat-msg');
          if (!nutriUid) { msg.textContent = 'Escolha uma nutri.'; return; }
          msg.textContent = 'Salvando…';
          try {
            await Cloud.reatribuirPaciente(uid, nutriUid);
            if (info) info.nutriId = nutriUid;
            msg.textContent = '✅ Paciente vinculado! Ele já aparece para esse profissional.';
          } catch (e) { msg.textContent = '⚠️ Falha: ' + (e.message || ''); }
        });
      }).catch(e => { cont.innerHTML = `<div class="card"><div class="empty">Erro ao carregar profissionais: ${Util.escapeHtml(e.message || '')}</div></div>`; });
    }

    // Construtor de plano alimentar (refeição a refeição) para um paciente.
    function montarPlano(uid, presc) {
      const cont = detailEl.querySelector('#admin-plano');
      if (!cont) return;
      const NUTRI = ['kcal', 'carbs', 'sugars', 'protein', 'fat', 'satFat', 'transFat', 'fiber', 'sodium'];
      const biblioteca = Storage.getAll('alimentos_biblioteca').sort((a, b) => a.name.localeCompare(b.name));
      let refeicoes = (presc && Array.isArray(presc.refeicoes))
        ? presc.refeicoes.map(r => ({ ...r, itens: (r.itens || []).map(i => ({ ...i })) })) : [];
      let itensNovo = [];
      let plSelectedFood = null;
      let avisosImport = [];

      function paint() {
        cont.innerHTML = `
          <div class="card">
            <h3 style="font-size:0.92rem;margin:0 0 8px">🍽️ Plano alimentar (refeição a refeição)</h3>
            ${importadorHtml({ id: 'pl-imp', rotulo: 'Importar plano colado', ajuda: 'Cole o plano como você já escreve. Uma linha em branco separa as refeições. Nada vai pro paciente agora — o texto só monta a lista abaixo pra você conferir.', exemplo: EXEMPLO_PLANO, avisos: avisosImport })}
            ${refeicoes.length === 0 ? '<p class="meta">Nenhuma refeição no plano ainda.</p>' : refeicoes.map((r, i) => `
              <div class="list-item">
                <div>
                  <strong>${Util.escapeHtml(r.nome)}</strong> ${r.horario ? `<span class="meta">${Util.escapeHtml(r.horario)}</span>` : ''}
                  <div class="meta">${(r.itens || []).map(it => Util.escapeHtml(it.foodName) + (it.qty !== 1 ? ` (${it.qty}x)` : '')).join(', ')}</div>
                </div>
                <button class="link" data-del-ref="${i}">✕</button>
              </div>
            `).join('')}
            <hr style="border:none;border-top:1px solid var(--border);margin:12px 0">
            <label>Nome da refeição</label>
            <input type="text" id="pl-nome" placeholder="Ex: Café da manhã">
            <label>Horário</label>
            <input type="time" id="pl-hora">
            <label>Adicionar alimento</label>
            <div class="autocomplete-wrap">
              <input type="text" id="pl-food-search" placeholder="Buscar na biblioteca..." autocomplete="off">
              <div class="autocomplete-list" id="pl-food-results" style="display:none"></div>
            </div>
            <div id="pl-selected-food-box"></div>
            <button class="secondary" id="pl-add-item" style="width:100%;margin-top:8px" disabled>+ Adicionar item à refeição</button>
            <div id="pl-itens" style="margin-top:8px"></div>
            <button class="secondary" id="pl-add-ref" style="width:100%;margin-top:10px">+ Adicionar refeição ao plano</button>
            ${refeicoes.length ? `<p class="meta" style="margin-top:10px;border-left:3px solid var(--accent);padding-left:8px"><strong>${refeicoes.length} refeição(ões) montada(s) e ainda não enviada(s).</strong> Só chega no paciente depois do botão abaixo.</p>` : ''}
            <button class="primary" id="pl-enviar" style="margin-top:8px">Enviar plano alimentar${refeicoes.length ? ` (${refeicoes.length})` : ''}</button>
            <p class="meta" id="pl-msg" style="margin-top:6px"></p>
          </div>
        `;
        pintarItens();
        cont.querySelectorAll('[data-del-ref]').forEach(b => b.addEventListener('click', () => { refeicoes.splice(Number(b.dataset.delRef), 1); paint(); }));
        wireFoodSearch();

        cont.querySelector('#pl-imp-ler').addEventListener('click', () => {
          const texto = cont.querySelector('#pl-imp-texto').value;
          // Casa contra a MESMA biblioteca que o autocomplete usa logo abaixo, pra não
          // haver alimento que a busca acha e a importação não.
          const r = ParsePlano.parsePlanoAlimentar(texto, biblioteca);
          avisosImport = r.avisos;
          r.refeicoes.forEach(ref => refeicoes.push(ref));
          const msgTexto = r.refeicoes.length
            ? `✅ ${r.refeicoes.length} refeição(ões) lida(s). Confira abaixo e envie.`
            : '⚠️ Nenhuma refeição reconhecida — veja os avisos.';
          paint();
          const ta = cont.querySelector('#pl-imp-texto');
          if (ta && avisosImport.length) ta.closest('details').open = true;
          cont.querySelector('#pl-msg').textContent = msgTexto;
        });
        cont.querySelector('#pl-add-ref').addEventListener('click', () => {
          const nome = cont.querySelector('#pl-nome').value.trim();
          const horario = cont.querySelector('#pl-hora').value || null;
          if (!nome || itensNovo.length === 0) { cont.querySelector('#pl-msg').textContent = 'Dê um nome e adicione ao menos 1 alimento.'; return; }
          refeicoes.push({ nome, horario, itens: itensNovo });
          itensNovo = [];
          paint();
        });
        cont.querySelector('#pl-enviar').addEventListener('click', async () => {
          const msg = cont.querySelector('#pl-msg');
          if (refeicoes.length === 0) { msg.textContent = 'Adicione ao menos uma refeição.'; return; }
          msg.textContent = 'Enviando…';
          try {
            await Cloud.enviarPlano(uid, refeicoes);
            pacienteCache.presc = Object.assign({}, pacienteCache.presc || {}, { refeicoes });
            msg.textContent = '✅ Plano alimentar enviado! O paciente recebe como refeições prontas.';
          }
          catch (e) { msg.textContent = '⚠️ Falha: ' + (e.message || ''); }
        });
      }

      // Busca com autocomplete + preview de porções/gramas, mesmo padrão usado pelo
      // paciente ao registrar refeição (js/views/alimentacao.js) — só que aqui monta o
      // plano do zero em vez de lançar no diário do dia.
      function wireFoodSearch() {
        const searchInput = cont.querySelector('#pl-food-search');
        const resultsBox = cont.querySelector('#pl-food-results');
        const addItemBtn = cont.querySelector('#pl-add-item');
        plSelectedFood = null;

        searchInput.addEventListener('input', () => {
          const q = searchInput.value.trim().toLowerCase();
          plSelectedFood = null;
          addItemBtn.disabled = true;
          cont.querySelector('#pl-selected-food-box').innerHTML = '';
          if (!q) { resultsBox.style.display = 'none'; return; }
          const matches = biblioteca.filter(f => f.name.toLowerCase().includes(q)).slice(0, 8);
          if (matches.length === 0) {
            resultsBox.innerHTML = '<div class="autocomplete-item">Nenhum resultado.</div>';
            resultsBox.style.display = '';
            return;
          }
          resultsBox.innerHTML = matches.map(f => `
            <div class="autocomplete-item" data-id="${f.id}">
              ${Util.escapeHtml(f.name)}
              <div class="meta">${f.kcal} kcal / ${f.portionLabel}</div>
            </div>
          `).join('');
          resultsBox.style.display = '';
          resultsBox.querySelectorAll('[data-id]').forEach(el => {
            el.addEventListener('click', () => selectPlFood(biblioteca.find(f => f.id === el.dataset.id)));
          });
        });

        function selectPlFood(food) {
          plSelectedFood = food;
          searchInput.value = food.name;
          resultsBox.style.display = 'none';
          addItemBtn.disabled = false;
          cont.querySelector('#pl-selected-food-box').innerHTML = `
            <div class="row">
              <div><label>Porções (de ${Util.escapeHtml(food.portionLabel)})</label><input type="number" id="pl-qty-input" value="1" min="0.01" step="0.1"></div>
              <div><label>ou gramas direto</label><input type="number" id="pl-qty-grams-input" value="${food.portionGrams}" min="1" step="1"></div>
            </div>
            <div class="meta" id="pl-qty-preview" style="margin-top:6px;color:var(--text-muted);font-size:0.8rem"></div>
          `;
          const qtyInput = cont.querySelector('#pl-qty-input');
          const gramsInput = cont.querySelector('#pl-qty-grams-input');
          const updatePreview = () => {
            const qty = Number(qtyInput.value) || 0;
            cont.querySelector('#pl-qty-preview').textContent =
              `${(food.kcal * qty).toFixed(0)} kcal · P ${(food.protein * qty).toFixed(1)}g · C ${(food.carbs * qty).toFixed(1)}g · G ${(food.fat * qty).toFixed(1)}g`;
          };
          qtyInput.addEventListener('input', () => {
            gramsInput.value = Math.round((Number(qtyInput.value) || 0) * food.portionGrams * 10) / 10;
            updatePreview();
          });
          gramsInput.addEventListener('input', () => {
            qtyInput.value = Math.round(((Number(gramsInput.value) || 0) / food.portionGrams) * 1000) / 1000;
            updatePreview();
          });
          updatePreview();
        }

        addItemBtn.addEventListener('click', () => {
          if (!plSelectedFood) return;
          const qtyInput = cont.querySelector('#pl-qty-input');
          const qty = Number(qtyInput.value) || 1;
          const item = { foodName: plSelectedFood.name, qty };
          NUTRI.forEach(f => { item[f] = Math.round((plSelectedFood[f] || 0) * qty * 10) / 10; });
          itensNovo.push(item);
          plSelectedFood = null;
          searchInput.value = '';
          addItemBtn.disabled = true;
          cont.querySelector('#pl-selected-food-box').innerHTML = '';
          pintarItens();
        });
      }

      function pintarItens() {
        const wrap = cont.querySelector('#pl-itens');
        if (!wrap) return;
        wrap.innerHTML = itensNovo.length === 0 ? '<p class="meta">Nenhum alimento nesta refeição ainda.</p>' : itensNovo.map((it, i) => `
          <div class="list-item">
            <div class="meta">${Util.escapeHtml(it.foodName)} ${it.qty !== 1 ? `(${it.qty}x)` : ''} · ${Math.round(it.kcal || 0)} kcal</div>
            <button class="link" data-del-item="${i}">✕</button>
          </div>
        `).join('');
        wrap.querySelectorAll('[data-del-item]').forEach(b => b.addEventListener('click', () => { itensNovo.splice(Number(b.dataset.delItem), 1); pintarItens(); }));
      }

      paint();
    }

    // Lista de compras: texto livre que a nutri escreve (ou pré-preenche a partir do
    // plano alimentar atual, como ponto de partida) e manda pro paciente, separado da
    // montagem refeição a refeição — pra mandar uma lista simples não precisa ter plano.
    function montarListaCompras(uid, presc) {
      const cont = detailEl.querySelector('#admin-lista-compras');
      if (!cont) return;
      cont.innerHTML = `
        <div class="card">
          <h3 style="font-size:0.92rem;margin:0 0 8px">🛒 Lista de compras</h3>
          ${presc && presc.listaCompras ? `<p class="meta">Última enviada ${presc.listaComprasUpdatedAt ? Util.fmtDate(new Date(presc.listaComprasUpdatedAt).toISOString().slice(0, 10)) : ''}</p>` : ''}
          <textarea id="lc-texto" rows="6" placeholder="Ex:&#10;1kg de peito de frango&#10;500g de quinoa&#10;6 ovos&#10;...">${Util.escapeHtml((presc && presc.listaCompras) || '')}</textarea>
          <div class="row" style="margin-top:8px">
            <button class="secondary" id="lc-do-plano">🪄 Preencher a partir do plano atual</button>
            <button class="primary" id="lc-enviar">Enviar lista</button>
          </div>
          <p class="meta" id="lc-msg" style="margin-top:6px"></p>
        </div>
      `;
      cont.querySelector('#lc-do-plano').addEventListener('click', () => {
        const refeicoes = (presc && Array.isArray(presc.refeicoes)) ? presc.refeicoes : [];
        if (!refeicoes.length) { cont.querySelector('#lc-msg').textContent = 'Esse paciente ainda não tem plano alimentar enviado.'; return; }
        const biblioteca = Storage.getAll('alimentos_biblioteca');
        const somaPorNome = {};
        refeicoes.forEach(r => {
          (r.itens || []).forEach(it => {
            somaPorNome[it.foodName] = (somaPorNome[it.foodName] || 0) + (it.qty || 0);
          });
        });
        const texto = Object.keys(somaPorNome).sort((a, b) => a.localeCompare(b)).map(nome => {
          const qtyTotal = somaPorNome[nome];
          const alimento = biblioteca.find(f => f.name === nome);
          const gramas = alimento ? Math.round(qtyTotal * alimento.portionGrams) : null;
          return gramas != null ? `${nome} — ${gramas}g` : `${nome} — ${qtyTotal.toFixed(2)}x`;
        }).join('\n');
        cont.querySelector('#lc-texto').value = texto;
      });
      cont.querySelector('#lc-enviar').addEventListener('click', async () => {
        const texto = cont.querySelector('#lc-texto').value.trim();
        const msg = cont.querySelector('#lc-msg');
        if (!texto) { msg.textContent = 'Escreva ou preencha a lista antes de enviar.'; return; }
        msg.textContent = 'Enviando…';
        try { await Cloud.enviarListaCompras(uid, texto); msg.textContent = '✅ Lista enviada! O paciente já vê em Alimentação.'; }
        catch (e) { msg.textContent = '⚠️ Falha: ' + (e.message || ''); }
      });
    }

    // Regras de refeição livre: a nutri pode já deixar pré-configurado pro paciente
    // (mesmos campos que o próprio paciente edita em Mais → Refeição Livre). Ele ainda
    // pode ajustar depois — isso só preenche um ponto de partida.
    function montarRegrasRefeicaoLivre(uid, presc) {
      const cont = detailEl.querySelector('#admin-refeicao-livre');
      if (!cont) return;
      const cfg = { ...RefeicaoLivre.CONFIG_PADRAO, ...(presc && presc.refeicaoLivreConfig) };
      cont.innerHTML = `
        <div class="card">
          <h3 style="font-size:0.92rem;margin:0 0 8px">🍔 Regras da refeição livre</h3>
          <p class="meta">Pré-configure as regras da semana pra esse paciente. Ele ainda pode ajustar depois no app dele.</p>

          <label>Calorias: no máximo quanto % acima da meta (por dia)?</label>
          <input type="number" id="arl-tolerancia" min="0" max="100" step="1" value="${cfg.toleranciaMaxPct}">

          <label style="margin-top:10px">Refeições obrigatórias no dia</label>
          <div class="livre-refeicoes-check">
            ${RefeicaoLivre.TODAS_REFEICOES.map(r => `
              <label class="check-item">
                <input type="checkbox" data-arl-refeicao value="${Util.escapeHtml(r)}" ${cfg.refeicoesObrigatorias.includes(r) ? 'checked' : ''}>
                ${Util.escapeHtml(r)}
              </label>
            `).join('')}
          </div>

          <label style="margin-top:10px">Água: em pelo menos quanto % dos dias da semana?</label>
          <input type="number" id="arl-agua" min="0" max="100" step="1" value="${cfg.aguaPercentMin}">

          <label style="margin-top:10px">Quantas refeições livres por semana</label>
          <input type="number" id="arl-usos" min="1" max="7" step="1" value="${cfg.maxUsosSemana}">

          <button class="primary" id="arl-enviar" style="margin-top:12px">Enviar regras</button>
          <p class="meta" id="arl-msg" style="margin-top:6px"></p>
        </div>
      `;
      cont.querySelector('#arl-enviar').addEventListener('click', async () => {
        const refeicoesObrigatorias = Array.from(cont.querySelectorAll('[data-arl-refeicao]:checked')).map(chk => chk.value);
        const novaConfig = {
          toleranciaMaxPct: Math.max(0, Number(cont.querySelector('#arl-tolerancia').value) || 0),
          refeicoesObrigatorias,
          aguaPercentMin: Math.min(100, Math.max(0, Number(cont.querySelector('#arl-agua').value) || 0)),
          maxUsosSemana: Math.max(1, Number(cont.querySelector('#arl-usos').value) || 1),
        };
        const msg = cont.querySelector('#arl-msg');
        msg.textContent = 'Enviando…';
        try { await Cloud.enviarRegrasRefeicaoLivre(uid, novaConfig); msg.textContent = '✅ Regras enviadas! Já valem no app do paciente.'; }
        catch (e) { msg.textContent = '⚠️ Falha: ' + (e.message || ''); }
      });
    }

    // Construtor de plano de treino (A/B/C) pra enviar a um paciente — mesmo padrão do
    // montarPlano (alimentação), mas cada "pacote" vira uma lista de planos com exercícios.
    function montarTreino(uid, presc) {
      const cont = detailEl.querySelector('#admin-treino');
      if (!cont) return;
      const bibliotecaEx = Storage.getAll('exercicios_biblioteca');
      let planosTreino = (presc && Array.isArray(presc.planosTreino))
        ? presc.planosTreino.map(p => ({ ...p, exercises: (p.exercises || []).map(e => ({ ...e })) })) : [];
      let rows = [{ name: '', sets: '', reps: '', weight: '', descanso: '', obs: '' }];
      let avisosImport = [];

      // Mesma regra de visibilidade dos pacotes pessoais usada em Planos de Treino:
      // só o dono do app vê as próprias fichas de personal no seletor.
      const souDono = typeof Cloud === 'undefined' || !Cloud.isEnabled()
        || (typeof Cloud.isSuperAdmin === 'function' && Cloud.isSuperAdmin());
      const pacotesVisiveis = Object.keys(TREINOS_PREDEFINIDOS).filter(id => souDono || !TREINOS_PREDEFINIDOS[id].pessoal);

      function paint() {
        cont.innerHTML = `
          <div class="card">
            <h3 style="font-size:0.92rem;margin:0 0 8px">🏋️ Plano de treino (A/B/C)</h3>
            ${importadorHtml({ id: 'pt-imp', rotulo: 'Importar treino colado', ajuda: 'Cole o treino como você já escreve. Uma linha em branco separa os treinos. Nada vai pro paciente agora — o texto só monta a lista abaixo pra você conferir.', exemplo: EXEMPLO_TREINO, avisos: avisosImport })}
            <label>Carregar pacote pré-definido (ponto de partida, editável)</label>
            <select id="pt-pack-select">
              ${pacotesVisiveis.map(id => {
                const dieta = DIETA_TEMPLATES.find(d => d.id === id);
                const rotulo = dieta ? `${dieta.nome} — ${TREINOS_PREDEFINIDOS[id].label}` : TREINOS_PREDEFINIDOS[id].label;
                return `<option value="${id}">${Util.escapeHtml(rotulo)}</option>`;
              }).join('')}
            </select>
            <p class="meta" id="pt-pack-desc" style="color:var(--text-muted);font-size:0.78rem"></p>
            <button class="secondary" id="pt-load-pack" style="width:100%;margin-bottom:12px">Carregar pacote como sugestão</button>
            ${planosTreino.length === 0 ? '<p class="meta">Nenhum plano de treino no pacote ainda.</p>' : planosTreino.map((p, i) => `
              <div class="list-item">
                <div>
                  <strong>${Util.escapeHtml(p.nome)}</strong>
                  <div class="meta">${(p.exercises || []).map(e => Util.escapeHtml(e.name)).filter(Boolean).join(', ') || 'sem exercícios'}</div>
                </div>
                <button class="link" data-del-plano-treino="${i}">✕</button>
              </div>
            `).join('')}
            <hr style="border:none;border-top:1px solid var(--border);margin:12px 0">
            <label>Nome do plano</label>
            <input type="text" id="pt-nome" placeholder="Ex: Treino A">
            <datalist id="datalist-exercicios-pt">${bibliotecaEx.map(e => `<option value="${Util.escapeHtml(e.name)}">`).join('')}</datalist>
            <div id="pt-exercicios" style="margin-top:8px"></div>
            <button class="secondary" id="pt-add-exercicio">+ Adicionar exercício</button>
            <button class="secondary" id="pt-add-plano" style="width:100%;margin-top:10px">+ Adicionar plano ao pacote</button>
            ${planosTreino.length ? `<p class="meta" style="margin-top:10px;border-left:3px solid var(--accent);padding-left:8px"><strong>${planosTreino.length} plano(s) montado(s) e ainda não enviado(s).</strong> Só chega no paciente depois do botão abaixo.</p>` : ''}
            <button class="primary" id="pt-enviar" style="margin-top:8px">Enviar treino${planosTreino.length ? ` (${planosTreino.length})` : ''}</button>
            <p class="meta" id="pt-msg" style="margin-top:6px"></p>
          </div>
        `;
        pintarRows();
        cont.querySelectorAll('[data-del-plano-treino]').forEach(b => b.addEventListener('click', () => { planosTreino.splice(Number(b.dataset.delPlanoTreino), 1); paint(); }));

        const packSelect = cont.querySelector('#pt-pack-select');
        const updatePackDesc = () => { cont.querySelector('#pt-pack-desc').textContent = TREINOS_PREDEFINIDOS[packSelect.value].descricao; };
        packSelect.addEventListener('change', updatePackDesc);
        updatePackDesc();
        cont.querySelector('#pt-load-pack').addEventListener('click', () => {
          const pack = TREINOS_PREDEFINIDOS[packSelect.value];
          pack.planos.forEach(p => { planosTreino.push({ nome: p.nome, exercises: p.exercises.map(e => ({ ...e })) }); });
          paint();
        });

        cont.querySelector('#pt-imp-ler').addEventListener('click', () => {
          const texto = cont.querySelector('#pt-imp-texto').value;
          const r = ParsePlano.parseTreino(texto);
          avisosImport = r.avisos;
          // Acrescenta ao que já estava montado em vez de substituir: dá pra colar o
          // treino em duas partes, ou colar por cima de um pacote carregado.
          r.planos.forEach(p => planosTreino.push(p));
          const msgTexto = r.planos.length
            ? `✅ ${r.planos.length} treino(s) lido(s). Confira abaixo e envie.`
            : '⚠️ Nenhum treino reconhecido — veja os avisos.';
          paint();
          const det = cont.querySelector('#pt-imp-texto');
          if (det && avisosImport.length) det.closest('details').open = true;
          cont.querySelector('#pt-msg').textContent = msgTexto;
        });

        cont.querySelector('#pt-add-exercicio').addEventListener('click', () => {
          syncRows();
          rows.push({ name: '', sets: '', reps: '', weight: '', descanso: '', obs: '' });
          pintarRows();
        });

        cont.querySelector('#pt-add-plano').addEventListener('click', () => {
          syncRows();
          const nome = cont.querySelector('#pt-nome').value.trim();
          const exercises = rows.filter(r => r.name.trim());
          if (!nome || exercises.length === 0) { cont.querySelector('#pt-msg').textContent = 'Dê um nome e adicione ao menos 1 exercício.'; return; }
          planosTreino.push({ nome, exercises });
          rows = [{ name: '', sets: '', reps: '', weight: '', descanso: '', obs: '' }];
          paint();
        });

        cont.querySelector('#pt-enviar').addEventListener('click', async () => {
          const msg = cont.querySelector('#pt-msg');
          if (planosTreino.length === 0) { msg.textContent = 'Adicione ao menos um plano de treino.'; return; }
          msg.textContent = 'Enviando…';
          try {
            await Cloud.enviarTreino(uid, planosTreino);
            pacienteCache.presc = Object.assign({}, pacienteCache.presc || {}, { planosTreino });
            msg.textContent = '✅ Treino enviado! O paciente recebe como planos prontos.';
          }
          catch (e) { msg.textContent = '⚠️ Falha: ' + (e.message || ''); }
        });
      }

      function syncRows() {
        const wrap = cont.querySelector('#pt-exercicios');
        if (!wrap) return;
        const names = wrap.querySelectorAll('.ex-name');
        const sets = wrap.querySelectorAll('.ex-sets');
        const reps = wrap.querySelectorAll('.ex-reps');
        const weights = wrap.querySelectorAll('.ex-weight');
        const descansos = wrap.querySelectorAll('.ex-descanso');
        const obses = wrap.querySelectorAll('.ex-obs');
        rows = rows.map((r, i) => ({
          name: names[i] ? names[i].value : r.name,
          sets: sets[i] ? sets[i].value : r.sets,
          reps: reps[i] ? reps[i].value : r.reps,
          weight: weights[i] ? weights[i].value : r.weight,
          descanso: descansos[i] ? descansos[i].value : r.descanso,
          obs: obses[i] ? obses[i].value : r.obs,
        }));
      }

      function pintarRows() {
        const wrap = cont.querySelector('#pt-exercicios');
        if (!wrap) return;
        wrap.innerHTML = rows.map((r, i) => `
          <div class="exercise-row" data-i="${i}">
            <input type="text" class="ex-name" list="datalist-exercicios-pt" placeholder="Exercício" value="${Util.escapeHtml(r.name)}">
            <input type="number" class="small ex-sets" placeholder="Séries" value="${Util.escapeHtml(r.sets)}">
            <input type="text" class="small ex-reps" placeholder="Reps" value="${Util.escapeHtml(r.reps)}">
            <input type="number" class="small ex-weight" placeholder="Kg" value="${Util.escapeHtml(r.weight)}">
            <input type="text" class="ex-descanso" placeholder="Descanso (ex: 1m30s)" value="${Util.escapeHtml(r.descanso)}" style="flex-basis:100%">
            <input type="text" class="ex-obs" placeholder="Observação" value="${Util.escapeHtml(r.obs)}" style="flex-basis:100%">
            <button class="link" data-remove-row="${i}">✕</button>
          </div>
        `).join('');
        wrap.querySelectorAll('[data-remove-row]').forEach(btn => {
          btn.addEventListener('click', () => {
            syncRows();
            rows.splice(Number(btn.dataset.removeRow), 1);
            if (rows.length === 0) rows.push({ name: '', sets: '', reps: '', weight: '', descanso: '', obs: '' });
            pintarRows();
          });
        });
      }

      paint();
    }

    // Pedir algo ao paciente. Todo o resto do painel empurra conteúdo pra ele; isto é o
    // caminho inverso, e chega como notificação com atalho pra tela onde ele resolve.
    const TIPOS_SOLICITACAO = [
      { valor: 'medidas', rotulo: '📏 Atualizar medidas' },
      { valor: 'peso', rotulo: '⚖️ Registrar peso' },
      { valor: 'fotos', rotulo: '📸 Mandar fotos de progresso' },
      { valor: 'exames', rotulo: '🩺 Enviar exames' },
      { valor: 'outro', rotulo: '💬 Outro recado' },
    ];

    function montarSolicitacao(uid, presc) {
      const cont = detailEl.querySelector('#admin-solicitar');
      if (!cont) return;
      const jaFeitas = (presc && Array.isArray(presc.solicitacoes)) ? presc.solicitacoes.slice().reverse().slice(0, 3) : [];

      cont.innerHTML = `
        <div class="card">
          <h3 style="font-size:0.92rem;margin:0 0 8px">📣 Pedir algo ao paciente</h3>
          <p class="meta">Chega como notificação no app dele, com um atalho direto pra tela certa.</p>
          <label style="margin-top:8px">O que você precisa</label>
          <select id="sol-tipo">
            ${TIPOS_SOLICITACAO.map(t => `<option value="${t.valor}">${t.rotulo}</option>`).join('')}
          </select>
          <label style="margin-top:8px">Mensagem (opcional)</label>
          <textarea id="sol-texto" placeholder="Ex: Preciso das medidas até sexta pra ajustar o plano."></textarea>
          <button class="primary" id="sol-enviar" style="margin-top:10px">Enviar pedido</button>
          <p class="meta" id="sol-msg" style="margin-top:6px"></p>
          ${jaFeitas.length ? `
            <p class="meta" style="margin-top:10px;font-weight:600">Últimos pedidos</p>
            ${jaFeitas.map(s => {
              const t = TIPOS_SOLICITACAO.find(x => x.valor === s.tipo);
              const d = new Date(s.criadoEm);
              return `<div class="meta">${Util.escapeHtml(t ? t.rotulo : s.tipo)} · ${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}${s.texto ? ` — "${Util.escapeHtml(s.texto)}"` : ''}</div>`;
            }).join('')}
          ` : ''}
        </div>
      `;

      cont.querySelector('#sol-enviar').addEventListener('click', async () => {
        const msg = cont.querySelector('#sol-msg');
        const tipo = cont.querySelector('#sol-tipo').value;
        const texto = cont.querySelector('#sol-texto').value.trim();
        msg.textContent = 'Enviando…';
        try {
          await Cloud.enviarSolicitacao(uid, tipo, texto);
          msg.textContent = '✅ Pedido enviado! Ele aparece como notificação no app do paciente.';
          cont.querySelector('#sol-texto').value = '';
        } catch (e) { msg.textContent = '⚠️ Falha: ' + (e.message || ''); }
      });
    }

    // Treinos de corrida vão separados dos de musculação: não têm série/carga, e sim
    // distância, tempo-alvo e o protocolo escrito (ex: "5x800m com 2min de trote").
    function montarCorrida(uid, presc) {
      const cont = detailEl.querySelector('#admin-corrida');
      if (!cont) return;
      let planosCorrida = (presc && Array.isArray(presc.planosCorrida))
        ? presc.planosCorrida.map(p => ({ ...p })) : [];

      function resumo(p) {
        const partes = [];
        if (p.tipo) partes.push(p.tipo);
        if (p.distanceKm) partes.push(`${p.distanceKm} km`);
        if (p.timeMin) partes.push(`${p.timeMin} min`);
        return partes.join(' · ') || 'sem meta definida';
      }

      function paint() {
        cont.innerHTML = `
          <div class="card">
            <h3 style="font-size:0.92rem;margin:0 0 8px">🏃 Treinos de corrida</h3>
            ${planosCorrida.length === 0 ? '<p class="meta">Nenhum treino de corrida enviado ainda.</p>' : planosCorrida.map((p, i) => `
              <div class="list-item">
                <div>
                  <strong>${Util.escapeHtml(p.nome)}</strong>
                  <div class="meta">${Util.escapeHtml(resumo(p))}</div>
                  ${p.descricao ? `<div class="meta">${Util.escapeHtml(p.descricao)}</div>` : ''}
                </div>
                <button class="link" data-del-plano-corrida="${i}">✕</button>
              </div>
            `).join('')}
            <hr style="border:none;border-top:1px solid var(--border);margin:12px 0">
            <label>Nome do treino</label>
            <input type="text" id="pc-nome" placeholder="Ex: Corrida A — intervalado">
            <label style="margin-top:8px">Tipo</label>
            <select id="pc-tipo">
              <option value="">— sem tipo —</option>
              <option value="leve">Leve / regenerativo</option>
              <option value="moderado">Moderado / contínuo</option>
              <option value="intervalado">Intervalado</option>
              <option value="longo">Longo</option>
              <option value="tiro">Tiros / velocidade</option>
            </select>
            <div class="row" style="margin-top:8px">
              <div>
                <label>Distância alvo (km)</label>
                <input type="number" step="0.1" id="pc-dist" placeholder="5">
              </div>
              <div>
                <label>Tempo alvo (min)</label>
                <input type="number" step="1" id="pc-tempo" placeholder="30">
              </div>
            </div>
            <label style="margin-top:8px">Protocolo / observações</label>
            <textarea id="pc-desc" placeholder="Ex: 10min aquecimento + 5x800m forte com 2min de trote entre + 10min soltura"></textarea>
            <button class="secondary" id="pc-add" style="width:100%;margin-top:10px">+ Adicionar treino de corrida</button>
            ${planosCorrida.length ? `<p class="meta" style="margin-top:10px;border-left:3px solid var(--accent);padding-left:8px"><strong>${planosCorrida.length} treino(s) montado(s) e ainda não enviado(s).</strong> Só chega no paciente depois do botão abaixo.</p>` : ''}
            <button class="primary" id="pc-enviar" style="margin-top:8px">Enviar treinos de corrida${planosCorrida.length ? ` (${planosCorrida.length})` : ''}</button>
            <p class="meta" id="pc-msg" style="margin-top:6px"></p>
          </div>
        `;

        cont.querySelectorAll('[data-del-plano-corrida]').forEach(b => {
          b.addEventListener('click', () => { planosCorrida.splice(Number(b.dataset.delPlanoCorrida), 1); paint(); });
        });

        cont.querySelector('#pc-add').addEventListener('click', () => {
          const nome = cont.querySelector('#pc-nome').value.trim();
          const msg = cont.querySelector('#pc-msg');
          if (!nome) { msg.textContent = 'Dê um nome ao treino de corrida.'; return; }
          planosCorrida.push({
            nome,
            tipo: cont.querySelector('#pc-tipo').value,
            distanceKm: Number(cont.querySelector('#pc-dist').value) || null,
            timeMin: Number(cont.querySelector('#pc-tempo').value) || null,
            descricao: cont.querySelector('#pc-desc').value.trim(),
          });
          paint();
        });

        cont.querySelector('#pc-enviar').addEventListener('click', async () => {
          const msg = cont.querySelector('#pc-msg');
          if (planosCorrida.length === 0) { msg.textContent = 'Adicione ao menos um treino de corrida.'; return; }
          msg.textContent = 'Enviando…';
          try {
            await Cloud.enviarCorrida(uid, planosCorrida);
            pacienteCache.presc = Object.assign({}, pacienteCache.presc || {}, { planosCorrida });
            msg.textContent = '✅ Treinos de corrida enviados! O paciente vê na aba Treino → Corrida.';
          }
          catch (e) { msg.textContent = '⚠️ Falha: ' + (e.message || ''); }
        });
      }

      paint();
    }
  }

  // aderenciaPaciente e faixaImcTexto saem no export por serem as duas funções de cálculo
  // puro daqui — dá pra testá-las com node, sem DOM, como o ParsePlano.
  return { render, aderenciaPaciente, faixaImcTexto, medidasDoPaciente };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = ViewMais;
