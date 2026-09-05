# Bistore

Bistore é um template reutilizável para controle de estoque e vendas de **uma única loja por instalação**.

O objetivo é preservar a estrutura e as funcionalidades consolidadas no projeto LLL Essence, mas sem deixar nome, identidade visual ou dados daquela loja fixos no código.

## Como reutilizar para outra loja

Para criar uma nova instalação:

1. Duplique este repositório para um novo repositório.
2. Crie/conecte uma nova base de dados.
3. Configure nome, logo, cores, contatos e demais dados da nova loja.
4. Cadastre os usuários, produtos, estoque, lotes de despesas e integrações daquela empresa.
5. Publique a nova instalação.

Cada repositório e cada banco pertencem a somente uma loja. Não existe seletor de lojas, `store_id`, tenant ou painel de super administrador.

## Funcionalidades de referência da LLL Essence

- Dashboard com vendas, faturamento, valor líquido e ticket médio
- Produtos e variações por SKU, modelo, cor e tamanho
- Entradas, saídas, ajustes, reservas, trocas, devoluções, perdas e avarias
- Vendas, pagamentos, parcelas, canais e cancelamentos
- Lotes de despesas independentes por compra
- Precificação por lote usando `despesa por peça + (custo × markup)`
- Relatórios de vendas e estoque com totalizadores
- Exportação CSV e PDF
- Administrador e vendedor
- Auditoria
- Recuperação de senha
- Integração Telegram
- Configuração de identidade e dados da loja

## Configuração da loja

Os dados iniciais ficam em variáveis `NEXT_PUBLIC_STORE_*`, documentadas no `.env.example`. A evolução prevista é permitir que os mesmos dados sejam editados pelo menu **Configurações** e persistidos na tabela `store_settings`.

## Stack

- Next.js + TypeScript
- PostgreSQL / Supabase compatível
- Autenticação por Supabase Auth ou equivalente
- API Routes / Server Actions
- Telegram Bot API por webhook
- Resend ou equivalente para recuperação de senha

## Desenvolvimento

```bash
npm install
cp .env.example .env.local
npm run dev
```

Acesse `http://localhost:3000`.

## Publicação atual

O GitHub Pages serve como prévia visual estática. Para reproduzir integralmente a LLL Essence com autenticação, banco, operações de estoque, vendas, e-mail e webhook do Telegram, a instalação de produção deve usar uma hospedagem com backend (por exemplo Vercel) e PostgreSQL/Supabase.
