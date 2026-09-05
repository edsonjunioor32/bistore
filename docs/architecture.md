# Arquitetura do Bistore

## Princípio central

O Bistore é uma aplicação multi-tenant. Uma instalação atende várias lojas, e toda entidade operacional deve carregar `store_id`.

O isolamento não pode depender apenas de filtros na interface. O backend e o banco devem validar que o usuário pertence ao tenant solicitado.

## Domínios

### Plataforma

- lojas
- super administradores
- status da assinatura/plano (futuro)
- suporte e observabilidade

### Identidade da loja

- nome
- slug
- logo e favicon
- cores
- moeda
- idioma
- fuso horário
- contatos

### Usuários

- `super_admin`: acesso de plataforma
- `store_admin`: administração da loja
- `seller`: operação de vendas/estoque conforme permissão

### Produtos e estoque

- produto
- variação
- SKU exclusivo dentro da loja
- cor
- tamanho
- custo
- preço de venda
- preço mínimo
- estoque disponível e reservado
- movimentações imutáveis/auditáveis

### Despesas e precificação

Cada compra pode ter um lote de despesas independente.

Um lote contém:

- nome/data da compra
- número de peças para rateio
- markup
- várias despesas com data/categoria/valor

O produto/variação fica vinculado ao lote usado na sua precificação, evitando que compras futuras alterem retroativamente o custo histórico.

Regra consolidada:

`preço mínimo = despesa por peça + (custo da peça × markup)`

Valores monetários são armazenados em centavos.

### Vendas

A venda pertence a uma loja e contém snapshots dos itens vendidos para preservar o histórico mesmo se o cadastro do produto mudar depois.

O registro da venda e a baixa de estoque devem ocorrer em uma única transação de banco.

### Telegram

Cada loja pode ter configuração própria de bot, webhook e usuários autorizados. Tokens não devem ser gravados em texto puro.

### Auditoria

Ações administrativas e operacionais relevantes registram:

- loja
- usuário
- ação
- entidade
- valores anteriores/posteriores
- origem (web/telegram/importação)
- data/hora

## Resolução do tenant

A primeira versão suporta URL por slug:

`/loja/<slug>`

Futuras opções podem incluir subdomínio (`loja.bistore...`) ou domínio próprio sem alterar o modelo de dados.

## Segurança

Antes da produção:

1. habilitar RLS no Supabase/PostgreSQL compatível;
2. criar policies baseadas na associação `store_users`;
3. impedir que `store_id` seja aceito cegamente do cliente;
4. derivar o tenant do usuário/sessão/rota validada;
5. usar transações para venda + estoque;
6. criptografar credenciais por tenant;
7. manter logs de auditoria;
8. adicionar backup e retenção.
