<<<<<<< HEAD
# MyMoney — Controle financeiro pessoal

Sistema web 100% local: Node.js + Express + SQLite + Chart.js. Único requisito: **Node.js 20 ou superior**.

## Como executar

```bash
npm install     # instala dependências e copia o Chart.js para src/public/libs
npm start       # inicia o servidor
```

Acesse **http://localhost:3000**. Para desenvolvimento (reinício automático): `npm run dev`.

Na primeira execução o banco `database/mymoney.db` é criado automaticamente e um `.env` com `SESSION_SECRET`
aleatório é gerado. Para criar apenas o banco: `npm run init-db`.

## O que está implementado

- Cadastro/login (bcrypt, sessões persistidas em SQLite, opção de mostrar senha).
- Dashboard (saldo, receitas, despesas, saldo do mês, 3 gráficos, movimentações recentes).
- Receitas e despesas (cadastrar, editar, excluir, histórico), Movimentações (filtros, pesquisa, paginação).
- Metas com barra de progresso e botão "Adicionar valor".
- Relatórios com 5 gráficos interativos e tabelas por mês e por categoria.
- Configurações: perfil, senha, tema claro/escuro e categorias personalizadas.

## Segurança

Consultas parametrizadas, bcrypt (custo 12), cookies de sessão httpOnly/SameSite, token CSRF em toda requisição
que altera dados, validação no backend, limite de tentativas no login/cadastro, Helmet (CSP) e isolamento por
`usuario_id` em todas as consultas. O servidor escuta apenas em `127.0.0.1`.

## Estrutura

```
server.js            database/ (database.js, init.js, sessionStore.js, mymoney.db)
scripts/copy-libs.js src/routes · src/controllers · src/middleware · src/views · src/public
```

## Observações

- Valores são exibidos em R$ (pt-BR) e datas em dd/mm/aaaa; no banco as datas ficam em ISO (aaaa-mm-dd).
- Faça backup copiando `database/mymoney.db`.
=======
# mymoney
>>>>>>> cb81c0f483c9e1a967685726336c1b7f40dc104c
