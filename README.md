# Bistore

Bistore é uma plataforma white label para controle de estoque, vendas, pagamentos, despesas e precificação de múltiplas lojas.

## Objetivo

Uma única aplicação deve atender várias lojas (tenants), mantendo dados, usuários, branding, integrações e relatórios isolados por loja.

A LLL Essence pode ser migrada como o primeiro tenant sem misturar seus dados com outras lojas.

## Funcionalidades preservadas do projeto original

- Produtos e variações por SKU, cor, tamanho e modelo
- Entradas, saídas, ajustes, reservas, trocas, devoluções, perdas e avarias
- Vendas, pagamentos, parcelas, canais e status
- Lotes de despesas por compra
- Precificação por lote usando `despesa por peça + (custo × markup)`
- Relatórios e totalizadores
- Usuários e permissões
- Auditoria
- Recuperação de senha
- Integração Telegram por loja
- Interface preparada para branding white label

## Arquitetura white label

Cada registro operacional pertence a um `store_id`. O isolamento deve ser aplicado no banco e no backend, nunca apenas na interface.

Perfis iniciais:

- `super_admin`: administra a plataforma
- `store_admin`: administra apenas uma loja
- `seller`: opera estoque e vendas da loja

## Stack inicial

- Next.js + TypeScript
- PostgreSQL / Supabase compatível
- CSS com variáveis de tema por tenant
- API Routes / Server Components

## Desenvolvimento

```bash
npm install
cp .env.example .env.local
npm run dev
```

Acesse `http://localhost:3000`.

## Estrutura

- `app/` — aplicação web
- `lib/` — domínio, tenant, branding e precificação
- `db/` — modelo SQL multi-tenant
- `docs/` — arquitetura e plano de migração

## Estado atual

Este repositório contém a fundação white label do Bistore. O histórico funcional do sistema anterior foi usado como referência para preservar as regras já definidas. A migração dos dados reais da LLL Essence deve ser feita somente quando houver acesso à base/origem desses dados.
