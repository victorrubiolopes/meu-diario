// Ficha de treino do Victor na MFIT Personal — recebida em 18/08/2026, 3 sessões por semana
// (quarta, sexta e domingo). Mesmo modelo do PLANO_VICTOR: pacote carregável que só aparece
// pro dono do app, não é semeado em ninguém.
//
// Formato da ficha, bem diferente da anterior (Bronyer, 8-10 reps com 1m30s de intervalo):
// tudo em 4x15 com 35s de intervalo, e vários exercícios em pares "combinados" (A/B) que a
// MFIT manda alternar — na prática, biséries. O campo obs marca o par de cada um.
//
// Cargas transcritas exatamente como aparecem na ficha. Onde ela fala em "placas", fica
// placas mesmo: cada máquina tem placa de peso diferente e converter pra kg seria chute.
// Onde fala "barra grande/média/pequena – X/Xkg", é a anilha por lado, sem contar a barra.
const PLANO_MFIT = {
  fonte: 'ficha-mfit-2026-08-18',
  planos: [
    { nome: 'MFIT · Quarta', exercises: [
      { name: 'Mobilidade de Corpo Inteiro II', sets: '1', reps: '5 cada lado', weight: '', descanso: '10s', obs: 'combinado A · aquecimento' },
      { name: 'Levantamento Terra', sets: '4', reps: '15', weight: '', descanso: '35s', obs: 'barra grande 20/20kg OU MAIS · ~60kg com barra olimpica de 20kg' },
      { name: 'Crucifixo Inclinado com Halteres', sets: '4', reps: '15', weight: '', descanso: '35s', obs: '12/12kg' },
      { name: 'Crucifixo Máquina', sets: '4', reps: '15', weight: '', descanso: '35s', obs: '8 ou 9 placas' },
      { name: 'Puxada Articulada Aberta', sets: '4', reps: '15', weight: '', descanso: '35s', obs: '10 placas' },
      { name: 'Remada Alta com Barra W', sets: '4', reps: '15', weight: '', descanso: '35s', obs: 'barra média 8/8kg' },
      { name: 'Abdominal Supra Banco Declinado', sets: '4', reps: '15', weight: '', descanso: '35s', obs: 'anilha de 5kg' },
    ] },
    { nome: 'MFIT · Sexta', exercises: [
      { name: 'Alongamento Dorsal Espaldar II', sets: '1', reps: '15 segundos', weight: '', descanso: '10s', obs: 'combinado A · aquecimento · sem carga' },
      { name: 'Barra Fixa Gráviton (Pegada Aberta)', sets: '4', reps: '15', weight: '', descanso: '35s', obs: '6 placas · ATENÇÃO: assistência invertida, quanto MENOS placa mais difícil' },
      { name: 'Remada Baixa Supinada', sets: '4', reps: '15', weight: '', descanso: '35s', obs: '9 a 10 placas' },
      { name: 'Banco Supino Reto', sets: '4', reps: '15', weight: '', descanso: '35s', obs: 'combinado A · barra grande 15/15kg · ~50kg com barra olimpica de 20kg' },
      { name: 'Flexão de Braço', sets: '4', reps: '15', weight: '', descanso: '35s', obs: 'combinado B · sem carga · nome cortado na imagem, confirmar na ficha' },
      { name: 'Stiff pés afastados com Barra Livre', sets: '4', reps: '15', weight: '', descanso: '35s', obs: 'barra grande 15/15kg · ~50kg com barra olimpica de 20kg' },
      { name: 'Rosca Direta 21 Barra W', sets: '4', reps: '21', weight: '', descanso: '35s', obs: '8/8kg · método 21 (7 embaixo + 7 em cima + 7 completas)' },
      { name: 'Abdominal Infra Paralelas com Pernas Flexionadas', sets: '4', reps: '15', weight: '', descanso: '35s', obs: 'sem carga' },
    ] },
    { nome: 'MFIT · Domingo', exercises: [
      { name: 'Desenvolvimento Sentado com Barra Reta', sets: '4', reps: '15', weight: '', descanso: '35s', obs: 'combinado A · barra pequena 8/8kg' },
      { name: 'Prancha Isométrica Alta/Baixa', sets: '4', reps: 'o máximo que conseguir', weight: '', descanso: '35s', obs: 'combinado B · sem carga' },
      { name: 'Crossover Unilateral na Polia Baixa', sets: '4', reps: '15', weight: '', descanso: '35s', obs: 'combinado A · 4 placas' },
      { name: 'Rosca Unilateral na Polia Baixa', sets: '4', reps: '15', weight: '', descanso: '35s', obs: 'combinado B · 3 placas' },
      { name: 'Pulldown com Corda', sets: '4', reps: '15', weight: '', descanso: '35s', obs: 'combinado A · 6 placas' },
      { name: 'Tríceps Francês na Polia com Corda', sets: '4', reps: '15', weight: '', descanso: '35s', obs: 'combinado B · 5 placas' },
    ] },
  ],
};

// Disponibiliza a ficha da MFIT no dropdown "Treino pré-definido" (Mais → Planos de Treino).
// pessoal: true a esconde de todo mundo que não seja o dono — mesma regra da ficha do Bronyer.
if (typeof TREINOS_PREDEFINIDOS !== 'undefined') {
  TREINOS_PREDEFINIDOS[PLANO_MFIT.fonte] = {
    label: 'MFIT Personal — Quarta / Sexta / Domingo',
    descricao: 'Ficha da MFIT Personal (18/08/2026): 3 sessões por semana, tudo em 4x15 com 35s de intervalo e vários pares combinados (biséries). Cargas em placas ficam como placas — cada máquina tem placa diferente.',
    planos: PLANO_MFIT.planos,
    pessoal: true,
  };
}
