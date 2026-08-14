# Meu Diário — memória do projeto

App pessoal de saúde/fitness (diário de treino, alimentação, medidas, tarefas) do **Victor**.
Tudo em **português (pt-BR)**: interface, comentários, mensagens de commit e changelog.

## Stack e arquitetura
- **Vanilla JS puro, sem build/framework.** `<script>` normais no `index.html`.
- Estado em **localStorage** (módulo `Storage`) + **IndexedDB** (`PhotoDB`, só fotos).
- **Firebase opcional** (Auth + Firestore, SDK compat via CDN) para login e sincronização na nuvem.
  Se o Firebase não carregar/não estiver configurado, o app roda 100% local (degrada sem quebrar).
- **Deploy**: GitHub Pages a partir da branch `main` → `victorrubiolopes.github.io`.

## Mapa de arquivos
- `index.html` — shell + inclusão dos scripts com cache-bust `?v=N`.
- `css/style.css` — todos os estilos; tokens de tema claro/escuro; cores de macro.
- `js/util.js` — helpers. Datas em **fuso LOCAL** via `toLocalISO` (nunca `toISOString`, que é UTC).
- `js/storage.js` — CRUD localStorage: `getAll/getByDate/add/update/remove/saveAll`, `getPerfil/savePerfil`, `mergeSeeds`, `KEYS`.
- `js/db.js` — `PhotoDB` (fotos no IndexedDB).
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
