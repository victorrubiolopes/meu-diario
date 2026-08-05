const EXERCICIOS_PADRAO = [
  // Peito
  { name: 'Supino reto com barra', grupo: 'Peito', equipamento: 'Barra' },
  { name: 'Supino reto com halteres', grupo: 'Peito', equipamento: 'Halteres' },
  { name: 'Supino reto na Smith', grupo: 'Peito', equipamento: 'Smith' },
  { name: 'Supino inclinado com halteres', grupo: 'Peito', equipamento: 'Halteres' },
  { name: 'Supino inclinado com barra', grupo: 'Peito', equipamento: 'Barra' },
  { name: 'Supino inclinado na Smith', grupo: 'Peito', equipamento: 'Smith' },
  { name: 'Supino declinado', grupo: 'Peito', equipamento: 'Barra' },
  { name: 'Crucifixo com halteres', grupo: 'Peito', equipamento: 'Halteres' },
  { name: 'Crucifixo inclinado com halteres', grupo: 'Peito', equipamento: 'Halteres' },
  { name: 'Crossover no cabo', grupo: 'Peito', equipamento: 'Cabo' },
  { name: 'Crossover no cabo (baixo para cima)', grupo: 'Peito', equipamento: 'Cabo' },
  { name: 'Flexão de braço', grupo: 'Peito', equipamento: 'Peso do corpo' },
  { name: 'Flexão com pés elevados', grupo: 'Peito', equipamento: 'Peso do corpo' },
  { name: 'Flexão diamante', grupo: 'Peito', equipamento: 'Peso do corpo' },
  { name: 'Peck deck (voador)', grupo: 'Peito', equipamento: 'Máquina' },
  { name: 'Supino máquina (chest press)', grupo: 'Peito', equipamento: 'Máquina' },
  { name: 'Pullover com halter', grupo: 'Peito', equipamento: 'Halteres' },

  // Costas
  { name: 'Barra fixa (pull-up)', grupo: 'Costas', equipamento: 'Peso do corpo' },
  { name: 'Barra fixa pegada supinada (chin-up)', grupo: 'Costas', equipamento: 'Peso do corpo' },
  { name: 'Puxada frontal (pulley)', grupo: 'Costas', equipamento: 'Cabo' },
  { name: 'Puxada frontal pegada aberta', grupo: 'Costas', equipamento: 'Cabo' },
  { name: 'Puxada frontal pegada supinada', grupo: 'Costas', equipamento: 'Cabo' },
  { name: 'Pulldown reto (straight arm)', grupo: 'Costas', equipamento: 'Cabo' },
  { name: 'Remada curvada com barra', grupo: 'Costas', equipamento: 'Barra' },
  { name: 'Remada curvada com halteres', grupo: 'Costas', equipamento: 'Halteres' },
  { name: 'Remada unilateral com halter (serrote)', grupo: 'Costas', equipamento: 'Halteres' },
  { name: 'Remada cavalinho', grupo: 'Costas', equipamento: 'Barra' },
  { name: 'Remada cavalinho unilateral', grupo: 'Costas', equipamento: 'Barra' },
  { name: 'Remada baixa no cabo', grupo: 'Costas', equipamento: 'Cabo' },
  { name: 'Remada baixa triângulo', grupo: 'Costas', equipamento: 'Cabo' },
  { name: 'Remada máquina', grupo: 'Costas', equipamento: 'Máquina' },
  { name: 'Levantamento terra', grupo: 'Costas', equipamento: 'Barra' },
  { name: 'Levantamento terra sumô', grupo: 'Costas', equipamento: 'Barra' },
  { name: 'Hiperextensão lombar', grupo: 'Costas', equipamento: 'Peso do corpo' },

  // Quadríceps
  { name: 'Agachamento livre', grupo: 'Quadríceps', equipamento: 'Barra' },
  { name: 'Agachamento na Smith', grupo: 'Quadríceps', equipamento: 'Smith' },
  { name: 'Agachamento frontal', grupo: 'Quadríceps', equipamento: 'Barra' },
  { name: 'Leg press', grupo: 'Quadríceps', equipamento: 'Máquina' },
  { name: 'Leg press 45', grupo: 'Quadríceps', equipamento: 'Máquina' },
  { name: 'Cadeira extensora', grupo: 'Quadríceps', equipamento: 'Máquina' },
  { name: 'Cadeira extensora unilateral', grupo: 'Quadríceps', equipamento: 'Máquina' },
  { name: 'Afundo (passada)', grupo: 'Quadríceps', equipamento: 'Halteres' },
  { name: 'Afundo na Smith', grupo: 'Quadríceps', equipamento: 'Smith' },
  { name: 'Afundo com barra', grupo: 'Quadríceps', equipamento: 'Barra' },
  { name: 'Avanço (lunge) reverso', grupo: 'Quadríceps', equipamento: 'Halteres' },
  { name: 'Agachamento búlgaro', grupo: 'Quadríceps', equipamento: 'Halteres' },
  { name: 'Agachamento búlgaro na Smith', grupo: 'Quadríceps', equipamento: 'Smith' },
  { name: 'Hack squat', grupo: 'Quadríceps', equipamento: 'Máquina' },

  // Perna (posterior de coxa e glúteo)
  { name: 'Mesa flexora', grupo: 'Perna', equipamento: 'Máquina' },
  { name: 'Cadeira flexora', grupo: 'Perna', equipamento: 'Máquina' },
  { name: 'Stiff', grupo: 'Perna', equipamento: 'Barra' },
  { name: 'Stiff com halteres', grupo: 'Perna', equipamento: 'Halteres' },
  { name: 'Elevação pélvica (hip thrust)', grupo: 'Perna', equipamento: 'Barra' },
  { name: 'Glúteo no cabo (coice)', grupo: 'Perna', equipamento: 'Cabo' },
  { name: 'Cadeira abdutora', grupo: 'Perna', equipamento: 'Máquina' },
  { name: 'Cadeira adutora', grupo: 'Perna', equipamento: 'Máquina' },

  // Ombro
  { name: 'Desenvolvimento com halteres', grupo: 'Ombro', equipamento: 'Halteres' },
  { name: 'Desenvolvimento militar com barra', grupo: 'Ombro', equipamento: 'Barra' },
  { name: 'Desenvolvimento Arnold', grupo: 'Ombro', equipamento: 'Halteres' },
  { name: 'Desenvolvimento máquina', grupo: 'Ombro', equipamento: 'Máquina' },
  { name: 'Desenvolvimento na Smith', grupo: 'Ombro', equipamento: 'Smith' },
  { name: 'Elevação lateral', grupo: 'Ombro', equipamento: 'Halteres' },
  { name: 'Elevação lateral no cabo', grupo: 'Ombro', equipamento: 'Cabo' },
  { name: 'Elevação lateral máquina', grupo: 'Ombro', equipamento: 'Máquina' },
  { name: 'Elevação frontal', grupo: 'Ombro', equipamento: 'Halteres' },
  { name: 'Crucifixo inverso', grupo: 'Ombro', equipamento: 'Halteres' },
  { name: 'Crucifixo inverso máquina', grupo: 'Ombro', equipamento: 'Máquina' },
  { name: 'Face pull', grupo: 'Ombro', equipamento: 'Cabo' },
  { name: 'Remada alta', grupo: 'Ombro', equipamento: 'Barra' },
  { name: 'Encolhimento de ombros', grupo: 'Ombro', equipamento: 'Halteres' },

  // Bíceps
  { name: 'Rosca direta com barra', grupo: 'Bíceps', equipamento: 'Barra' },
  { name: 'Rosca direta com barra W', grupo: 'Bíceps', equipamento: 'Barra' },
  { name: 'Rosca alternada com halteres', grupo: 'Bíceps', equipamento: 'Halteres' },
  { name: 'Rosca martelo', grupo: 'Bíceps', equipamento: 'Halteres' },
  { name: 'Rosca scott', grupo: 'Bíceps', equipamento: 'Barra' },
  { name: 'Rosca scott com halteres', grupo: 'Bíceps', equipamento: 'Halteres' },
  { name: 'Rosca no cabo', grupo: 'Bíceps', equipamento: 'Cabo' },
  { name: 'Rosca concentrada', grupo: 'Bíceps', equipamento: 'Halteres' },
  { name: 'Rosca inversa', grupo: 'Bíceps', equipamento: 'Barra' },
  { name: 'Rosca 21', grupo: 'Bíceps', equipamento: 'Barra' },

  // Tríceps
  { name: 'Tríceps pulley (corda)', grupo: 'Tríceps', equipamento: 'Cabo' },
  { name: 'Tríceps pulley (barra)', grupo: 'Tríceps', equipamento: 'Cabo' },
  { name: 'Tríceps testa', grupo: 'Tríceps', equipamento: 'Barra' },
  { name: 'Tríceps testa com halteres', grupo: 'Tríceps', equipamento: 'Halteres' },
  { name: 'Tríceps francês', grupo: 'Tríceps', equipamento: 'Halteres' },
  { name: 'Tríceps coice (kickback)', grupo: 'Tríceps', equipamento: 'Halteres' },
  { name: 'Tríceps banco (unilateral)', grupo: 'Tríceps', equipamento: 'Halteres' },
  { name: 'Mergulho no banco (dips)', grupo: 'Tríceps', equipamento: 'Peso do corpo' },
  { name: 'Mergulho em paralelas', grupo: 'Tríceps', equipamento: 'Peso do corpo' },
  { name: 'Supino fechado', grupo: 'Tríceps', equipamento: 'Barra' },

  // Abdômen
  { name: 'Abdominal supra', grupo: 'Abdômen', equipamento: 'Peso do corpo' },
  { name: 'Abdominal infra', grupo: 'Abdômen', equipamento: 'Peso do corpo' },
  { name: 'Abdominal bicicleta', grupo: 'Abdômen', equipamento: 'Peso do corpo' },
  { name: 'Abdominal máquina', grupo: 'Abdômen', equipamento: 'Máquina' },
  { name: 'Prancha isométrica', grupo: 'Abdômen', equipamento: 'Peso do corpo' },
  { name: 'Prancha lateral', grupo: 'Abdômen', equipamento: 'Peso do corpo' },
  { name: 'Elevação de pernas', grupo: 'Abdômen', equipamento: 'Peso do corpo' },
  { name: 'Abdominal na polia alta', grupo: 'Abdômen', equipamento: 'Cabo' },
  { name: 'Rotação de tronco (russian twist)', grupo: 'Abdômen', equipamento: 'Peso do corpo' },
  { name: 'Wood chop no cabo', grupo: 'Abdômen', equipamento: 'Cabo' },

  // Panturrilha
  { name: 'Panturrilha em pé', grupo: 'Panturrilha', equipamento: 'Máquina' },
  { name: 'Panturrilha sentado', grupo: 'Panturrilha', equipamento: 'Máquina' },
  { name: 'Panturrilha no leg press', grupo: 'Panturrilha', equipamento: 'Máquina' },
  { name: 'Panturrilha unilateral', grupo: 'Panturrilha', equipamento: 'Halteres' },
];

const GRUPOS_MUSCULARES = [
  'Peito', 'Costas', 'Quadríceps', 'Perna', 'Ombro', 'Bíceps', 'Tríceps', 'Abdômen', 'Panturrilha', 'Outro',
];

// Ilustração do músculo trabalhado por grupo, usada tanto na tela de Treino quanto na
// Biblioteca de Exercícios. Grupos sem arte própria (ex: "Outro") ficam sem entrada aqui —
// quem usa esse mapa cai no ícone genérico de haltere nesse caso.
const GRUPO_ICONE_PATH = {
  'Peito': 'img/musculos/peito.png',
  'Costas': 'img/musculos/costas.png',
  'Quadríceps': 'img/musculos/quadricipes.png',
  'Perna': 'img/musculos/perna.png',
  'Ombro': 'img/musculos/ombro.png',
  'Bíceps': 'img/musculos/biceps.png',
  'Tríceps': 'img/musculos/triceps.png',
  'Abdômen': 'img/musculos/abdomen.png',
  'Panturrilha': 'img/musculos/panturrilha.png',
};

// Tenta adivinhar o grupo muscular pelo nome do exercício (pra preencher automaticamente
// exercícios que já existem na biblioteca sem grupo definido — ex: digitados livremente
// numa versão antiga do app, ou sincronizados de outro aparelho/sessão). Regras mais
// específicas vêm antes das genéricas pra evitar colisão (ex: "remada alta" é Ombro,
// não Costas; "supino fechado" é Tríceps, não Peito).
const REGRAS_GRUPO_POR_NOME = [
  [/elevaç[aã]o de perna/i, 'Abdômen'],
  [/elevaç[aã]o p[eé]lvica/i, 'Perna'],
  [/elevaç[aã]o lateral/i, 'Ombro'],
  [/elevaç[aã]o frontal/i, 'Ombro'],
  [/remada alta/i, 'Ombro'],
  [/supino fechado/i, 'Tríceps'],
  [/panturrilha|g[eê]meos|calf/i, 'Panturrilha'],
  [/agachamento|afundo|avanço|passada|b[uú]lgaro|leg press|hack squat|extensora/i, 'Quadríceps'],
  [/flexora|stiff|hip thrust|gl[uú]teo|abdutora|adutora/i, 'Perna'],
  [/supino|crucifixo|crossover|peck deck|voador|flex[aã]o|pullover|chest/i, 'Peito'],
  [/remada|puxada|pull[\s-]?down|barra fixa|pull-?up|chin-?up|levantamento terra|^terra$/i, 'Costas'],
  [/desenvolvimento|arnold|encolhimento|face pull/i, 'Ombro'],
  [/rosca/i, 'Bíceps'],
  [/tr[ií]ceps|mergulho|dips|franc[eê]s|testa/i, 'Tríceps'],
  [/abdominal|prancha|russian twist|wood chop/i, 'Abdômen'],
];

function inferirGrupoPorNome(nome) {
  const n = (nome || '').trim();
  if (!n) return null;
  const regra = REGRAS_GRUPO_POR_NOME.find(([re]) => re.test(n));
  return regra ? regra[1] : null;
}

// Garante que um nome de exercício exista em exercicios_biblioteca, inferindo o grupo pelo
// nome quando precisa criar. Usado ao carregar um pacote pré-definido (ex: ficha do personal)
// e numa migração pra pegar planos que já existiam antes disso — nesses casos, os exercícios
// viviam só dentro do plano de treino (treino_planos), nunca passavam pela biblioteca, então
// ficavam sem grupo/ilustração mesmo depois da biblioteca em si ser expandida.
function garantirExercicioNaBiblioteca(nome) {
  if (!nome || !nome.trim()) return;
  const lib = Storage.getAll('exercicios_biblioteca');
  const existe = lib.some(e => e.name.trim().toLowerCase() === nome.trim().toLowerCase());
  if (existe) return;
  Storage.add('exercicios_biblioteca', { name: nome.trim(), grupo: inferirGrupoPorNome(nome) || '', equipamento: '', custom: true });
}
