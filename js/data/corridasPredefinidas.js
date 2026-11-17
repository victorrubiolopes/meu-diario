// Registro dos pacotes de corrida carregáveis, espelhando TREINOS_PREDEFINIDOS da musculação.
//
// Nasce VAZIO de propósito. A musculação tem pacotes genéricos (montados por princípios de
// ciência do esporte, servem pra qualquer um); corrida não tem nenhum, e inventar um seria
// prescrever treino sem saber o condicionamento de quem vai correr. Quem preenche este
// objeto são os arquivos de ficha pessoal (ex: corridaMfit.js), que se registram aqui no
// próprio fim do arquivo, com 'pessoal: true'.
//
// Por que chave separada de TREINOS_PREDEFINIDOS: corrida não tem série, repetição nem
// carga. Tem distância, tempo e protocolo — e o app já guarda isso em 'corrida_planos', que
// é uma coleção à parte de 'treino_planos'. Misturar os dois no mesmo registro obrigaria
// cada tela a perguntar "isso aqui é de qual tipo?" antes de desenhar qualquer coisa.
//
// Formato de cada entrada:
//   CORRIDAS_PREDEFINIDAS[id] = {
//     label: 'Nome que aparece no card',
//     descricao: 'O que é o pacote, em uma ou duas frases',
//     pessoal: true,            // esconde de quem não é o dono do app
//     planos: [ { nome, tipo, distanceKm, timeMin, descricao } ],
//   }
//
// distanceKm e timeMin podem ser null: num treino intervalado o total depende de quanto a
// pessoa correu de fato, e o botão "Usar" (que preenche os campos de registro) só aparece
// quando pelo menos um dos dois existe. Protocolo detalhado vai em 'descricao'.
const CORRIDAS_PREDEFINIDAS = {};
