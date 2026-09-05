# Arquitetura do Bistore

## Princípio central

O Bistore é um **template de instalação única**: cada repositório publicado representa uma loja e utiliza uma base de dados própria.

Para atender outra empresa, o repositório é duplicado e conectado a outra base. Não há `store_id`, tenant, seletor de lojas ou painel de super administrador.

## Identidade da loja

A instalação possui uma única configuração de loja com:

- nome comercial e razão social opcional
- logo e favicon
- cores
- moeda BRL
- idioma pt-BR
- fuso horário
- e-mail, telefone, WhatsApp e Instagram
- endereço

Os valores iniciais podem vir do ambiente e depois devem ser editáveis pelo menu Configurações.

## Usuários

- `admin`: administra cadastros, custos, relatórios, configurações e usuários
- `seller`: opera estoque/vendas conforme permissões e não altera custos ou configurações sensíveis

## Produtos e estoque

Cada combinação de produto/modelo, cor e tamanho possui SKU exclusivo. A variação guarda custo, preço de venda, preço mínimo, estoque, reserva, mínimo e lote de despesas utilizado.

Toda movimentação deve registrar estoque anterior/posterior, motivo, usuário/origem e venda relacionada quando existir.

## Despesas e precificação

Cada nova compra pode criar um lote de despesas independente. O lote guarda data, número de peças para rateio, markup e seus gastos.

O produto/variação permanece vinculado ao lote escolhido no cadastro para que compras posteriores não alterem retroativamente sua precificação.

Regra consolidada da LLL Essence:

`preço mínimo = despesa por peça + (custo da peça × markup)`

Valores monetários devem ser armazenados em centavos/inteiros ou `numeric`, nunca `float`.

## Vendas

A venda contém snapshots dos itens vendidos para preservar o histórico mesmo se o cadastro do produto mudar. O registro da venda e a baixa de estoque devem ocorrer na mesma transação de banco.

## Relatórios

A instalação deve oferecer relatórios de estoque, movimentações, vendas por período/produto/modelo/cor/tamanho/canal/pagamento, lucro estimado, cancelamentos, trocas e devoluções, com exportação CSV/PDF e total geral de vendas.

## Telegram

Cada instalação possui um único conjunto de credenciais do bot e sua própria lista de usuários autorizados. Segredos não devem ir para o cliente.

## Auditoria

Ações relevantes registram usuário, ação, entidade, dados anteriores/posteriores, origem, data/hora e, quando disponível, IP/user-agent.

## Recuperação de senha

O login deve oferecer `Esqueci minha senha`, com link temporário, confirmação da nova senha, invalidação de sessões anteriores e auditoria.

## Segurança

Antes da produção:

1. autenticar todas as rotas privadas;
2. aplicar autorização por papel no backend;
3. usar transações para venda + estoque;
4. impedir estoque negativo sem permissão administrativa;
5. proteger tokens de Telegram, e-mail e banco;
6. registrar auditoria;
7. manter backup e migrações idempotentes;
8. validar entradas e cálculos financeiros no servidor.
