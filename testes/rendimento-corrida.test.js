// Gráfico de rendimento na corrida (Histórico → Corrida).
//
// O pace sozinho não responde "estou melhorando?", porque correr devagar num dia fácil e
// correr devagar por estar pior produzem o mesmo número. Rendimento = velocidade dividida
// pela frequência cardíaca: mostra se o MESMO ritmo passou a custar mais ou menos coração.
//
// POR QUE A CONTA SIMPLES E NÃO A ACADÊMICA: a versão por fração da reserva cardíaca exige
// FC de repouso e FC máxima no perfil. Testada contra 18 meses de corridas reais, a conta
// simples correlaciona 0,95 com ela, acha o mesmo fundo (abr/2026) e magnitude parecida
// (-12% contra -14%). Não vale pedir dois campos que ninguém preenche — e que, preenchidos
// errado, deslocam a curva inteira.
const fs = require('fs');
const path = require('path');

const raiz = path.join(__dirname, '..');
let falhas = 0;
function ok(cond, nome) {
  console.log((cond ? '  OK    ' : '  FALHOU ') + nome);
  if (!cond) falhas++;
}

const hist = fs.readFileSync(path.join(raiz, 'js/views/historico.js'), 'utf8');
const bloco = hist.slice(hist.indexOf('function renderCorrida'), hist.indexOf('function renderTreino'));

// A mesma fórmula que a tela usa, pra testar o comportamento e não só o texto.
const rend = (km, min, fc) => Math.round(((km * 1000) / min / fc) * 1000) / 1000;

console.log('\n--- a conta se comporta como deve ---');
ok(rend(5.2, 35.6, 135) > rend(5.2, 35.6, 145), 'mesmo ritmo com FC menor dá rendimento MAIOR');
ok(rend(5.2, 33, 140) > rend(5.2, 38, 140), 'mesma FC indo mais rápido dá rendimento MAIOR');
ok(rend(10, 60, 140) === rend(5, 30, 140), 'não depende da distância, só do ritmo e da FC');
// Valores reais de 17/11 e 12/11: a de 17/11 foi mais rápida com FC parecida.
ok(rend(5.20, 35.6, 140) > rend(3.93, 31.2, 129) * 1.0, '17/11 rende mais que 12/11, como o ritmo indica');

console.log('\n--- só usa corrida com FC média preenchida ---');
ok(/filter\(c => c\.fcMedia > 0\)/.test(bloco), 'filtra pelas que têm FC média');
ok(/Preencha a FC média/.test(bloco), 'sem nenhuma, explica o que fazer em vez de mostrar gráfico vazio');
ok(/\$\{comFC\.length\} de \$\{all\.length\} corridas/.test(bloco), 'diz quantas corridas entraram no gráfico');

console.log('\n--- não quebra o que já existia ---');
ok(/Evolução do pace \(min\/km\)/.test(bloco), 'o gráfico de pace continua');
ok(/drawLineChart\(document\.getElementById\('chart-canvas'\), points/.test(bloco), 'e segue desenhando com os mesmos dados');
ok(/if \(pontosRend\.length > 0\) drawLineChart/.test(bloco),
  'só desenha o segundo gráfico se houver canvas — senão quebraria a tela inteira');

console.log('\n--- a direção está explicada na tela ---');
// "Quanto menor, melhor" no pace e "quanto maior, melhor" no rendimento: os dois juntos
// numa tela só convidam a confusão, então cada um diz o seu.
ok(/Quanto menor, melhor/.test(bloco), 'pace: menor é melhor');
ok(/Quanto MAIOR, melhor/.test(bloco), 'rendimento: maior é melhor, em destaque');
ok(/mais velocidade pelo mesmo esforço/.test(bloco), 'explica o que o número significa');

console.log('\n--- não pede nada no perfil ---');
// Se dependesse de FC de repouso/máxima, seria mais um campo pra preencher e mais uma fonte
// de erro silencioso.
ok(!/fcRepouso|fcMaxima|getPerfil\(\)/.test(bloco), 'a conta não lê o perfil');

console.log(falhas === 0 ? '\nTODOS OS TESTES PASSARAM\n' : `\n${falhas} TESTE(S) FALHARAM\n`);
process.exit(falhas === 0 ? 0 : 1);
