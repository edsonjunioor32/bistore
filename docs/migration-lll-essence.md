# Referência funcional: LLL Essence

## Objetivo

O Bistore deve reproduzir a estrutura e as regras funcionais consolidadas na LLL Essence, mas sem carregar o nome, identidade visual ou dados reais daquela loja.

A LLL Essence é a **referência de funcionamento**. O Bistore é o **template reutilizável**.

## O que o template deve oferecer

- produtos e variações
- SKUs por modelo/cor/tamanho
- estoque atual e movimentações
- entradas, saídas, ajustes, reservas, trocas e devoluções
- vendas e itens
- pagamentos e parcelas
- canais de venda
- lotes independentes de despesas
- despesas por lote
- markup por lote
- vínculo produto/lote
- precificação mínima
- dashboard e indicadores
- relatórios CSV/PDF com totalizadores
- usuários administrador/vendedor
- auditoria
- recuperação de senha
- Telegram
- configurações e identidade da loja

## Regra definitiva de precificação

`despesa por peça + (custo × markup)`

A despesa rateada não é multiplicada pelo markup.

Exemplo consolidado:

`R$ 8,23 + (R$ 35,00 × 1,6) = R$ 64,23`

## Dados históricos

O template Bistore não deve conter os produtos, vendas, estoque, despesas ou usuários reais da LLL Essence. Uma instalação nova começa vazia e recebe apenas os cadastros da nova loja.

Se algum dia a base da LLL Essence for importada para uma instalação própria do Bistore, vendas históricas não podem executar nova baixa de estoque, pois o saldo de origem já as considera.

## Forma de reutilização

Cada nova loja deve ter:

1. um repositório próprio, criado a partir do Bistore;
2. uma base de dados própria;
3. sua própria configuração visual e cadastral;
4. seus próprios usuários e credenciais;
5. suas próprias integrações.

Nenhum dado precisa de `store_id`, porque a separação ocorre por instalação/repositório/banco.
