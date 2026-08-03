const App = (() => {
  let state = {
    tab: 'inicio',
    date: Util.todayISO(),
    treinoSub: 'musculacao',
    historicoSub: 'peso',
    maisView: null,
  };

  const $app = document.getElementById('app');
  const $title = document.getElementById('page-title');
  const $datePicker = document.getElementById('date-picker');
  const $backBtn = document.getElementById('back-btn');

  const TITLES = {
    inicio: 'Início',
    treino: 'Treino',
    alimentacao: 'Alimentação',
    medidas: 'Medidas',
    mais: 'Mais',
  };

  const DATE_TABS = ['inicio', 'treino', 'alimentacao', 'medidas'];
  const MAIS_DATE_VIEWS = ['tarefas'];

  function goTo(tab) {
    state.tab = tab;
    state.maisView = null;
    render();
  }

  function goToMais(view) {
    state.maisView = view;
    render();
  }

  function back() {
    state.maisView = null;
    render();
  }

  function render() {
    const showDate = DATE_TABS.includes(state.tab) || (state.tab === 'mais' && MAIS_DATE_VIEWS.includes(state.maisView));
    $datePicker.style.display = showDate ? '' : 'none';
    $datePicker.value = state.date;
    $backBtn.style.display = state.tab === 'mais' && state.maisView ? '' : 'none';

    document.querySelectorAll('.nav-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.tab === state.tab);
    });

    $title.textContent = state.tab === 'mais' && state.maisView
      ? (MAIS_TITLES[state.maisView] || 'Mais')
      : TITLES[state.tab];

    switch (state.tab) {
      case 'inicio': ViewInicio.render($app, state, api); break;
      case 'treino': ViewTreino.render($app, state, api); break;
      case 'alimentacao': ViewAlimentacao.render($app, state, api); break;
      case 'medidas': ViewMedidas.render($app, state, api); break;
      case 'mais': ViewMais.render($app, state, api); break;
    }
  }

  const MAIS_TITLES = {
    tarefas: 'Tarefas',
    fotos: 'Fotos',
    historico: 'Histórico',
    perfil: 'Meu Perfil',
    'biblioteca-alimentos': 'Biblioteca de Alimentos',
    'biblioteca-exercicios': 'Biblioteca de Exercícios',
    'planos-treino': 'Planos de Treino',
    combos: 'Combos de Refeição',
    'dietas-custom': 'Minhas Dietas',
    backup: 'Backup',
  };

  const api = { goTo, goToMais, back, render, get state() { return state; } };

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
    Storage.mergeSeeds('combos', COMBOS_PADRAO, 'nome');
    Storage.mergeSeeds('dietas_custom', DIETAS_CUSTOM_PADRAO, 'nome');

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

  function init() {
    // Nuvem (opcional): envolve o Storage e conecta o login antes de tudo.
    // Ao entrar/baixar dados, re-aplica seeds, re-renderiza e atualiza a tela de login.
    if (typeof Cloud !== 'undefined') {
      Cloud.wrapStorage();
      Cloud.onChange(() => { aplicarSeeds(); render(); atualizarGate(); });
      initGate();
      Cloud.init();
      atualizarGate();
    }

    aplicarSeeds();

    $datePicker.addEventListener('change', () => {
      state.date = $datePicker.value;
      render();
    });
    $backBtn.addEventListener('click', back);
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => goTo(btn.dataset.tab));
    });
    initFab();
    render();
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', App.init);
