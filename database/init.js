require('dotenv').config();
const db = require('./database');

const SCHEMA = `
CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  senha_hash TEXT NOT NULL,
  criado_em TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS categorias (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('receita','despesa')),
  UNIQUE (usuario_id, tipo, nome)
);

CREATE TABLE IF NOT EXISTS receitas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  categoria_id INTEGER NOT NULL REFERENCES categorias(id) ON DELETE RESTRICT,
  descricao TEXT NOT NULL,
  valor REAL NOT NULL CHECK (valor > 0),
  data TEXT NOT NULL,
  forma TEXT NOT NULL,
  criado_em TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS despesas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  categoria_id INTEGER NOT NULL REFERENCES categorias(id) ON DELETE RESTRICT,
  descricao TEXT NOT NULL,
  valor REAL NOT NULL CHECK (valor > 0),
  data TEXT NOT NULL,
  forma TEXT NOT NULL,
  criado_em TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS metas_financeiras (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  valor_desejado REAL NOT NULL CHECK (valor_desejado > 0),
  valor_acumulado REAL NOT NULL DEFAULT 0 CHECK (valor_acumulado >= 0),
  data_limite TEXT NOT NULL,
  criado_em TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS sessoes (
  sid TEXT PRIMARY KEY,
  dados TEXT NOT NULL,
  expira INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_receitas_usuario_data ON receitas (usuario_id, data);
CREATE INDEX IF NOT EXISTS idx_despesas_usuario_data ON despesas (usuario_id, data);
CREATE INDEX IF NOT EXISTS idx_metas_usuario ON metas_financeiras (usuario_id);
`;

function initDatabase() {
  db.exec(SCHEMA);
}

module.exports = { initDatabase };

if (require.main === module) {
  initDatabase();
  console.log('[MyMoney] Banco de dados inicializado com sucesso.');
}
