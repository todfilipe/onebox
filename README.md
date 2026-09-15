<a href="https://oneboxai.me">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/readme/nav-dark.svg">
    <img src="docs/readme/nav-light.svg" width="100%"
      alt="Barra do OneBox com o símbolo da aplicação à esquerda e o endereço oneboxai.me à direita">
  </picture>
</a>

<p align="center">
  <a href="#produto">Produto</a>&nbsp;&nbsp;·&nbsp;&nbsp;<a href="#como-funciona">Como funciona</a>&nbsp;&nbsp;·&nbsp;&nbsp;<a href="#por-dentro">Por dentro</a>&nbsp;&nbsp;·&nbsp;&nbsp;<a href="#correr-localmente">Correr localmente</a>
</p>

<br>

<p align="center"><strong>OneBox</strong></p>

<h1 align="center">A tua inbox, organizada antes de a abrires.</h1>

<p align="center">
  Várias contas Gmail numa só caixa de entrada.<br>
  Cada email chega resumido numa linha e marcado por importância.
</p>

<p align="center">
  <a href="https://oneboxai.me">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="docs/readme/cta-dark.svg">
      <img src="docs/readme/cta-light.svg" width="232" height="48" alt="Visitar oneboxai.me">
    </picture>
  </a>
</p>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/readme/hero-dark.svg">
  <img src="docs/readme/hero-light.svg" width="100%"
    alt="A inbox do OneBox com emails das contas pessoal e trabalho numa só lista. Cada linha mostra a marca da conta, o remetente, o assunto, uma etiqueta Alta, Média ou Baixa e um resumo de uma linha.">
</picture>

<br>
<br>

<a id="produto"></a>

<h2 align="center">Quatro inboxes. Nenhuma delas te diz o que é urgente.</h2>

<br>
<br>

## Todas as contas, uma caixa.

Ligas as contas Gmail uma vez e tudo passa a chegar ao mesmo sítio. Cada linha
mostra de que conta veio, e um toque na marca da conta deixa só essa à vista.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/readme/accounts-dark.svg">
  <img src="docs/readme/accounts-light.svg" width="100%"
    alt="Duas contas Gmail, pessoal e trabalho, a chegar à mesma lista de emails, onde cada linha tem a marca P ou T da conta de origem.">
</picture>

<br>

## A IA lê cada email.

Assim que um email chega, a Gemini escreve um resumo de uma linha e marca-o
como alta, média ou baixa importância. Se não concordares, reclassificas com um
toque e a tua escolha passa a valer sobre a da IA.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/readme/ai-dark.svg">
  <img src="docs/readme/ai-light.svg" width="100%"
    alt="Painel de um email da Marta Correia marcado como Alta, com o resumo da IA a explicar que a reunião foi antecipada para as 9h30 e que é pedida confirmação.">
</picture>

<br>

## Responde em segundos.

A resposta já vem escrita quando abres o email. Se o tom não servir, pedes
outro, mais formal, mais curto, mais simpático ou mais direto, e a Gemini
reescreve o rascunho. Nada sai sem confirmares o envio.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/readme/reply-dark.svg">
  <img src="docs/readme/reply-light.svg" width="100%"
    alt="Editor da resposta sugerida com o rascunho já escrito, os quatro ajustes de tom e o botão Enviar resposta.">
</picture>

<br>
<br>

<a id="como-funciona"></a>

## Chega à inbox sem refrescar a página.

O Gmail avisa o Pub/Sub, que chama um webhook do n8n. O workflow confirma que o
aviso vem mesmo da Google, vai buscar a mensagem, pede à Gemini o resumo e a
importância, aplica as tuas regras por cima e grava tudo no Supabase. O
Realtime avisa a interface, que mostra a linha nova sem ninguém tocar em nada.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/readme/pipeline-dark.svg">
  <img src="docs/readme/pipeline-light.svg" width="100%"
    alt="Um email da Marta Correia chega às contas pessoal e trabalho. O Pub/Sub avisa o n8n, que valida o token OIDC, vai buscar a mensagem e pede à Gemini a importância. A Gemini sugere Média e a regra do utilizador muda-a para Alta. O Supabase grava, o Realtime avisa o browser e as duas linhas aparecem na inbox já etiquetadas.">
</picture>

<br>
<br>

## O resto do que precisas.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/readme/features-dark.svg">
  <img src="docs/readme/features-light.svg" width="100%"
    alt="Três cartões: resultados de uma pesquisa por fatura em duas contas, a lista de emails arquivados e as regras de categorização do utilizador por remetente, domínio e palavra-chave.">
</picture>

### Pesquisa em todas as contas

Procura ao mesmo tempo no assunto, no remetente e no resumo, em todas as contas
ligadas.

### Arquivo e adiados

Arquiva o que já resolveste e adia o que fica para depois. O email adiado volta
à inbox à hora que escolheste.

### As tuas regras ganham sempre

Crias regras por remetente, domínio ou palavra-chave e elas passam à frente da
decisão da IA. Se disseres que tudo da Marta é alta importância, é alta
importância.

<br>
<br>

<a id="por-dentro"></a>

## Como é feito.

Next.js e Auth.js num VPS com Docker, Supabase para os dados e o tempo real, um
workflow n8n para a pipeline e a Gemini para ler cada email. O processamento
corre fora do pedido do utilizador: a interface não espera por ele, recebe o
resultado quando fica pronto.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/readme/architecture-dark.svg">
  <img src="docs/readme/architecture-light.svg" width="100%"
    alt="Arquitetura do OneBox: o browser fala com a app Next.js num VPS, ao lado do n8n. O Gmail avisa o Pub/Sub, que chama o n8n. O n8n usa a Gmail API e a Gemini e grava no Supabase, que envia a atualização ao browser por Realtime.">
</picture>

<details>
<summary><strong>Cifrar os tokens OAuth antes de chegarem à base de dados.</strong></summary>

<br>

Os tokens de acesso e de renovação de cada conta Gmail são cifrados com
AES-256-GCM, com um IV aleatório de 12 bytes por valor e a tag de autenticação
guardada junto. Só o servidor Next.js e o n8n conhecem a chave. As colunas dos
tokens ficam fora do `grant` de leitura do papel `authenticated`, por isso nem
o próprio dono as consegue pedir a partir do browser.

[`src/lib/token-crypto.ts`](src/lib/token-crypto.ts) ·
[`rls_policies.sql`](supabase/migrations/20260727120000_rls_policies.sql)

</details>

<details>
<summary><strong>Isolar cada utilizador com Row Level Security.</strong></summary>

<br>

O login é do Auth.js, não do Supabase Auth. Para o browser poder ouvir o
Realtime, a app assina um JWT próprio de 1 hora com o `sub` igual ao id do
utilizador, que é o valor que o `auth.uid()` das políticas lê. Com esse token o
browser só vê as suas linhas e só pode alterar quatro colunas dos seus emails:
estado, categoria manual, data de adiamento e data de leitura. No servidor, a
app usa a service role e filtra sempre por utilizador. Um teste de integração
com dois utilizadores, em 9 casos, confirma o isolamento contra o Supabase
local.

[`src/lib/supabase-token.ts`](src/lib/supabase-token.ts) ·
[`src/lib/rls.integration.test.ts`](src/lib/rls.integration.test.ts)

</details>

<details>
<summary><strong>Pôr as regras do utilizador à frente da IA.</strong></summary>

<br>

A Gemini sugere uma importância e a pipeline aplica depois as regras ativas do
utilizador. Quando várias coincidem, ganha a mais específica: remetente, depois
domínio, depois palavra-chave. Por cima de tudo fica a reclassificação manual,
guardada numa coluna à parte e combinada numa coluna gerada com
`coalesce(manual_category, category)`, para a IA nunca apagar uma escolha do
utilizador.

[`n8n/pipeline-gmail.json`](n8n/pipeline-gmail.json) ·
[`effective_category.sql`](supabase/migrations/20260727160000_effective_category.sql)

</details>

<details>
<summary><strong>Renovar o <code>watch()</code> de cada conta antes de expirar.</strong></summary>

<br>

A Gmail API deixa de enviar notificações 7 dias depois de cada `watch()`. Cada
conta regista o seu quando é ligada, e um segundo workflow n8n corre todas as
segundas às 4h, lê as contas ativas e renova-as, sem ninguém ter de voltar a
ligar nada.

[`src/lib/gmail-watch.ts`](src/lib/gmail-watch.ts) ·
[`n8n/renovacao-watch.json`](n8n/renovacao-watch.json)

</details>

<details>
<summary><strong>Verificar quem chama o webhook.</strong></summary>

<br>

A subscrição push do Pub/Sub autentica-se com OIDC. O primeiro nó do workflow
valida a assinatura do JWT com as chaves públicas da Google e confirma `iss`,
`aud`, `email`, `email_verified` e `exp` antes de tocar na Gmail API ou na
Gemini. O caminho do webhook não tem sufixo secreto: sem esta verificação,
quem o lesse no código podia gastar quota à conta de quem aloja o projeto.

[`n8n/pipeline-gmail.json`](n8n/pipeline-gmail.json)

</details>

<br>
<br>

<a id="correr-localmente"></a>

## Correr localmente

A app e a base de dados correm na tua máquina com Docker. A pipeline do Gmail
precisa de um projeto Google Cloud e de um n8n acessível por HTTPS, porque é a
Google que chama o webhook.

<details>
<summary><strong>Ver os requisitos</strong></summary>

<br>

- Node.js 22, como no `.nvmrc`
- Docker, para o Supabase local
- Um projeto Google Cloud com um cliente OAuth, a Gmail API e o Pub/Sub
- Uma chave da Gemini API
- Um n8n acessível por HTTPS, só para a pipeline

</details>

<details>
<summary><strong>Arrancar a app e a base de dados</strong></summary>

<br>

```bash
git clone https://github.com/todfilipe/onebox.git
cd onebox
npm ci
cp .env.example .env.local
npm run db:start
npm run seed
npm run dev
```

O `npm run db:start` arranca o Supabase em Docker e aplica as migrations de
[`supabase/migrations/`](supabase/migrations/). Copia para o `.env.local` o URL
e as chaves que ele mostra, que `npx supabase status` volta a mostrar. O seed
cria um utilizador de exemplo com duas contas fictícias, 11 emails e 3 regras.

A app recusa-se a arrancar se faltar alguma variável e diz qual.

</details>

<details>
<summary><strong>Configurar as variáveis de ambiente</strong></summary>

<br>

```text
Google OAuth    GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
Auth.js         NEXTAUTH_SECRET, NEXTAUTH_URL
Supabase        SUPABASE_URL, SUPABASE_ANON_KEY
                SUPABASE_SERVICE_ROLE_KEY, SUPABASE_JWT_SECRET
Gemini          GEMINI_API_KEY
Tokens          TOKEN_ENCRYPTION_KEY
Gmail           GMAIL_PUBSUB_TOPIC
Só scripts      SUPABASE_DB_URL, SUPABASE_ACCESS_TOKEN
```

Gera `NEXTAUTH_SECRET` e `TOKEN_ENCRYPTION_KEY` com `openssl rand -base64 32`.
A `TOKEN_ENCRYPTION_KEY` tem de ser igual na app e no n8n. No cliente OAuth,
regista `http://localhost:3000/api/auth/callback/google` e
`http://localhost:3000/api/accounts/callback`. O
[`.env.example`](.env.example) diz onde encontrar cada valor.

</details>

<details>
<summary><strong>Correr os testes</strong></summary>

<br>

```bash
npm test
npm run test:integration
npm run lint
npm run typecheck
npm run format:check
```

Os testes unitários não precisam de base de dados. Os de integração correm só
contra o Supabase local e incluem o isolamento entre dois utilizadores. Os
scripts `db:push`, `seed` e `gen:types` usam o Supabase local e só tocam num
projeto alojado com `-- --prod`.

</details>

<details>
<summary><strong>Ligar a pipeline do Gmail ao n8n</strong></summary>

<br>

1. No Google Cloud, cria um tópico Pub/Sub e dá o papel Pub/Sub Publisher a
   `gmail-api-push@system.gserviceaccount.com`.
2. Cria uma subscrição push com autenticação OIDC, com uma service account
   própria, a apontar para `https://<o-teu-n8n>/webhook/onebox-gmail`.
3. Importa os dois workflows e repete para `n8n/renovacao-watch.json`:

   ```bash
   docker exec -i <container-n8n> sh -c "cat > /tmp/wf.json" < n8n/pipeline-gmail.json
   docker exec <container-n8n> n8n import:workflow --input=/tmp/wf.json
   ```

4. Dá ao container do n8n `SUPABASE_URL`, `TOKEN_ENCRYPTION_KEY`,
   `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GEMINI_API_KEY`,
   `GMAIL_PUBSUB_TOPIC`, `PUBSUB_PUSH_AUDIENCE` (o URL do webhook),
   `PUBSUB_PUSH_SERVICE_ACCOUNT`, `N8N_BLOCK_ENV_ACCESS_IN_NODE=false` e
   `NODE_FUNCTION_ALLOW_BUILTIN=crypto`.
5. Cria a credencial Supabase no n8n com a service role key, ativa os dois
   workflows e reinicia o n8n para registar o webhook e o agendamento.

Expõe só `/webhook/*` do n8n na internet e usa o editor por túnel SSH.

</details>

<br>
<br>

<p align="center">
  <sub>
    <a href="https://github.com/todfilipe/onebox">Repositório</a>&nbsp;&nbsp;·&nbsp;&nbsp;Feito por <a href="https://github.com/todfilipe">Filipe</a>&nbsp;&nbsp;·&nbsp;&nbsp;<a href="LICENSE">Licença MIT</a>
  </sub>
</p>
