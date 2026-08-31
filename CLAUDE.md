# Meu Diário — memória do projeto

App pessoal de saúde/fitness (diário de treino, alimentação, medidas, tarefas) do **Victor**.
Tudo em **português (pt-BR)**: interface, comentários, mensagens de commit e changelog.

## Stack e arquitetura
- **Vanilla JS puro, sem build/framework.** `<script>` normais no `index.html`.
- Estado em **localStorage** (módulo `Storage`) + **IndexedDB** (`PhotoDB`, só fotos).
- **Firebase opcional** (Auth + Firestore, SDK compat via CDN) para login e sincronização na nuvem.
  Se o Firebase não carregar/não estiver configurado, o app roda 100% local (degrada sem quebrar).
- **Deploy**: automático via GitHub Actions ao dar push na `main`. Sai em dois lugares:
  - **Firebase Hosting — `https://diariorubiofitness.web.app` (principal, é onde os usuários entram)**
  - GitHub Pages → `victorrubiolopes.github.io` (espelho)
  Depois do push, acompanhar o run em `/actions` e conferir a versão no ar com
  `curl -s "https://diariorubiofitness.web.app/index.html?cachebust=$(date +%s)" | grep -o '?v=[0-9]*' | sort -u`.

## Mapa de arquivos
- `index.html` — shell + inclusão dos scripts com cache-bust `?v=N`.
- `css/style.css` — todos os estilos; tokens de tema claro/escuro; cores de macro.
- `js/util.js` — helpers. Datas em **fuso LOCAL** via `toLocalISO` (nunca `toISOString`, que é UTC).
- `js/storage.js` — CRUD localStorage: `getAll/getByDate/add/update/remove/saveAll`, `getPerfil/savePerfil`, `mergeSeeds`, `KEYS`.
- `js/db.js` — `PhotoDB` (fotos no IndexedDB).
- `js/parse-plano.js` — `ParsePlano`: lê treino/plano alimentar colados em texto no painel do
  profissional. Funções puras (sem DOM), testáveis com `node`. Regra: erra alto — linha não
  entendida ou alimento fora da biblioteca vira aviso, **nunca some**. Importar só preenche a
  lista de montagem; quem prescreve continua sendo o botão "Enviar".
- `js/cloud.js` — módulo `Cloud`: login, sync, coleções compartilhadas, operações de nutri/admin.
- `js/firebase-config.js` — `FIREBASE_CONFIG` (chaves públicas, ok versionar).
- `js/data/*.js` — catálogos semente: `alimentos`, `exercicios`, `dietas`, `combos`, `treinosPredefinidos`, `planoVictor`, `changelog`.
- `js/views/*.js` — telas: `inicio` (aba "Hoje"), `treino`, `alimentacao`, `medidas`, `fotos`, `exames`, `tarefas`, `historico`, `mais`.
- `js/app.js` — bootstrap, roteamento, FAB e `aplicarSeeds()` (mergeSeeds + migrações de dados).
- `firestore.rules` — regras de segurança do Firestore (NÃO há deploy automático — colar manualmente no Console).

## Convenções (IMPORTANTE seguir sempre)
1. **Cache-bust**: qualquer mudança em JS/CSS exige **subir o `?v=N`** em TODOS os `?v=` do `index.html`
   (compartilham o mesmo número). Sem isso, o navegador serve o arquivo velho.
   `CUR=$(grep -o '?v=[0-9]*' index.html | head -1 | grep -o '[0-9]*'); sed -i "s/?v=$CUR\"/?v=$((CUR+1))\"/g" index.html`
2. **Changelog**: mudança visível ao usuário → adicionar entrada no topo de `js/data/changelog.js`
   (`{ date: 'YYYY-MM-DD', texto: '...' }`, mais recente primeiro). O card "Últimas atualizações" só aparece pra admin.
3. **Validar** todo JS editado com `node -c <arquivo>` antes de commitar.
4. **Alimentos** (`js/data/alimentos.js`): objeto com `categoria` (`'proteina'|'carboidrato'|'fruta'|'legume'|'outro'`)
   + `name, portionLabel, portionGrams, kcal, carbs, sugars, protein, fat, satFat, transFat, fiber, sodium`.
   Valores escalam por `portionGrams`. **O Victor pesa em gramas** — porções são referência; líquidos: `portionGrams` = ml (1ml≈1g).
5. **Fluxo git**: sempre `git fetch origin main` + `git checkout -B claude/add-food-pacoquita-yvhvnl origin/main`
   antes de começar (o Victor commita direto na `main` com frequência entre sessões).
   Depois: commit → push → PR → merge na `main`.

## Modelo de nuvem (Firestore)
- `users/{uid}` — snapshot privado do diário (SYNC_KEYS + perfil). Lê: o dono ou o admin/nutri do paciente.
- `profiles/{uid}` — perfil público (email, displayName, `nutriId`). `nutriId` é gravado **só na criação**, via link de convite.
- `prescricoes/{uid}` — dieta (macros) + plano alimentar (refeições) + plano de treino enviados pela nutri.
- `admins/{uid}` — papel de admin/nutri. `super: true` = dono do app (vê TODOS os pacientes).
- `inviteCodes/{code}` — link de convite (`?convite=CODE`) vincula paciente→nutri no cadastro.
- `sharedFoods` / `sharedExercises` — bibliotecas globais (qualquer logado adiciona; merge em tempo real).
  O `videoUrl` de exercício NÃO é compartilhado direto — passa por aprovação (`pendingVideos`).
- `pendingVideos/{id}` — vídeos de exercício sugeridos aguardando aprovação do admin.
- **Multi-nutri**: cada nutri vê só pacientes com seu `nutriId`; super-admin vê todos e pode reatribuir.
- Regras ficam em `firestore.rules` e **precisam ser coladas no Console** após mudar.

## Notas de implementação
- `Cloud.SYNC_KEYS` NÃO inclui as bibliotecas de alimentos/exercícios (sincronizam item-a-item pelas
  coleções compartilhadas, senão mandaria a lista inteira a cada push — deixava lento).
- Local-first: login é opcional, mas há uma tela de login (gate) quando a nuvem está ativa.
- Onboarding: conta nova vê tela de boas-vindas pedindo peso/altura/idade/sexo/atividade/objetivo.
- `aplicarSeeds()` em `app.js` roda migrações one-shot (ex: renomes de grupo muscular, níveis de emagrecimento).

### Navegação (`app.js`)
- 5 abas fixas na barra de baixo (`state.tab`). **Qualquer aba** pode ter subtelas próprias, com
  botão voltar e título no topbar (`SUB_TITLES`). Nasceu dentro de Mais (e por isso já se chamou
  `maisView`), mas o mecanismo nunca teve nada de específico daquela aba; Medidas usa o mesmo.
- Subtelas são **encadeáveis**: `state.subView` é a tela atual, `state.subParam` o argumento dela
  (ex: id do plano em edição) e `state.subStack` as anteriores.
  `api.goToSub(view, param)` empilha, `api.back()` desempilha, `goTo(tab)` zera a pilha.
  Chamada a partir do menu raiz não empilha nada — abrir uma tela e voltar cai no menu.
- **`goToSub` resolve a aba sozinho** por `SUB_TAB` (padrão `'mais'`; só as exceções entram lá).
  NÃO ajustar `state.tab` na mão antes de chamar: era assim que um chamador esquecia e a subtela
  abria com o roteador ainda renderizando a aba anterior. Trocar de aba zera a pilha, porque
  voltar de uma subtela de Medidas pra uma de Mais não é caminho que o usuário percorreu.
- **Botão voltar do celular**: o app mantém UMA entrada sentinela no `history` enquanto houver tela
  aberta; o `popstate` vira `back()` e o `render()` repõe a sentinela se ainda sobrou tela. Sair das
  telas sem usar o voltar (trocar de aba) consome a sentinela na mão, senão o próximo voltar do
  aparelho seria engolido. Tudo isso fica em `sincronizarHistorico()`, chamado no fim do `render()`.
- Padrão de UI pra lista-que-abre-tela: `.menu-list` + `.menu-item` + `.chev`, montado pelos helpers
  `Util.escolhaHtml()` / `Util.menuCardHtml()`. Não inventar CSS novo nem remontar o markup na mão.
- Onde vale tela própria: escolher algo de uma lista, montar/editar (planos de treino, biblioteca,
  dietas, painel do profissional, avaliação corporal). Onde NÃO vale: o registro diário (comida,
  treino, **peso**) — é o que o usuário faz toda hora e sai em 2 toques; navegação ali só adiciona
  atrito. Medidas é o caso que mostra os dois lados: pesar é 2x/semana e fica inline na raiz, a
  avaliação completa é mensal e virou tela.
- **Já aplicado em**: Planos de Treino, Biblioteca de Alimentos, Biblioteca de Exercícios, Combos,
  Minhas Dietas e Medidas. A regra em todas: a **tela raiz é o que a pessoa vem consultar** (a lista;
  em Medidas, a composição corporal), com os caminhos de criação como `.menu-item` abaixo dela; cada
  formulário é uma tela-filha que fecha em `api.back()`, nunca em `api.render()` — voltar pra raiz é
  o que mostra que a ação deu certo.
- Formulário que acumula estado local antes de salvar (itens de um combo, exercícios de um plano)
  repinta só a sub-lista, nunca a tela toda: `api.render()` no meio do preenchimento apaga o que a
  pessoa já montou.
- Toda `subView` precisa de entrada em `SUB_TITLES` (`app.js`), senão o topbar cai no título da aba.
- `node testes/navegacao.test.js` checa isso estaticamente, mais o dono declarado em `SUB_TAB`, mais
  a ausência de ajuste manual de aba. Rodar depois de mexer em roteamento.
