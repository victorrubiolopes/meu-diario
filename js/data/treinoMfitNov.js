// Ficha de treino do Victor na MFIT Personal — recebida em 17/11/2026, substitui a de 18/08.
// Mesmo modelo do PLANO_VICTOR e do PLANO_MFIT: pacote carregável que só aparece pro dono do
// app, não é semeado em ninguém.
//
// ======================= O QUE MUDOU DA FICHA DE AGOSTO =======================
//
// 1. VIROU PUSH/PULL/LEGS. A de agosto misturava (quarta tinha terra + peito + costas; sexta
//    tinha barra fixa + supino + stiff + rosca). Agora cada dia tem um papel só, e por isso
//    os nomes vêm da própria ficha em vez de dia da semana — o Victor alterna os dias
//    conforme descansa ou não na segunda, então "MFIT · Quarta" mentiria.
//
// 2. APARECEU PERNA. Antes o trabalho de membros inferiores era só stiff e levantamento terra
//    espalhados. Agora existe um dia inteiro: leg press, hack, flexora, extensora, panturrilha.
//
// 3. TROCOU VOLUME POR INTENSIDADE. Era 4x15 sem falha; agora é 3x15 com a ÚLTIMA SÉRIE ATÉ A
//    FALHA. Uma série a menos por exercício, mas a última vai ao limite.
//
// Consequência prática da 3, e é por isso que ela está escrita no 'descricao' do pacote: as
// cargas da ficha podem ficar leves. Com 4 séries submáximas dava pra ficar no mesmo peso por
// semanas sem perceber; com a última à falha, terminar as 15 sem sentir que acabou é sinal de
// subir o peso. O próprio treino avisa.
//
// ======================= CONVENÇÕES =======================
//
// Cargas transcritas exatamente como aparecem na ficha. Onde ela fala em "placas", fica placas
// mesmo: cada máquina tem placa de peso diferente e converter pra kg seria chute. Onde fala
// "barra grande/média/pequena – X/Xkg", é a anilha por lado, sem contar a barra.
//
// O campo 'weight' fica vazio de propósito, como nas fichas anteriores: o app preenche com a
// última carga que o Victor REGISTROU naquele exercício, que é o número que importa. A carga
// da ficha vive em 'obs' como ponto de partida do primeiro dia.
//
// As observações que começam com "»" são minhas, não da ficha — o Victor pediu que fossem
// junto. As demais são transcrição.
const PLANO_MFIT_NOV = {
  fonte: 'ficha-mfit-2026-11-17',
  planos: [
    { nome: 'MFIT · Costas, bíceps e ombro', exercises: [
      { name: 'Barra Fixa Gráviton (Pegada Neutra)', sets: '3', reps: '15', weight: '', descanso: '35s',
        obs: 'última série até a falha · 5 placas · ficha: "Quanto mais leve, mais difícil ficará. Concentre-se em manter as escápulas fechadas e ombros para baixo." · » gráviton é assistência INVERTIDA: menos placa = mais difícil, o contrário de toda outra máquina' },
      { name: 'Crucifixo Inverso com Halteres', sets: '3', reps: '15', weight: '', descanso: '35s',
        obs: 'última série até a falha · 8 ou 10kg cada lado · » é ombro (deltoide posterior), não peito — se sentir no peito, o cotovelo está baixo demais' },
      { name: 'Remada Curvada com Halteres (Pegada Neutra)', sets: '3', reps: '15', weight: '', descanso: '35s',
        obs: 'última série até a falha · 10kg ou mais cada lado' },
      { name: 'Desenvolvimento Arnold Sentado', sets: '3', reps: '15', weight: '', descanso: '35s',
        obs: 'última série até a falha · 8 a 10kg cada lado' },
      { name: 'Rosca Direta Barra W', sets: '3', reps: '15', weight: '', descanso: '35s',
        obs: 'última série até a falha · 5kg cada lado · » não é o método 21 da ficha antiga, é rosca normal' },
    ] },

    { nome: 'MFIT · Inferiores', exercises: [
      { name: 'Levantamento Terra', sets: '3', reps: '15', weight: '', descanso: '35s',
        obs: 'última série até a falha · barra grande 15/15kg · ~50kg com barra olímpica de 20kg · » caiu de 20/20 (ficha de agosto) pra 15/15; faz sentido por abrir um dia inteiro de perna, mas é o único exercício que DESCEU de carga — vale confirmar com a personal' },
      { name: 'Leg Press 45', sets: '3', reps: '15', weight: '', descanso: '35s',
        obs: 'última série até a falha · combinado A · 70 a 80kg cada lado · » alternar com a panturrilha sem descansar entre os dois' },
      { name: 'Panturrilha no Leg Press 45', sets: '3', reps: '15', weight: '', descanso: '35s',
        obs: 'última série até a falha · combinado B · mesma carga do leg press' },
      { name: 'Agachamento Hack', sets: '3', reps: '15', weight: '', descanso: '35s',
        obs: 'última série até a falha · 10 a 15kg cada lado ou mais' },
      { name: 'Mesa Flexora', sets: '3', reps: '15', weight: '', descanso: '35s',
        obs: 'última série até a falha · 5 a 6 placas' },
      { name: 'Cadeira Extensora', sets: '3', reps: '15', weight: '', descanso: '35s',
        obs: 'última série até a falha · 5 a 6 placas' },
    ] },

    { nome: 'MFIT · Peito, tríceps e abdome', exercises: [
      { name: 'Banco Supino Inclinado', sets: '3', reps: '15', weight: '', descanso: '35s',
        obs: 'última série até a falha · 10 a 15kg cada lado' },
      { name: 'Crucifixo Inclinado com Halteres', sets: '3', reps: '15', weight: '', descanso: '35s',
        obs: 'última série até a falha · 10kg cada lado · » na ficha de agosto era 12/12kg em 4 séries; aqui é 10 em 3 com falha' },
      { name: 'Pullover com Halteres', sets: '3', reps: '15', weight: '', descanso: '35s',
        obs: 'última série até a falha · 1 dumbbell de 14 a 16kg ou 2 halteres' },
      { name: 'Tríceps Testa Barra Reta', sets: '3', reps: '15', weight: '', descanso: '35s',
        obs: 'última série até a falha · 3 a 4kg cada lado · ficha: "Exercício pesado, iniciar só com a barra pequena para aquecer e colocar uns 2kg cada lado para testar, depois ajusta a carga se precisar de mais peso"' },
      { name: 'Abdominal Supra com Carga', sets: '3', reps: '15', weight: '', descanso: '35s',
        obs: 'última série até a falha · anilha de 10kg' },
      { name: 'Abdominal Remador', sets: '3', reps: '15', weight: '', descanso: '35s',
        obs: 'última série até a falha · anilha de 10kg' },
    ] },
  ],
};

// Cadastra os nomes desta ficha na biblioteca semente, com o grupo muscular escrito à mão.
// Mesmo padrão com que este arquivo se registra em TREINOS_PREDEFINIDOS logo abaixo: dado da
// ficha mora junto da ficha, e 'exercicios.js' segue sendo só o catálogo genérico.
//
// Por que não deixar o 'garantirExercicioNaBiblioteca' resolver no carregamento do pacote:
// ele infere o grupo pelo nome e acerta 12 dos 13 que precisaria inferir, mas erra justo o
// que mais pesa na divisão de volume — 'Crucifixo Inverso com Halteres' cairia em Peito,
// sendo deltoide posterior (Ombro).
//
// Os nomes são os da ficha letra por letra, mesmo onde já existe o mesmo movimento com outra
// grafia ('Rosca direta com barra W' x 'Rosca Direta Barra W'). É o nome que o Victor lê no
// app da MFIT enquanto treina, e divergir gera erro na hora de marcar. O custo é a entrada
// quase repetida; o histórico antigo continua sob o nome antigo, que é o certo — na prática
// era outro exercício (a antiga era o método 21).
if (typeof EXERCICIOS_PADRAO !== 'undefined') {
  const jaTem = new Set(EXERCICIOS_PADRAO.map(e => e.name.trim().toLowerCase()));
  [
    { name: 'Barra Fixa Gráviton (Pegada Neutra)', grupo: 'Costas', equipamento: 'Máquina' },
    { name: 'Crucifixo Inverso com Halteres', grupo: 'Ombro', equipamento: 'Halteres' },
    { name: 'Remada Curvada com Halteres (Pegada Neutra)', grupo: 'Costas', equipamento: 'Halteres' },
    { name: 'Desenvolvimento Arnold Sentado', grupo: 'Ombro', equipamento: 'Halteres' },
    { name: 'Rosca Direta Barra W', grupo: 'Bíceps', equipamento: 'Barra' },
    { name: 'Leg Press 45', grupo: 'Quadríceps', equipamento: 'Máquina' },
    { name: 'Panturrilha no Leg Press 45', grupo: 'Panturrilha', equipamento: 'Máquina' },
    { name: 'Agachamento Hack', grupo: 'Quadríceps', equipamento: 'Máquina' },
    { name: 'Mesa Flexora', grupo: 'Perna', equipamento: 'Máquina' },
    { name: 'Cadeira Extensora', grupo: 'Quadríceps', equipamento: 'Máquina' },
    { name: 'Banco Supino Inclinado', grupo: 'Peito', equipamento: 'Barra' },
    { name: 'Pullover com Halteres', grupo: 'Peito', equipamento: 'Halteres' },
    { name: 'Tríceps Testa Barra Reta', grupo: 'Tríceps', equipamento: 'Barra' },
    { name: 'Abdominal Supra com Carga', grupo: 'Abdômen', equipamento: 'Anilha' },
    { name: 'Abdominal Remador', grupo: 'Abdômen', equipamento: 'Peso do corpo' },
  ].forEach(e => { if (!jaTem.has(e.name.trim().toLowerCase())) EXERCICIOS_PADRAO.push(e); });
}

// Disponibiliza a ficha no dropdown "Treino pré-definido" (Mais → Planos de Treino).
// pessoal: true a esconde de todo mundo que não seja o dono — mesma regra das outras fichas.
if (typeof TREINOS_PREDEFINIDOS !== 'undefined') {
  TREINOS_PREDEFINIDOS[PLANO_MFIT_NOV.fonte] = {
    label: 'MFIT Personal — Push/Pull/Legs (17/11/2026)',
    descricao: 'Ficha da MFIT de 17/11/2026, substitui a de agosto. Três sessões: costas/bíceps/ombro, inferiores e peito/tríceps/abdome — os dias flutuam na semana, por isso os nomes são dos treinos e não de segunda/quarta/domingo. Tudo em 3x15 com a ÚLTIMA SÉRIE ATÉ A FALHA e 35s de intervalo. Se você terminar as 15 da terceira série sem sentir que não dava mais nenhuma, suba a carga: é assim que esse formato avisa que está fácil.',
    planos: PLANO_MFIT_NOV.planos,
    pessoal: true,
  };
}
