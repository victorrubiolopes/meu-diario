// Treinos pré-definidos, baseados em princípios bem estabelecidos na ciência do esporte:
// - Volume de ~10-20 séries por grupo muscular/semana e frequência 2x/semana por grupo
//   tendem a ser superiores a 1x/semana para hipertrofia (meta-análises de Schoenfeld et al.).
// - Exercícios compostos multiarticulares priorizados antes dos de isolamento.
// - Faixa de 6-12 repetições como base para hipertrofia, com algumas séries mais pesadas (4-6) em compostos.
// São pontos de partida gerais — 100% editáveis depois de carregados.

const TREINOS_PREDEFINIDOS = {
  emagrecimento: {
    label: 'Full Body (3x/semana)',
    descricao: 'Corpo inteiro em cada sessão maximiza o gasto calórico e a frequência por grupo muscular com poucos dias de treino. Combine com as corridas para o déficit calórico.',
    planos: [
      { nome: 'Treino A', exercises: [
        { name: 'Agachamento livre', sets: '3', reps: '10', weight: '' },
        { name: 'Supino reto com barra', sets: '3', reps: '10', weight: '' },
        { name: 'Remada curvada com barra', sets: '3', reps: '10', weight: '' },
        { name: 'Desenvolvimento com halteres', sets: '3', reps: '12', weight: '' },
        { name: 'Abdominal supra', sets: '3', reps: '15', weight: '' },
      ] },
      { nome: 'Treino B', exercises: [
        { name: 'Leg press', sets: '3', reps: '12', weight: '' },
        { name: 'Puxada frontal (pulley)', sets: '3', reps: '10', weight: '' },
        { name: 'Supino inclinado com halteres', sets: '3', reps: '10', weight: '' },
        { name: 'Elevação lateral', sets: '3', reps: '15', weight: '' },
        { name: 'Prancha isométrica', sets: '3', reps: '30s', weight: '' },
      ] },
      { nome: 'Treino C', exercises: [
        { name: 'Stiff', sets: '3', reps: '10', weight: '' },
        { name: 'Remada baixa no cabo', sets: '3', reps: '10', weight: '' },
        { name: 'Crucifixo com halteres', sets: '3', reps: '12', weight: '' },
        { name: 'Rosca direta com barra', sets: '3', reps: '12', weight: '' },
        { name: 'Tríceps pulley (corda)', sets: '3', reps: '12', weight: '' },
      ] },
    ],
  },
  manutencao: {
    label: 'Upper/Lower (4x/semana)',
    descricao: 'Divisão superior/inferior permite bom equilíbrio entre volume e recuperação, batendo cada grupo muscular 2x/semana.',
    planos: [
      { nome: 'Treino A (Superior)', exercises: [
        { name: 'Supino reto com barra', sets: '4', reps: '8', weight: '' },
        { name: 'Remada curvada com barra', sets: '4', reps: '8', weight: '' },
        { name: 'Desenvolvimento militar com barra', sets: '3', reps: '10', weight: '' },
        { name: 'Puxada frontal (pulley)', sets: '3', reps: '10', weight: '' },
        { name: 'Rosca direta com barra', sets: '3', reps: '12', weight: '' },
        { name: 'Tríceps testa', sets: '3', reps: '12', weight: '' },
      ] },
      { nome: 'Treino B (Inferior)', exercises: [
        { name: 'Agachamento livre', sets: '4', reps: '8', weight: '' },
        { name: 'Stiff', sets: '4', reps: '8', weight: '' },
        { name: 'Leg press', sets: '3', reps: '12', weight: '' },
        { name: 'Mesa flexora', sets: '3', reps: '12', weight: '' },
        { name: 'Panturrilha em pé', sets: '4', reps: '15', weight: '' },
      ] },
    ],
  },
  ganho: {
    label: 'Push/Pull/Legs (6x/semana)',
    descricao: 'PPL permite alta frequência e volume por grupo muscular, indicado para maximizar hipertrofia quando há disponibilidade de treinar com mais frequência.',
    planos: [
      { nome: 'Treino A (Push)', exercises: [
        { name: 'Supino reto com barra', sets: '4', reps: '8', weight: '' },
        { name: 'Supino inclinado com halteres', sets: '3', reps: '10', weight: '' },
        { name: 'Desenvolvimento com halteres', sets: '3', reps: '10', weight: '' },
        { name: 'Elevação lateral', sets: '3', reps: '15', weight: '' },
        { name: 'Tríceps pulley (corda)', sets: '3', reps: '12', weight: '' },
        { name: 'Tríceps testa', sets: '3', reps: '10', weight: '' },
      ] },
      { nome: 'Treino B (Pull)', exercises: [
        { name: 'Barra fixa (pull-up)', sets: '4', reps: '8', weight: '' },
        { name: 'Remada curvada com barra', sets: '4', reps: '8', weight: '' },
        { name: 'Puxada frontal (pulley)', sets: '3', reps: '10', weight: '' },
        { name: 'Remada unilateral com halter', sets: '3', reps: '10', weight: '' },
        { name: 'Rosca direta com barra', sets: '3', reps: '12', weight: '' },
        { name: 'Rosca martelo', sets: '3', reps: '12', weight: '' },
      ] },
      { nome: 'Treino C (Legs)', exercises: [
        { name: 'Agachamento livre', sets: '4', reps: '8', weight: '' },
        { name: 'Leg press', sets: '3', reps: '12', weight: '' },
        { name: 'Stiff', sets: '3', reps: '10', weight: '' },
        { name: 'Cadeira extensora', sets: '3', reps: '12', weight: '' },
        { name: 'Mesa flexora', sets: '3', reps: '12', weight: '' },
        { name: 'Panturrilha em pé', sets: '4', reps: '15', weight: '' },
      ] },
    ],
  },
};
