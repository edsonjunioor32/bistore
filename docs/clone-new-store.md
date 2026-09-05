# Criar uma nova loja a partir do Bistore

O Bistore foi desenhado para o modelo **um repositório = uma loja**. Não existe multitenancy dentro da aplicação.

## 1. Duplique o repositório

Crie um novo repositório a partir do Bistore e use um nome relacionado à nova loja.

## 2. Crie uma base Supabase nova

Cada loja deve possuir seu próprio projeto Supabase. Execute, nesta ordem:

1. `db/schema.sql`
2. `db/002_security_and_rpcs.sql`
3. `db/003_telegram_rpcs.sql`
4. `db/004_telegram_cancel_sale.sql`

Nunca compartilhe o mesmo banco entre duas lojas clonadas.

## 3. Configure a identidade

Na primeira abertura, acesse **Configurações** e informe:

- nome da loja;
- e-mail;
- telefone;
- WhatsApp;
- Instagram;
- cor principal;
- cor secundária.

Os dados operacionais começam vazios.

## 4. Configure autenticação

Defina no ambiente de publicação:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Crie o primeiro usuário no Supabase Auth e uma linha correspondente em `user_profiles` com `role = 'admin'`.

Com Supabase configurado, o Bistore exige login e habilita o fluxo **Esqueci minha senha**.

## 5. Configure Telegram, se utilizado

Implante `supabase/functions/telegram-webhook` e configure os secrets:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `TELEGRAM_BOT_TOKEN`

Cadastre os IDs numéricos autorizados em `telegram_users` e associe cada ID a um `user_profile_id`.

## 6. Cadastros iniciais

A sequência recomendada é:

1. Administradores e vendedores;
2. Lotes de despesas;
3. Despesas de cada lote;
4. Produtos, variações e SKUs;
5. Entrada inicial de estoque;
6. Formas e rotinas operacionais da loja;
7. Telegram, se necessário.

## 7. Regra de precificação

O cálculo consolidado é:

`preço mínimo = despesa por peça + (custo da peça × markup)`

`despesa por peça = total de despesas do lote ÷ quantidade de peças do lote`

O produto permanece vinculado ao lote escolhido no cadastro para preservar o histórico da compra.

## 8. GitHub Pages x produção

Sem Supabase configurado, a publicação em GitHub Pages funciona em **modo local**, usando armazenamento do navegador para permitir testes completos da interface.

Para operação real com múltiplos usuários, autenticação compartilhada e banco persistente, configure o Supabase. O Telegram também exige a Edge Function publicada no Supabase.
