#!/usr/bin/env bash
# Teste de fumaça da API do MyMoney. Requer: curl e jq. Uso: BASE_URL=http://localhost:3000 bash scripts/smoke-test.sh
set -euo pipefail

BASE="${BASE_URL:-http://localhost:3000}"
DIR="$(mktemp -d)"
trap 'rm -rf "$DIR"' EXIT
HOJE="$(date +%F)"
SUFIXO="$(date +%s)$RANDOM"

ok()   { echo "✔ $1"; }
fail() { echo "✘ $1" >&2; exit 1; }

# http <jar> <método> <caminho> [json] -> imprime o código HTTP; corpo em $DIR/body
http() {
  local jar="$1" metodo="$2" caminho="$3" corpo="${4:-}"
  local args=(-sS -o "$DIR/body" -w '%{http_code}' -b "$jar" -c "$jar" -X "$metodo" -H 'Content-Type: application/json')
  [ "$metodo" != "GET" ] && [ -n "${TOKEN:-}" ] && args+=(-H "X-CSRF-Token: $TOKEN")
  [ -n "$corpo" ] && args+=(-d "$corpo")
  curl "${args[@]}" "$BASE$caminho"
}
esperar() { # <descrição> <esperado> <obtido>
  [ "$2" = "$3" ] && ok "$1" || { echo "Corpo: $(cat "$DIR/body" 2>/dev/null)" >&2; fail "$1 (esperado $2, obtido $3)"; }
}
token() { TOKEN="$(curl -sS -b "$1" -c "$1" "$BASE/api/csrf" | jq -r .token)"; [ -n "$TOKEN" ] && [ "$TOKEN" != null ] || fail "Token CSRF não obtido"; }
cadastrar() { # <jar> <nome> <email>
  token "$1"
  esperar "Cadastro de $2" 201 "$(http "$1" POST /api/auth/register "{\"nome\":\"$2\",\"email\":\"$3\",\"senha\":\"senha-segura-123\",\"confirmacao\":\"senha-segura-123\"}")"
  token "$1" # a sessão é regenerada após o cadastro
}

A="$DIR/a.jar"; B="$DIR/b.jar"

esperar "Página inicial responde" 200 "$(curl -s -o /dev/null -w '%{http_code}' "$BASE/")"
esperar "Dashboard exige login (redireciona)" 302 "$(curl -s -o /dev/null -w '%{http_code}' "$BASE/dashboard")"
esperar "API exige login" 401 "$(curl -s -o /dev/null -w '%{http_code}' "$BASE/api/receitas")"

# --- Usuário A ---
cadastrar "$A" "Usuario Teste A" "a-$SUFIXO@example.com"
esperar "Sessão ativa após cadastro" 200 "$(http "$A" GET /api/auth/me)"

TOKEN_VALIDO="$TOKEN"; TOKEN=""
esperar "POST sem token CSRF é bloqueado" 403 "$(http "$A" POST /api/receitas '{}')"
TOKEN="$TOKEN_VALIDO"

http "$A" GET "/api/categorias?tipo=receita" > /dev/null; CAT_R="$(jq -r '.[0].id' "$DIR/body")"
http "$A" GET "/api/categorias?tipo=despesa" > /dev/null; CAT_D="$(jq -r '.[0].id' "$DIR/body")"
esperar "Cria receita de R\$ 1000" 201 "$(http "$A" POST /api/receitas "{\"descricao\":\"Salário teste\",\"valor\":1000,\"categoria_id\":$CAT_R,\"data\":\"$HOJE\",\"forma\":\"PIX\"}")"
esperar "Cria despesa de R\$ 250,40" 201 "$(http "$A" POST /api/despesas "{\"descricao\":\"Mercado teste\",\"valor\":250.40,\"categoria_id\":$CAT_D,\"data\":\"$HOJE\",\"forma\":\"Boleto\"}")"
DESPESA_ID="$(jq -r .id "$DIR/body")"
esperar "Rejeita valor negativo" 400 "$(http "$A" POST /api/despesas "{\"descricao\":\"Inválida\",\"valor\":-1,\"categoria_id\":$CAT_D,\"data\":\"$HOJE\",\"forma\":\"PIX\"}")"

esperar "Dashboard responde" 200 "$(http "$A" GET /api/relatorios/dashboard)"
[ "$(jq -r .saldo_atual "$DIR/body")" = "749.6" ] && ok "Saldo calculado corretamente (749,60)" || fail "Saldo incorreto: $(jq -r .saldo_atual "$DIR/body")"

esperar "Cria meta" 201 "$(http "$A" POST /api/metas "{\"nome\":\"Meta teste\",\"valor_desejado\":1000,\"valor_acumulado\":100,\"data_limite\":\"2099-12-31\"}")"
esperar "Relatório por período responde" 200 "$(http "$A" GET "/api/relatorios/periodo?inicio=$(date +%Y)-01-01&fim=$HOJE")"

# --- Isolamento entre usuários ---
cadastrar "$B" "Usuario Teste B" "b-$SUFIXO@example.com"
esperar "Usuário B lista movimentações" 200 "$(http "$B" GET /api/movimentacoes)"
[ "$(jq -r .total "$DIR/body")" = "0" ] && ok "Usuário B não vê dados do A" || fail "Vazamento de dados entre usuários"
esperar "Usuário B não exclui despesa do A" 404 "$(http "$B" DELETE "/api/despesas/$DESPESA_ID")"
esperar "Usuário B não vê metas do A" 200 "$(http "$B" GET /api/metas)"
[ "$(jq -r 'length' "$DIR/body")" = "0" ] && ok "Metas isoladas por usuário" || fail "Vazamento de metas"

# --- Login/logout ---
esperar "Logout do usuário A" 200 "$(http "$A" POST /api/auth/logout)"
esperar "Sessão encerrada após logout" 401 "$(http "$A" GET /api/auth/me)"
token "$A"
esperar "Login com senha errada falha" 401 "$(http "$A" POST /api/auth/login "{\"email\":\"a-$SUFIXO@example.com\",\"senha\":\"errada-123\"}")"
esperar "Login com credenciais corretas" 200 "$(http "$A" POST /api/auth/login "{\"email\":\"a-$SUFIXO@example.com\",\"senha\":\"senha-segura-123\"}")"

echo; echo "Todos os testes de fumaça passaram."
