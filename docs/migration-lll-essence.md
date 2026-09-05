# Migração da LLL Essence para o Bistore

## Objetivo

Migrar a loja existente para o Bistore como primeiro tenant sem apagar, duplicar ou recalcular indevidamente dados históricos.

## O que deve ser preservado

- produtos e variações
- SKUs
- estoque atual
- movimentações
- vendas históricas
- pagamentos e parcelas
- canais de venda
- lotes de despesas
- despesas por lote
- markup por lote
- vínculo produto/lote
- preços mínimos já consolidados
- usuários e permissões
- auditoria
- configurações do Telegram

## Regra de precificação a preservar

`despesa por peça + (custo × markup)`

A migração não deve voltar à fórmula anterior em que a despesa também era multiplicada pelo markup.

## Estratégia

### 1. Criar o tenant

Criar `stores` com slug sugerido `lll-essence` e copiar somente os dados de identidade/configuração da loja.

### 2. Criar usuários

Mapear os usuários existentes para `user_profiles` e `store_users`.

### 3. Migrar lotes antes dos produtos

Os lotes precisam existir antes das variações para que `expense_batch_id` seja preservado.

### 4. Migrar produtos e variações

Para cada variação, preservar SKU, custo, preço de venda, preço mínimo, estoque disponível/reservado e lote.

### 5. Migrar vendas sem baixar estoque novamente

Vendas históricas devem ser importadas como histórico. O processo de importação não pode executar a rotina normal de baixa de estoque, pois o estoque atual já reflete essas vendas.

### 6. Migrar movimentações/auditoria

Quando a origem permitir, preservar datas, autores e referências.

### 7. Validar antes do corte

Comparar origem e destino:

- quantidade de produtos
- quantidade de variações
- saldo por SKU
- total de vendas por período
- total vendido
- total líquido
- quantidade de lotes
- despesas por lote
- preços mínimos

## Idempotência

Toda importação deve possuir chave de origem ou tabela de controle de migração para que uma segunda execução não crie vendas, pagamentos ou movimentações duplicadas.

## Dados reais

Nenhum dado real da LLL Essence foi incluído neste repositório. Para executar a migração será necessário acesso à base, exportação ou API da versão atualmente publicada.
