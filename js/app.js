const App = (() => {
  let state = {
    tab: 'inicio',
    date: Util.todayISO(),
    treinoSub: 'musculacao',
    historicoSub: 'peso',
    // Subtela aberta por cima da aba atual. Nasceu dentro de Mais e por isso se chamava
    // maisView, mas o mecanismo nunca teve nada de específico daquela aba — só o
    // roteamento é que checava `tab === 'mais'`. Medidas passou a usar o mesmo caminho
    // (peso rápido na raiz, avaliação completa em tela própria), então o nome e as
    // checagens deixaram de mencionar Mais.
    subView: null,
    subParam: null,  // argumento da tela atual (ex: id do plano em edição)
    subStack: [],    // telas anteriores, pro botão voltar
  };

  const $app = document.getElementById('app');
  const $title = document.getElementById('page-title');
  const $dateNav = document.getElementById('date-nav');
  const $datePillLabel = document.getElementById('date-pill-label');
  const $datePrev = document.getElementById('date-prev');
  const $dateNext = document.getElementById('date-next');
  const $backBtn = document.getElementById('back-btn');

  const TITLES = {
    inicio: 'Hoje',
    treino: 'Treino',
    alimentacao: 'Alimentação',
    medidas: 'Medidas',
    mais: 'Mais',
  };

  const DATE_TABS = ['inicio', 'treino', 'alimentacao', 'medidas'];
  const SUB_DATE_VIEWS = ['tarefas'];

  function goTo(tab) {
    state.tab = tab;
    state.subView = null;
    state.subParam = null;
    state.subStack = [];
    render();
  }

  // Antes só existia UMA tela dentro de Mais, então voltar sempre caía no menu. Agora a
  // tela atual é empilhada antes de abrir a próxima, o que permite telas encadeadas
  // (Planos de Treino → escolher pacote → voltar pra Planos de Treino).
  // Chamada a partir do menu raiz (subView null) não empilha nada, então o caminho antigo
  // — abrir uma tela de Mais e voltar pro menu — continua idêntico.
  // Qual aba é dona de cada subtela. Quase todas moram em Mais, então ela é o padrão e só
  // as exceções aparecem aqui.
  //
  // Existe porque goToSub dependia de o CHAMADOR ter ajustado state.tab antes — e um dos
  // seis chamadores não ajustava: o botão de perfil da tela Hoje (inicio.js) abria
  // subView='perfil' com tab='inicio', e o roteador continuava renderizando Hoje. Passava
  // despercebido porque o topbar também checava tab==='mais', então nada mudava na tela;
  // ao desacoplar o topbar da aba, o mesmo clique viraria título "Perfil" e botão voltar
  // por cima do conteúdo de Hoje. Definir a aba aqui mata a classe inteira do problema.
  const SUB_TAB = { avaliacao: 'medidas' };

  function goToSub(view, param) {
    const tab = SUB_TAB[view] || 'mais';
    // Trocar de aba zera a pilha: encadear vale dentro da mesma aba, e voltar de uma
    // subtela de Medidas pra uma de Mais não seria um caminho que o usuário percorreu.
    if (tab !== state.tab) { state.tab = tab; state.subStack = []; }
    else if (state.subView) state.subStack.push({ view: state.subView, param: state.subParam });
    state.subView = view;
    state.subParam = param != null ? param : null;
    render();
  }

  function back() {
    const anterior = state.subStack.pop();
    state.subView = anterior ? anterior.view : null;
    state.subParam = anterior ? anterior.param : null;
    render();
  }

  function render() {
    atualizarSino();
    const showDate = DATE_TABS.includes(state.tab) || SUB_DATE_VIEWS.includes(state.subView);
    $dateNav.style.display = showDate ? '' : 'none';
    $datePillLabel.textContent = Util.fmtDatePill(state.date);
    $backBtn.style.display = state.subView ? '' : 'none';

    document.querySelectorAll('.nav-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.tab === state.tab);
    });

    // Subtela sem título cadastrado cai no título da PRÓPRIA aba, não num "Mais" fixo —
    // senão uma subtela de Medidas sem entrada em SUB_TITLES apareceria como "Mais".
    $title.textContent = state.subView
      ? (SUB_TITLES[state.subView] || TITLES[state.tab])
      : TITLES[state.tab];

    switch (state.tab) {
      case 'inicio': ViewInicio.render($app, state, api); break;
      case 'treino': ViewTreino.render($app, state, api); break;
      case 'alimentacao': ViewAlimentacao.render($app, state, api); break;
      case 'medidas': ViewMedidas.render($app, state, api); break;
      case 'mais': ViewMais.render($app, state, api); break;
    }

    sincronizarHistorico();
  }

  // ---- Botão voltar do aparelho (Android) e do navegador ----
  // O app é uma página só e nunca mexia no histórico, então o voltar do celular fechava o
  // app em vez de sair da tela. Com telas encadeadas isso passou a incomodar de verdade.
  //
  // Em vez de espelhar a pilha inteira no histórico (que exigiria desfazer N entradas ao
  // trocar de aba, cada uma disparando popstate), mantém-se UMA entrada sentinela enquanto
  // houver tela aberta dentro de Mais. O voltar do aparelho consome a sentinela, o popstate
  // traduz isso em back(), e o render seguinte empilha outra se ainda sobrou tela. Quando
  // não sobra, o próximo voltar fecha o app — que é o comportamento esperado.
  let sentinelaAtiva = false;
  let ignorarProximoPop = false;

  function profundidade() { return state.subView ? state.subStack.length + 1 : 0; }

  function sincronizarHistorico() {
    const precisa = profundidade() > 0;
    if (precisa && !sentinelaAtiva) {
      history.pushState({ diarioSentinela: true }, '');
      sentinelaAtiva = true;
      return;
    }
    // Saiu das telas sem passar pelo voltar (trocar de aba, por exemplo): a sentinela vira
    // lixo e engoliria o próximo voltar do aparelho sem fazer nada. Consome ela na mão.
    if (!precisa && sentinelaAtiva) {
      sentinelaAtiva = false;
      ignorarProximoPop = true;
      history.back();
    }
  }

  window.addEventListener('popstate', () => {
    if (ignorarProximoPop) { ignorarProximoPop = false; return; }
    if (profundidade() === 0) return; // nada aberto: deixa o voltar fechar o app
    // A sentinela já foi consumida pelo próprio voltar; back() chama render(), que empilha
    // outra se ainda houver tela.
    sentinelaAtiva = false;
    back();
  });

  const SUB_TITLES = {
    avaliacao: 'Avaliação completa',
    tarefas: 'Tarefas',
    fotos: 'Fotos',
    exames: 'Exames Médicos',
    'exames-tendencia': 'Resultados e tendência',
    'exame-lancar': 'Lançar resultados',
    historico: 'Histórico',
    perfil: 'Meu Perfil',
    'biblioteca-alimentos': 'Biblioteca de Alimentos',
    'alimento-novo': 'Cadastrar alimento',
    'receita-sugerir': 'Sugerir receita',
    'biblioteca-exercicios': 'Biblioteca de Exercícios',
    'exercicio-novo': 'Cadastrar exercício',
    'planos-treino': 'Planos de Treino',
    'treino-pacotes': 'Pacotes de treino',
    'plano-editar': 'Editar treino',
    combos: 'Combos de Refeição',
    'combo-novo': 'Novo combo',
    'dietas-custom': 'Minhas Dietas',
    'dieta-pacotes': 'Dietas prontas',
    'dieta-nova': 'Nova dieta',
    'refeicao-livre': 'Refeição Livre',
    backup: 'Backup',
    notificacoes: 'Notificações',
    admin: 'Painel profissional',
    'paciente': 'Paciente',
    'paciente-diario': 'Diário do paciente',
    'paciente-medidas': 'Medidas da consulta',
    'paciente-dieta': 'Metas de dieta',
    'paciente-plano': 'Plano alimentar',
    'paciente-treino': 'Plano de treino',
    'paciente-corrida': 'Treinos de corrida',
    'paciente-lista': 'Lista de compras',
    'paciente-livre': 'Refeição livre',
    'paciente-solicitar': 'Pedir ao paciente',
    'paciente-relatorio': 'Relatório do paciente',
    'paciente-papel': 'Papel e profissional',
  };

  const api = { goTo, goToSub, back, render, get state() { return state; } };

  // Sino: badge com o número de não lidas. Vive no topbar, fora do ciclo de render das views,
  // então é atualizado junto do render() e sempre que a nuvem emitir mudança (a prescrição
  // chega depois do login, quando a tela já foi pintada uma vez).
  function atualizarSino() {
    const btn = document.getElementById('sino-btn');
    const badge = document.getElementById('sino-badge');
    if (!btn || !badge) return;
    const naoLidas = Storage.getAll('notificacoes').filter(n => !n.lida).length;
    btn.classList.toggle('tem-nova', naoLidas > 0);
    badge.hidden = naoLidas === 0;
    badge.textContent = naoLidas > 9 ? '9+' : String(naoLidas);
  }

  function initSino() {
    const btn = document.getElementById('sino-btn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      state.tab = 'mais';
      state.subView = 'notificacoes';
      render();
    });
    atualizarSino();
    if (typeof Cloud !== 'undefined' && Cloud.onChange) Cloud.onChange(atualizarSino);
  }

  function initFab() {
    const fabBtn = document.getElementById('fab-btn');
    const backdrop = document.getElementById('fab-backdrop');
    const sheet = document.getElementById('fab-sheet');

    function openSheet() {
      fabBtn.classList.add('open');
      backdrop.classList.add('show');
      sheet.classList.add('open');
    }
    function closeSheet() {
      fabBtn.classList.remove('open');
      backdrop.classList.remove('show');
      sheet.classList.remove('open');
    }

    fabBtn.addEventListener('click', () => {
      if (sheet.classList.contains('open')) closeSheet(); else openSheet();
    });
    backdrop.addEventListener('click', closeSheet);
    document.getElementById('fab-cancel').addEventListener('click', closeSheet);

    sheet.querySelectorAll('[data-fab-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.fabAction;
        closeSheet();
        state.date = Util.todayISO();
        if (action === 'alimentacao') {
          goTo('alimentacao');
          setTimeout(() => { const el = document.getElementById('food-search'); if (el) el.focus(); }, 260);
        } else if (action === 'treino') {
          state.treinoSub = 'musculacao';
          goTo('treino');
        } else if (action === 'peso') {
          goTo('medidas');
          setTimeout(() => { const el = document.getElementById('f-weight'); if (el) el.focus(); }, 260);
        }
      });
    });
  }

  function aplicarSeeds() {
    Storage.mergeSeeds('exercicios_biblioteca', EXERCICIOS_PADRAO);
    Storage.mergeSeeds('alimentos_biblioteca', ALIMENTOS_PADRAO);
    // Combos e dietas nomeadas NÃO são mais semeados por padrão pra contas novas —
    // eram específicos do Victor (dieta/refeições do nutri dele) e vazavam pra todo usuário
    // multi-conta. Quem já tinha esses itens continua com eles (mergeSeeds nunca removia nada).

    // Migração: remove alimentos duplicados que entraram na biblioteca por um bug do catálogo
    // semente (havia duas linhas de "Tilápia grelhada", e o mergeSeeds antigo adicionava as
    // duas). Só mexe em nomes cujas cópias são TODAS do catálogo padrão (custom !== true) —
    // se o usuário criou um alimento com nome repetido, o dele fica intacto.
    const bibliotecaDedup = Storage.getAll('alimentos_biblioteca');
    const porNome = new Map();
    bibliotecaDedup.forEach(f => {
      const k = (f.name || '').trim().toLowerCase();
      if (!porNome.has(k)) porNome.set(k, []);
      porNome.get(k).push(f);
    });
    const idsRemover = new Set();
    porNome.forEach(itens => {
      if (itens.length < 2) return;
      if (itens.some(f => f.custom === true)) return; // tem cópia do usuário: não mexe
      itens.slice(1).forEach(f => idsRemover.add(f.id));
    });
    if (idsRemover.size > 0) {
      Storage.saveAll('alimentos_biblioteca', bibliotecaDedup.filter(f => !idsRemover.has(f.id)));
    }

    // Migração: preenche o horário em combos seedados antes dessa funcionalidade existir.
    const combosAtuais = Storage.getAll('combos');
    let precisaSalvar = false;
    combosAtuais.forEach(c => {
      if (c.horario) return;
      const seed = COMBOS_PADRAO.find(s => s.nome.toLowerCase() === c.nome.toLowerCase());
      if (seed && seed.horario) {
        c.horario = seed.horario;
        precisaSalvar = true;
      }
    });
    if (precisaSalvar) Storage.saveAll('combos', combosAtuais);

    // A ficha do Bronyer agora é carregada manualmente pelo dropdown "Treino pré-definido"
    // (Mais → Planos de Treino). Limpa, uma única vez, qualquer versão auto-semeada anterior
    // (marcada por fonte) para não duplicar quando o usuário carregar pelo dropdown.
    if (typeof PLANO_VICTOR !== 'undefined' && !localStorage.getItem('cleanup_plano_bronyer')) {
      Storage.getAll('treino_planos')
        .filter(p => p.fonte === PLANO_VICTOR.fonte)
        .forEach(p => Storage.remove('treino_planos', p.id));
      localStorage.setItem('cleanup_plano_bronyer', '1');
    }

    // Migração: "emagrecimento" virou 3 níveis (adaptação/moderado/agressivo). Quem já tinha
    // esse objetivo selecionado vai pro nível "moderado" (mais parecido com o déficit fixo
    // antigo de ~500kcal), em vez de cair silenciosamente em "manutenção".
    const perfilAtual = Storage.getPerfil();
    if (perfilAtual.dietaTemplate === 'emagrecimento') {
      Storage.savePerfil({ ...perfilAtual, dietaTemplate: 'emagrecimento_moderado' });
    }

    // Migração: "Quadríceps" virou categoria própria, separada de "Perna" (que agora é só
    // posterior de coxa). Sem isso, quem já tinha esses exercícios sincronizados ficaria com
    // o grupo antigo pra sempre (mergeSeeds nunca atualiza itens já existentes).
    const EXERCICIOS_VIRAM_QUADRICEPS = ['Agachamento livre', 'Leg press', 'Cadeira extensora', 'Afundo (passada)', 'Agachamento búlgaro', 'Hack squat'];
    const bibliotecaEx = Storage.getAll('exercicios_biblioteca');
    let precisaSalvarEx = false;
    bibliotecaEx.forEach(e => {
      if (e.grupo === 'Perna' && EXERCICIOS_VIRAM_QUADRICEPS.some(n => n.toLowerCase() === e.name.trim().toLowerCase())) {
        e.grupo = 'Quadríceps';
        precisaSalvarEx = true;
      }
    });
    if (precisaSalvarEx) Storage.saveAll('exercicios_biblioteca', bibliotecaEx);

    // Migração: mergeSeeds nunca atualiza um alimento que já existe (só adiciona por nome).
    // Isso significa que correções de valores nutricionais num item padrão (ex: peito de
    // frango cru que estava com kcal errado) nunca chegavam em contas que já tinham
    // sincronizado aquele item antes da correção — só quem nunca teve o item recebia o
    // valor certo. Aqui, itens não-custom (custom !== true, ou seja, vieram do catálogo
    // padrão e não foram criados manualmente pelo usuário) são resincronizados com os
    // valores atuais de ALIMENTOS_PADRAO sempre que algum campo estiver diferente.
    const bibliotecaAlim = Storage.getAll('alimentos_biblioteca');
    const alimentosPorNome = new Map(ALIMENTOS_PADRAO.map(f => [f.name.trim().toLowerCase(), f]));
    const CAMPOS_ALIMENTO = ['categoria', 'portionLabel', 'portionGrams', 'kcal', 'carbs', 'sugars', 'protein', 'fat', 'satFat', 'transFat', 'fiber', 'sodium'];
    let precisaSalvarAlim = false;
    bibliotecaAlim.forEach(f => {
      if (f.custom === true) return;
      const padrao = alimentosPorNome.get((f.name || '').trim().toLowerCase());
      if (!padrao) return;
      CAMPOS_ALIMENTO.forEach(campo => {
        if (f[campo] !== padrao[campo]) { f[campo] = padrao[campo]; precisaSalvarAlim = true; }
      });
    });
    if (precisaSalvarAlim) Storage.saveAll('alimentos_biblioteca', bibliotecaAlim);

    // Migração: exercícios de planos de treino (próprios ou de pacotes pré-definidos, como
    // fichas de personal) que nunca passaram pela biblioteca — ficavam sem grupo/ilustração
    // mesmo depois da biblioteca ser expandida, porque simplesmente não existiam lá.
    if (typeof garantirExercicioNaBiblioteca === 'function') {
      Storage.getAll('treino_planos').forEach(p => {
        (p.exercises || []).forEach(e => garantirExercicioNaBiblioteca(e.name));
      });
    }

    // Preenche automaticamente o grupo muscular de exercícios que ficaram sem (ex: vieram
    // de uma sincronização antiga, ou de outra sessão/aparelho) tentando adivinhar pelo nome.
    // Roda sempre (não só uma vez) pra pegar qualquer exercício sem grupo, de qualquer origem.
    if (typeof inferirGrupoPorNome === 'function') {
      const bibliotecaSemGrupo = Storage.getAll('exercicios_biblioteca');
      let precisaSalvarGrupo = false;
      bibliotecaSemGrupo.forEach(e => {
        if (!e.grupo) {
          const inferido = inferirGrupoPorNome(e.name);
          if (inferido) { e.grupo = inferido; precisaSalvarGrupo = true; }
        }
      });
      if (precisaSalvarGrupo) Storage.saveAll('exercicios_biblioteca', bibliotecaSemGrupo);
    }
  }

  // Tela de login: aparece quando a nuvem está ativa e ninguém está logado.
  // Se a nuvem não estiver disponível (SDK falhou/sem config), NÃO bloqueia — app roda local.
  function atualizarGate() {
    const gate = document.getElementById('auth-gate');
    if (!gate) return;
    const bloquear = typeof Cloud !== 'undefined' && Cloud.isEnabled() && !Cloud.currentUser();
    gate.style.display = bloquear ? 'flex' : 'none';
  }

  function initGate() {
    const erroEl = document.getElementById('gate-erro');
    const warningEl = document.getElementById('gate-inapp-warning');
    if (warningEl && Util.isInAppBrowser()) warningEl.style.display = '';
    const showErro = e => {
      const map = {
        'auth/invalid-credential': 'E-mail ou senha incorretos.',
        'auth/wrong-password': 'Senha incorreta.',
        'auth/user-not-found': 'Conta não encontrada — use "Criar conta".',
        'auth/email-already-in-use': 'Este e-mail já tem conta — use "Entrar".',
        'auth/weak-password': 'Senha muito curta (mínimo 6 caracteres).',
        'auth/invalid-email': 'E-mail inválido.',
        'auth/popup-closed-by-user': 'Login cancelado.',
        'auth/unauthorized-domain': 'Domínio não autorizado no Firebase.',
        // Falha típica de navegador embutido (WhatsApp/Instagram/etc.): o WebView bloqueia o
        // storage que o login com Google precisa. E-mail/senha continua funcionando ali.
        'auth/missing-initial-state': 'O login com Google não funciona neste navegador (ex: aberto pelo WhatsApp/Instagram). Toque em ⋯ → "Abrir no navegador", ou entre com e-mail e senha abaixo.',
        'auth/web-storage-unsupported': 'Este navegador está bloqueando o armazenamento necessário pro login com Google. Toque em ⋯ → "Abrir no navegador" (Safari/Chrome), ou use e-mail e senha.',
        'auth/operation-not-supported-in-this-environment': 'O login com Google não é permitido neste navegador embutido. Abra o link no Safari/Chrome, ou use e-mail e senha.',
      };
      if (erroEl) erroEl.textContent = (e && map[e.code]) || (e && e.message) || 'Falha no login.';
    };
    const email = () => (document.getElementById('gate-email').value || '').trim();
    const senha = () => document.getElementById('gate-senha').value || '';
    const g = document.getElementById('gate-google');
    if (g) g.addEventListener('click', () => Cloud.loginGoogle().catch(showErro));
    const e = document.getElementById('gate-entrar');
    if (e) e.addEventListener('click', () => Cloud.loginEmail(email(), senha()).catch(showErro));
    const c = document.getElementById('gate-criar');
    if (c) c.addEventListener('click', () => Cloud.signupEmail(email(), senha()).catch(showErro));
  }

  // Tela de boas-vindas: aparece quando falta peso/altura/idade/sexo (o mínimo pra
  // calcular a meta de calorias no "Hoje") e a pessoa ainda não pulou essa etapa.
  // Nunca aparece junto com o auth-gate — login vem primeiro.
  function atualizarOnboardingGate() {
    const gate = document.getElementById('onboarding-gate');
    if (!gate) return;
    const cloudBloqueando = typeof Cloud !== 'undefined' && Cloud.isEnabled() && !Cloud.currentUser();
    if (cloudBloqueando) { gate.style.display = 'none'; return; }
    const perfil = Storage.getPerfil();
    const incompleto = !perfil.peso || !perfil.altura || !perfil.idade || !perfil.sexo;
    const jaDispensado = localStorage.getItem('onboarding_dispensado') === '1';
    gate.style.display = (incompleto && !jaDispensado) ? 'flex' : 'none';
  }

  function initOnboardingGate() {
    const atividadeSelect = document.getElementById('onboard-atividade');
    const dietaSelect = document.getElementById('onboard-dieta');
    const nivelSelect = document.getElementById('onboard-emagrecimento-nivel');
    const nivelFields = document.getElementById('onboard-nivel-fields');
    if (!atividadeSelect || !dietaSelect) return;
    if (typeof NIVEIS_ATIVIDADE !== 'undefined') {
      atividadeSelect.innerHTML = NIVEIS_ATIVIDADE.map(n => `<option value="${n.id}">${n.label}</option>`).join('');
    }
    if (typeof DIETA_TEMPLATES !== 'undefined') {
      dietaSelect.innerHTML = `<option value="emagrecimento">Emagrecimento</option>`
        + DIETA_TEMPLATES.filter(d => !d.id.startsWith('emagrecimento_'))
          .map(d => `<option value="${d.id}" ${d.id === 'manutencao' ? 'selected' : ''}>${d.nome}</option>`).join('');
    }
    if (typeof EMAGRECIMENTO_NIVEIS !== 'undefined' && nivelSelect) {
      nivelSelect.innerHTML = EMAGRECIMENTO_NIVEIS
        .map(n => `<option value="${n.id}" ${n.id === EMAGRECIMENTO_PADRAO ? 'selected' : ''}>${n.nome.replace('Emagrecimento — ', '')}</option>`).join('');
    }
    // "Emagrecimento" no select principal é só uma categoria — o valor de verdade vem do
    // select secundário "Nível", que só aparece quando essa categoria é selecionada.
    function dietaValResolvido() {
      return dietaSelect.value === 'emagrecimento' ? nivelSelect.value : dietaSelect.value;
    }
    const dietaDescEl = document.getElementById('onboard-dieta-desc');
    const atualizarDietaDesc = () => {
      if (nivelFields) nivelFields.style.display = dietaSelect.value === 'emagrecimento' ? '' : 'none';
      const t = typeof DIETA_TEMPLATES !== 'undefined' ? DIETA_TEMPLATES.find(d => d.id === dietaValResolvido()) : null;
      if (dietaDescEl) dietaDescEl.textContent = t ? t.descricao : '';
    };
    dietaSelect.addEventListener('change', atualizarDietaDesc);
    if (nivelSelect) nivelSelect.addEventListener('change', atualizarDietaDesc);
    atualizarDietaDesc();
    const erroEl = document.getElementById('onboard-erro');
    document.getElementById('onboard-continuar').addEventListener('click', () => {
      const peso = Number(document.getElementById('onboard-peso').value) || null;
      const altura = Number(document.getElementById('onboard-altura').value) || null;
      const idade = Number(document.getElementById('onboard-idade').value) || null;
      if (!peso || !altura || !idade) {
        if (erroEl) erroEl.textContent = 'Preenche peso, altura e idade pra continuar.';
        return;
      }
      Storage.savePerfil({
        ...Storage.getPerfil(),
        peso, altura, idade,
        sexo: document.getElementById('onboard-sexo').value,
        nivelAtividade: atividadeSelect.value,
        dietaTemplate: dietaValResolvido(),
      });
      atualizarOnboardingGate();
      render();
    });
    document.getElementById('onboard-pular').addEventListener('click', () => {
      localStorage.setItem('onboarding_dispensado', '1');
      atualizarOnboardingGate();
    });
  }

  // Convite de nutri (?convite=CODE na URL): guarda o código antes de qualquer login
  // rolar, pra Cloud.escreverPerfilPublico() vincular o paciente à nutri certa na criação
  // da conta. Sobrevive ao popup do Google (mesma aba) e ao fluxo por e-mail (sem navegação).
  function capturarConviteDaURL() {
    const code = new URLSearchParams(location.search).get('convite');
    // localStorage sobrevive ao redirect do login Google no celular (sessionStorage às vezes não).
    if (code) { localStorage.setItem('pendingInviteCode', code); sessionStorage.setItem('pendingInviteCode', code); }
  }

  function init() {
    capturarConviteDaURL();

    // Nuvem (opcional): envolve o Storage e conecta o login antes de tudo.
    // Ao entrar/baixar dados, re-aplica seeds, re-renderiza e atualiza a tela de login.
    if (typeof Cloud !== 'undefined') {
      Cloud.wrapStorage();
      Cloud.onChange(() => { aplicarSeeds(); render(); atualizarGate(); atualizarOnboardingGate(); });
      initGate();
      Cloud.init();
      atualizarGate();
    }

    aplicarSeeds();
    initOnboardingGate();
    atualizarOnboardingGate();

    $datePrev.addEventListener('click', () => {
      state.date = Util.addDaysISO(state.date, -1);
      render();
    });
    $dateNext.addEventListener('click', () => {
      state.date = Util.addDaysISO(state.date, 1);
      render();
    });
    $backBtn.addEventListener('click', back);
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => goTo(btn.dataset.tab));
    });
    initFab();
    initSino();
    render();
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', App.init);
