// Ficha de treino do Victor (Full Body A/B/C) montada pelo profissional Bronyer (CREF MG049695),
// data 25/07/2026, objetivo Cutting. Semeada uma única vez em treino_planos (ver app.js).
// Descanso 1m30s em todos; 1ª série de aquecimento nos compostos pesados; último exercício até a falha.
const PLANO_VICTOR = {
  fonte: 'ficha-bronyer-2026-07-25',
  planos: [
    { nome: 'Bronyer · Full Body A', exercises: [
      { name: 'Supino Reto com barra', sets: '4', reps: '15-10-8-8', weight: '', descanso: '1m30s', obs: '1ª série de aquecimento · aeróbico: seguir planilha' },
      { name: 'Crucifixo Inclinado Halter', sets: '3', reps: '8 a 10', weight: '', descanso: '1m30s', obs: '' },
      { name: 'Puxada Frente Supinada', sets: '4', reps: '15-10-8-8', weight: '', descanso: '1m30s', obs: '1ª série de aquecimento' },
      { name: 'Remada Articulada', sets: '3', reps: '8 a 10', weight: '', descanso: '1m30s', obs: '' },
      { name: 'Afundo Smith', sets: '4', reps: '8 a 10', weight: '', descanso: '1m30s', obs: '' },
      { name: 'Leg Press', sets: '4', reps: 'Falha', weight: '', descanso: '1m30s', obs: 'última série até a falha' },
    ] },
    { nome: 'Bronyer · Full Body B', exercises: [
      { name: 'Rosca Direta no Cross', sets: '4', reps: '15-10-8-8', weight: '', descanso: '1m30s', obs: '1ª série de aquecimento · aeróbico: seguir planilha' },
      { name: 'Tríceps Francês', sets: '4', reps: '8 a 10', weight: '', descanso: '1m30s', obs: '' },
      { name: 'Desenvolvimento Militar', sets: '4', reps: '15-10-8-8', weight: '', descanso: '1m30s', obs: 'máquina' },
      { name: 'Elevação Lateral', sets: '3', reps: '8 a 10', weight: '', descanso: '1m30s', obs: '' },
      { name: 'Cadeira Extensora', sets: '3', reps: '8 a 10', weight: '', descanso: '1m30s', obs: '' },
      { name: 'Agachamento com Barra', sets: '3', reps: '8 a 10', weight: '', descanso: '1m30s', obs: '' },
      { name: 'Abdominal Máquina', sets: '4', reps: 'Falha', weight: '', descanso: '1m30s', obs: 'até a falha' },
    ] },
    { nome: 'Bronyer · Full Body C', exercises: [
      { name: 'Levantamento Terra Sumô', sets: '4', reps: '15-10-8-8', weight: '', descanso: '1m30s', obs: '1ª série de aquecimento · aeróbico: seguir planilha' },
      { name: 'Flexora em pé', sets: '4', reps: '8 a 10', weight: '', descanso: '1m30s', obs: '' },
      { name: 'Crossover Polia Alta', sets: '4', reps: '15-10-8-8', weight: '', descanso: '1m30s', obs: '1ª série de aquecimento' },
      { name: 'Crucifixo/Voador Máquina', sets: '3', reps: '8 a 10', weight: '', descanso: '1m30s', obs: '' },
      { name: 'Pull Down polia', sets: '4', reps: '8 a 10', weight: '', descanso: '1m30s', obs: '' },
      { name: 'Panturrilha Sentado', sets: '4', reps: 'Falha', weight: '', descanso: '1m30s', obs: 'até a falha' },
    ] },
  ],
};
