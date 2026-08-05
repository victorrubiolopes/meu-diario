const EXERCICIOS_PADRAO = [
  // Peito
  { name: 'Supino reto com barra', grupo: 'Peito', equipamento: 'Barra' },
  { name: 'Supino inclinado com halteres', grupo: 'Peito', equipamento: 'Halteres' },
  { name: 'Supino declinado', grupo: 'Peito', equipamento: 'Barra' },
  { name: 'Crucifixo com halteres', grupo: 'Peito', equipamento: 'Halteres' },
  { name: 'Crossover no cabo', grupo: 'Peito', equipamento: 'Cabo' },
  { name: 'Flexão de braço', grupo: 'Peito', equipamento: 'Peso do corpo' },
  { name: 'Peck deck (voador)', grupo: 'Peito', equipamento: 'Máquina' },
  // Costas
  { name: 'Barra fixa (pull-up)', grupo: 'Costas', equipamento: 'Peso do corpo' },
  { name: 'Puxada frontal (pulley)', grupo: 'Costas', equipamento: 'Cabo' },
  { name: 'Remada curvada com barra', grupo: 'Costas', equipamento: 'Barra' },
  { name: 'Remada unilateral com halter', grupo: 'Costas', equipamento: 'Halteres' },
  { name: 'Remada cavalinho', grupo: 'Costas', equipamento: 'Barra' },
  { name: 'Levantamento terra', grupo: 'Costas', equipamento: 'Barra' },
  { name: 'Remada baixa no cabo', grupo: 'Costas', equipamento: 'Cabo' },
  // Quadríceps
  { name: 'Agachamento livre', grupo: 'Quadríceps', equipamento: 'Barra' },
  { name: 'Leg press', grupo: 'Quadríceps', equipamento: 'Máquina' },
  { name: 'Cadeira extensora', grupo: 'Quadríceps', equipamento: 'Máquina' },
  { name: 'Afundo (passada)', grupo: 'Quadríceps', equipamento: 'Halteres' },
  { name: 'Agachamento búlgaro', grupo: 'Quadríceps', equipamento: 'Halteres' },
  { name: 'Hack squat', grupo: 'Quadríceps', equipamento: 'Máquina' },
  // Perna (posterior de coxa)
  { name: 'Mesa flexora', grupo: 'Perna', equipamento: 'Máquina' },
  { name: 'Stiff', grupo: 'Perna', equipamento: 'Barra' },
  // Ombro
  { name: 'Desenvolvimento com halteres', grupo: 'Ombro', equipamento: 'Halteres' },
  { name: 'Desenvolvimento militar com barra', grupo: 'Ombro', equipamento: 'Barra' },
  { name: 'Elevação lateral', grupo: 'Ombro', equipamento: 'Halteres' },
  { name: 'Elevação frontal', grupo: 'Ombro', equipamento: 'Halteres' },
  { name: 'Crucifixo inverso', grupo: 'Ombro', equipamento: 'Halteres' },
  { name: 'Remada alta', grupo: 'Ombro', equipamento: 'Barra' },
  // Bíceps
  { name: 'Rosca direta com barra', grupo: 'Bíceps', equipamento: 'Barra' },
  { name: 'Rosca alternada com halteres', grupo: 'Bíceps', equipamento: 'Halteres' },
  { name: 'Rosca martelo', grupo: 'Bíceps', equipamento: 'Halteres' },
  { name: 'Rosca scott', grupo: 'Bíceps', equipamento: 'Barra' },
  { name: 'Rosca no cabo', grupo: 'Bíceps', equipamento: 'Cabo' },
  // Tríceps
  { name: 'Tríceps pulley (corda)', grupo: 'Tríceps', equipamento: 'Cabo' },
  { name: 'Tríceps testa', grupo: 'Tríceps', equipamento: 'Barra' },
  { name: 'Tríceps francês', grupo: 'Tríceps', equipamento: 'Halteres' },
  { name: 'Mergulho no banco (dips)', grupo: 'Tríceps', equipamento: 'Peso do corpo' },
  { name: 'Supino fechado', grupo: 'Tríceps', equipamento: 'Barra' },
  // Abdômen
  { name: 'Abdominal supra', grupo: 'Abdômen', equipamento: 'Peso do corpo' },
  { name: 'Prancha isométrica', grupo: 'Abdômen', equipamento: 'Peso do corpo' },
  { name: 'Elevação de pernas', grupo: 'Abdômen', equipamento: 'Peso do corpo' },
  { name: 'Abdominal na polia alta', grupo: 'Abdômen', equipamento: 'Cabo' },
  { name: 'Rotação de tronco (russian twist)', grupo: 'Abdômen', equipamento: 'Peso do corpo' },
  // Panturrilha
  { name: 'Panturrilha em pé', grupo: 'Panturrilha', equipamento: 'Máquina' },
  { name: 'Panturrilha sentado', grupo: 'Panturrilha', equipamento: 'Máquina' },
];

const GRUPOS_MUSCULARES = [
  'Peito', 'Costas', 'Quadríceps', 'Perna', 'Ombro', 'Bíceps', 'Tríceps', 'Abdômen', 'Panturrilha', 'Outro',
];
