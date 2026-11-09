const bcrypt = require('bcrypt');
const db = require('../../database/database');
const { wrap, bad, emailValido } = require('../utils');

const CATEGORIAS_PADRAO = {
  receita: ['Salário', 'Freelance', 'Investimentos', 'Vendas', 'Outros'],
  despesa: ['Alimentação', 'Moradia', 'Transporte', 'Saúde', 'Educação', 'Lazer', 'Contas e serviços', 'Compras', 'Outros'],
};

// Hash fixo usado para equalizar o tempo de resposta quando o e-mail não existe
const HASH_FALSO = bcrypt.hashSync('mymoney-senha-inexistente', 12);

const regenerar = (req) => new Promise((ok, fail) => req.session.regenerate((e) => (e ? fail(e) : ok())));
const salvar = (req) => new Promise((ok, fail) => req.session.save((e) => (e ? fail(e) : ok())));

const cadastrar = wrap(async (req, res) => {
  const b = req.body || {};
  const nome = String(b.nome || '').trim().replace(/\s+/g, ' ');
  const email = String(b.email || '').trim().toLowerCase();
  const senha = String(b.senha || '');
  const confirmacao = String(b.confirmacao || '');

  if (nome.length < 3 || nome.length > 100) return bad(res, 'Informe o nome completo (3 a 100 caracteres).');
  if (!emailValido(email)) return bad(res, 'Informe um e-mail válido.');
  if (senha.length < 8) return bad(res, 'A senha deve ter pelo menos 8 caracteres.');
  if (Buffer.byteLength(senha) > 72) return bad(res, 'A senha deve ter no máximo 72 caracteres.');
  if (senha !== confirmacao) return bad(res, 'A confirmação de senha não confere.');

  if (db.prepare('SELECT 1 FROM usuarios WHERE email = ?').get(email)) {
    return bad(res, 'Já existe uma conta com este e-mail.', 409);
  }

  const hash = await bcrypt.hash(senha, 12);
  const criar = db.transaction(() => {
    const id = db.prepare('INSERT INTO usuarios (nome, email, senha_hash) VALUES (?, ?, ?)').run(nome, email, hash).lastInsertRowid;
    const ins = db.prepare('INSERT INTO categorias (usuario_id, nome, tipo) VALUES (?, ?, ?)');
    for (const [tipo, nomes] of Object.entries(CATEGORIAS_PADRAO)) nomes.forEach((n) => ins.run(id, n, tipo));
    return Number(id);
  });
  const userId = criar();

  await regenerar(req);
  req.session.userId = userId;
  await salvar(req);
  res.status(201).json({ ok: true });
});

const entrar = wrap(async (req, res) => {
  const email = String((req.body || {}).email || '').trim().toLowerCase();
  const senha = String((req.body || {}).senha || '');
  const u = db.prepare('SELECT id, senha_hash FROM usuarios WHERE email = ?').get(email);
  const ok = await bcrypt.compare(senha, u ? u.senha_hash : HASH_FALSO);
  if (!u || !ok) return bad(res, 'E-mail ou senha incorretos.', 401);

  await regenerar(req);
  req.session.userId = u.id;
  await salvar(req);
  res.json({ ok: true });
});

const sair = (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('mymoney.sid');
    res.json({ ok: true });
  });
};

const eu = (req, res) => {
  const u = db.prepare('SELECT id, nome, email FROM usuarios WHERE id = ?').get(req.session.userId);
  if (!u) return bad(res, 'Sessão inválida.', 401);
  res.json(u);
};

module.exports = { cadastrar, entrar, sair, eu };
