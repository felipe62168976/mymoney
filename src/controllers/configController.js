const bcrypt = require('bcrypt');
const db = require('../../database/database');
const { wrap, bad } = require('../utils');

module.exports = {
  listarCategorias(req, res) {
    const tipo = req.query.tipo;
    const sql = 'SELECT id, nome, tipo FROM categorias WHERE usuario_id = ?' + (tipo === 'receita' || tipo === 'despesa' ? ' AND tipo = ?' : '') + ' ORDER BY tipo, nome COLLATE NOCASE';
    const params = tipo === 'receita' || tipo === 'despesa' ? [req.session.userId, tipo] : [req.session.userId];
    res.json(db.prepare(sql).all(...params));
  },
  criarCategoria(req, res) {
    const nome = String((req.body || {}).nome || '').trim();
    const tipo = (req.body || {}).tipo;
    if (nome.length < 2 || nome.length > 40) return bad(res, 'O nome da categoria deve ter entre 2 e 40 caracteres.');
    if (tipo !== 'receita' && tipo !== 'despesa') return bad(res, 'Tipo de categoria inválido.');
    try {
      const r = db.prepare('INSERT INTO categorias (usuario_id, nome, tipo) VALUES (?, ?, ?)').run(req.session.userId, nome, tipo);
      res.status(201).json({ id: r.lastInsertRowid });
    } catch (e) {
      if (String(e.code).startsWith('SQLITE_CONSTRAINT') || /UNIQUE constraint/.test(e.message)) return bad(res, 'Você já tem uma categoria com esse nome.', 409);
      throw e;
    }
  },
  excluirCategoria(req, res) {
    const id = Number(req.params.id);
    const cat = db.prepare('SELECT tipo FROM categorias WHERE id = ? AND usuario_id = ?').get(id, req.session.userId);
    if (!cat) return bad(res, 'Categoria não encontrada.', 404);
    const tabela = cat.tipo === 'receita' ? 'receitas' : 'despesas';
    const uso = db.prepare(`SELECT COUNT(*) AS n FROM ${tabela} WHERE categoria_id = ? AND usuario_id = ?`).get(id, req.session.userId).n;
    if (uso > 0) return bad(res, `Esta categoria está em uso por ${uso} lançamento(s). Edite ou exclua esses lançamentos antes.`, 409);
    db.prepare('DELETE FROM categorias WHERE id = ? AND usuario_id = ?').run(id, req.session.userId);
    res.json({ ok: true });
  },
  atualizarPerfil(req, res) {
    const nome = String((req.body || {}).nome || '').trim().replace(/\s+/g, ' ');
    if (nome.length < 3 || nome.length > 100) return bad(res, 'Informe o nome completo (3 a 100 caracteres).');
    db.prepare('UPDATE usuarios SET nome = ? WHERE id = ?').run(nome, req.session.userId);
    res.json({ ok: true });
  },
  alterarSenha: wrap(async (req, res) => {
    const { atual = '', nova = '', confirmacao = '' } = req.body || {};
    const u = db.prepare('SELECT senha_hash FROM usuarios WHERE id = ?').get(req.session.userId);
    if (!(await bcrypt.compare(String(atual), u.senha_hash))) return bad(res, 'A senha atual está incorreta.', 403);
    if (String(nova).length < 8) return bad(res, 'A nova senha deve ter pelo menos 8 caracteres.');
    if (Buffer.byteLength(String(nova)) > 72) return bad(res, 'A senha deve ter no máximo 72 caracteres.');
    if (nova !== confirmacao) return bad(res, 'A confirmação de senha não confere.');
    db.prepare('UPDATE usuarios SET senha_hash = ? WHERE id = ?').run(await bcrypt.hash(String(nova), 12), req.session.userId);
    res.json({ ok: true });
  }),
};
