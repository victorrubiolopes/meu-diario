// Ilustração de exercício — mapa do nome em português para a pasta no free-exercise-db.
//
// DE ONDE VÊM AS IMAGENS: github.com/yuhonas/free-exercise-db, derivado de
// github.com/wrkout/exercises.json. Os DOIS declaram Unlicense (domínio público), e é por
// isso que dá pra usar: não é imagem achada em busca, é um conjunto com dedicação explícita
// ao domínio público. 876 exercícios, 2 fotos cada (posição inicial e final).
//
// POR QUE O MAPA É ESCRITO NA MÃO. Casar "Crucifixo inverso" com "Reverse Flyes" por
// similaridade de texto não funciona — são idiomas diferentes. E o erro seria SILENCIOSO:
// na verificação, a sugestão automática para "Abdução de quadril em pé" foi
// "Cable Hip Adduction", que é o movimento OPOSTO. Alguém olharia a foto errada e faria o
// exercício errado achando que estava certo.
//
// Então cada linha abaixo fui eu que li e traduzi, e todas as 128 foram verificadas contra o
// banco antes de entrar aqui (alvo inexistente não passa). Se um exercício novo não estiver
// no mapa, a tela cai no vídeo do usuário e, sem ele, num ícone neutro — nunca numa foto
// errada. Preferir não mostrar nada a mostrar o movimento errado.
//
// As imagens são carregadas direto do repositório de origem, não copiadas pra cá: seriam
// ~9 MB pro repositório e pro deploy, e o fallback já cobre o caso de a fonte sair do ar.
const ILUSTRACOES_BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';

const ILUSTRACOES = {
  "Abdominal Remador": "Rowing_Stationary",
  "Abdominal Supra com Carga": "Weighted_Crunches",
  "Abdominal bicicleta": "Air_Bike",
  "Abdominal infra": "Flat_Bench_Lying_Leg_Raise",
  "Abdominal máquina": "Ab_Crunch_Machine",
  "Abdominal na polia alta": "Cable_Crunch",
  "Abdominal supra": "Crunches",
  "Abdução de quadril em pé": "Thigh_Abductor",
  "Afundo (passada)": "Dumbbell_Lunges",
  "Afundo com barra": "Barbell_Lunge",
  "Afundo na Smith": "Smith_Machine_Squat",
  "Agachamento Hack": "Hack_Squat",
  "Agachamento búlgaro": "Split_Squat_with_Dumbbells",
  "Agachamento búlgaro na Smith": "Smith_Single-Leg_Split_Squat",
  "Agachamento frontal": "Front_Barbell_Squat",
  "Agachamento livre": "Barbell_Squat",
  "Agachamento na Smith": "Smith_Machine_Squat",
  "Avanço (lunge) reverso": "Dumbbell_Rear_Lunge",
  "Banco Supino Inclinado": "Incline_Dumbbell_Press",
  "Barra Fixa Gráviton (Pegada Neutra)": "Pullups",
  "Barra fixa (pull-up)": "Pullups",
  "Barra fixa pegada supinada (chin-up)": "Chin-Up",
  "Cadeira Extensora": "Leg_Extensions",
  "Cadeira abdutora": "Thigh_Abductor",
  "Cadeira adutora": "Thigh_Adductor",
  "Cadeira extensora": "Leg_Extensions",
  "Cadeira extensora unilateral": "Leg_Extensions",
  "Cadeira flexora": "Seated_Leg_Curl",
  "Crossover no cabo": "Cable_Crossover",
  "Crossover no cabo (baixo para cima)": "Low_Cable_Crossover",
  "Crucifixo Inclinado com Halteres": "Incline_Dumbbell_Flyes",
  "Crucifixo Inverso com Halteres": "Reverse_Flyes",
  "Crucifixo com halteres": "Dumbbell_Flyes",
  "Crucifixo inclinado com halteres": "Incline_Dumbbell_Flyes",
  "Crucifixo inverso": "Reverse_Flyes",
  "Crucifixo inverso máquina": "Reverse_Machine_Flyes",
  "Desenvolvimento Arnold": "Arnold_Dumbbell_Press",
  "Desenvolvimento Arnold Sentado": "Arnold_Dumbbell_Press",
  "Desenvolvimento com halteres": "Dumbbell_Shoulder_Press",
  "Desenvolvimento militar com barra": "Standing_Military_Press",
  "Desenvolvimento máquina": "Machine_Shoulder_Military_Press",
  "Desenvolvimento na Smith": "Smith_Machine_Overhead_Shoulder_Press",
  "Elevação de pernas": "Hanging_Leg_Raise",
  "Elevação frontal": "Front_Dumbbell_Raise",
  "Elevação lateral": "Side_Lateral_Raise",
  "Elevação lateral máquina": "Side_Lateral_Raise",
  "Elevação lateral no cabo": "Cable_Seated_Lateral_Raise",
  "Elevação pélvica (hip thrust)": "Barbell_Hip_Thrust",
  "Encolhimento de ombros": "Barbell_Shrug",
  "Extensão de quadril em pé": "Glute_Kickback",
  "Face pull": "Face_Pull",
  "Flexão com pés elevados": "Decline_Push-Up",
  "Flexão de braço": "Pushups",
  "Flexão de braço na parede": "Pushups_Close_and_Wide_Hand_Positions",
  "Flexão diamante": "Push-Ups_-_Close_Triceps_Position",
  "Glúteo no cabo (coice)": "Glute_Kickback",
  "Hack squat": "Hack_Squat",
  "Hiperextensão lombar": "Hyperextensions_Back_Extensions",
  "Leg Press 45": "Leg_Press",
  "Leg press": "Leg_Press",
  "Leg press 45": "Leg_Press",
  "Levantamento Terra": "Barbell_Deadlift",
  "Levantamento terra": "Barbell_Deadlift",
  "Levantamento terra sumô": "Sumo_Deadlift",
  "Levantar e sentar na cadeira": "Bodyweight_Squat",
  "Mergulho em paralelas": "Dips_-_Triceps_Version",
  "Mergulho no banco (dips)": "Bench_Dips",
  "Mesa Flexora": "Lying_Leg_Curls",
  "Mesa flexora": "Lying_Leg_Curls",
  "Panturrilha em pé": "Standing_Calf_Raises",
  "Panturrilha no Leg Press 45": "Calf_Press_On_The_Leg_Press_Machine",
  "Panturrilha no leg press": "Calf_Press_On_The_Leg_Press_Machine",
  "Panturrilha sentado": "Seated_Calf_Raise",
  "Panturrilha unilateral": "Calf_Raise_On_A_Dumbbell",
  "Peck deck (voador)": "Butterfly",
  "Ponte de glúteo no chão": "Butt_Lift_Bridge",
  "Prancha isométrica": "Plank",
  "Prancha lateral": "Side_Bridge",
  "Prancha na bancada": "Plank",
  "Pulldown reto (straight arm)": "Straight-Arm_Pulldown",
  "Pullover com Halteres": "Straight-Arm_Dumbbell_Pullover",
  "Pullover com halter": "Straight-Arm_Dumbbell_Pullover",
  "Puxada frontal (pulley)": "Wide-Grip_Lat_Pulldown",
  "Puxada frontal pegada aberta": "Wide-Grip_Lat_Pulldown",
  "Puxada frontal pegada supinada": "Underhand_Cable_Pulldowns",
  "Remada Curvada com Halteres (Pegada Neutra)": "Bent_Over_Two-Dumbbell_Row",
  "Remada alta": "Upright_Barbell_Row",
  "Remada baixa no cabo": "Seated_Cable_Rows",
  "Remada baixa triângulo": "V-Bar_Pullup",
  "Remada cavalinho": "T-Bar_Row_with_Handle",
  "Remada cavalinho unilateral": "One-Arm_Long_Bar_Row",
  "Remada com elástico": "Seated_Cable_Rows",
  "Remada curvada com barra": "Bent_Over_Barbell_Row",
  "Remada curvada com halteres": "Bent_Over_Two-Dumbbell_Row",
  "Remada máquina": "Leverage_High_Row",
  "Remada unilateral com halter (serrote)": "One-Arm_Dumbbell_Row",
  "Rosca 21": "Barbell_Curl",
  "Rosca Direta Barra W": "EZ-Bar_Curl",
  "Rosca alternada com halteres": "Alternate_Hammer_Curl",
  "Rosca concentrada": "Concentration_Curls",
  "Rosca direta com barra": "Barbell_Curl",
  "Rosca direta com barra W": "EZ-Bar_Curl",
  "Rosca inversa": "Reverse_Barbell_Curl",
  "Rosca martelo": "Hammer_Curls",
  "Rosca no cabo": "Standing_Biceps_Cable_Curl",
  "Rosca scott": "Preacher_Curl",
  "Rosca scott com halteres": "Dumbbell_Prone_Incline_Curl",
  "Rotação de tronco (russian twist)": "Russian_Twist",
  "Stiff": "Stiff-Legged_Barbell_Deadlift",
  "Stiff com halteres": "Stiff-Legged_Dumbbell_Deadlift",
  "Supino declinado": "Decline_Barbell_Bench_Press",
  "Supino fechado": "Close-Grip_Barbell_Bench_Press",
  "Supino inclinado com barra": "Barbell_Incline_Bench_Press_-_Medium_Grip",
  "Supino inclinado com halteres": "Incline_Dumbbell_Press",
  "Supino inclinado na Smith": "Smith_Machine_Incline_Bench_Press",
  "Supino máquina (chest press)": "Machine_Bench_Press",
  "Supino reto com barra": "Barbell_Bench_Press_-_Medium_Grip",
  "Supino reto com halteres": "Dumbbell_Bench_Press",
  "Supino reto na Smith": "Smith_Machine_Bench_Press",
  "Tríceps Testa Barra Reta": "Lying_Triceps_Press",
  "Tríceps banco (unilateral)": "Bench_Dips",
  "Tríceps coice (kickback)": "Tricep_Dumbbell_Kickback",
  "Tríceps francês": "Standing_Dumbbell_Triceps_Extension",
  "Tríceps pulley (barra)": "Triceps_Pushdown",
  "Tríceps pulley (corda)": "Triceps_Pushdown_-_Rope_Attachment",
  "Tríceps testa": "Lying_Triceps_Press",
  "Tríceps testa com halteres": "Lying_Dumbbell_Tricep_Extension",
  "Wood chop no cabo": "Standing_Cable_Wood_Chop",
};

// Devolve a URL da ilustração do exercício, ou null se não houver mapa pra ele.
// Case-insensitive porque o nome digitado no card nem sempre casa a caixa com a biblioteca.
const _ILUSTRACOES_LOWER = Object.keys(ILUSTRACOES).reduce((acc, k) => {
  acc[k.trim().toLowerCase()] = ILUSTRACOES[k];
  return acc;
}, {});

function ilustracaoExercicio(nome) {
  if (!nome) return null;
  const pasta = _ILUSTRACOES_LOWER[nome.trim().toLowerCase()];
  return pasta ? ILUSTRACOES_BASE + pasta + '/0.jpg' : null;
}
