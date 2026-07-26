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

  function init() {
    Storage.mergeSeeds('exercicios_biblioteca', EXERCICIOS_PADRAO);
    Storage.mergeSeeds('alimentos_biblioteca', ALIMENTOS_PADRAO);
    Storage.mergeSeeds('combos', COMBOS_PADRAO, 'nome');
    Storage.mergeSeeds('dietas_custom', DIETAS_CUSTOM_PADRAO, 'nome');

    // Semeia a ficha profissional do Victor (respeita exclusões posteriores).
    // Flag versionada: ao renomear/atualizar a ficha, re-semeia limpando a versão anterior
    // desta mesma fonte para não duplicar.
    if (typeof PLANO_VICTOR !== 'undefined') {
      const SEED_FLAG = 'seed_plano_bronyer_v2';
      if (!localStorage.getItem(SEED_FLAG)) {
        // remove planos antigos já semeados desta mesma ficha (evita duplicar ao renomear)
        Storage.getAll('treino_planos')
          .filter(p => p.fonte === PLANO_VICTOR.fonte)
          .forEach(p => Storage.remove('treino_planos', p.id));
        const planosAtuais = Storage.getAll('treino_planos');
        const maxOrdem = planosAtuais.reduce((m, p) => Math.max(m, p.ordem || 0), 0);
        PLANO_VICTOR.planos.forEach((p, i) => {
          Storage.add('treino_planos', {
            nome: p.nome,
            ordem: maxOrdem + i + 1,
            exercises: p.exercises.map(e => ({ ...e })),
            fonte: PLANO_VICTOR.fonte,
          });
        });
        localStorage.setItem(SEED_FLAG, '1');
        localStorage.removeItem('seed_plano_victor');
      }
    }

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
