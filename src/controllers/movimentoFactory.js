// Fábrica de controllers para receitas e despesas (mesma estrutura, tabelas diferentes).
const db = require('../../database/database');
const { bad, dataValida, dinheiro } = require('../utils');

module.exports = function criarController({ tabela, tipo, rotulo, formas }) {
  // `tabela` vem de constantes do código (nunca de entrada do usuário)
  function validar(req) {
    const b = req.body || {};
    const descricao = String(b.descricao || '').trim();
    if (descricao.length < 2 || descricao.length > 120) return { erro: 'A descrição deve ter entre 2 e 120 caracteres.' };
    const valor = dinheiro(b.valor);
    if (!valor) return { erro: 'Informe um valor maior que zero.' };
    if (!dataValida(b.data)) return { erro: 'Informe uma data válida.' };
    const forma = String(b.forma || '').trim();
    if (!formas.includes(forma)) return { erro: 'Selecione uma forma válida.' };
    const cat = db
      .prepare('SELECT id FROM categorias WHERE id = ? AND usuario_id = ? AND tipo = ?')
      .get(Number(b.categoria_id), req.session.userId, tipo);
    if (!cat) return { erro: 'Selecione uma categoria válida.' };
    return { dados: { descricao, valor, data: b.data, forma, categoria_id: cat.id } };
  }

  const SELECT = `SELECT t.id, t.descricao, t.valor, t.data, t.forma, t.categoria_id, c.nome AS categoria
                  FROM ${tabela} t JOIN categorias c ON c.id = t.categoria_id`;

  return {
    formas,
    listar(req, res) {
      const rows = db.prepare(`${SELECT} WHERE t.usuario_id = ? ORDER BY t.data DESC, t.id DESC LIMIT 1000`).all(req.session.userId);
      res.json(rows.map((r) => ({ ...r, tipo })));
    },
    criar(req, res) {
      const { erro, dados } = validar(req);
      if (erro) return bad(res, erro);
      const r = db
        .prepare(`INSERT INTO ${tabela} (usuario_id, categoria_id, descricao, valor, data, forma) VALUES (?, ?, ?, ?, ?, ?)`)
        .run(req.session.userId, dados.categoria_id, dados.descricao, dados.valor, dados.data, dados.forma);
      res.status(201).json({ id: r.lastInsertRowid });
    },
    atualizar(req, res) {
      const id = Number(req.params.id);
      const existe = db.prepare(`SELECT 1 FROM ${tabela} WHERE id = ? AND usuario_id = ?`).get(id, req.session.userId);
      if (!existe) return bad(res, `${rotulo} não encontrada.`, 404);
      const { erro, dados } = validar(req);
      if (erro) return bad(res, erro);
      db.prepare(`UPDATE ${tabela} SET categoria_id = ?, descricao = ?, valor = ?, data = ?, forma = ? WHERE id = ? AND usuario_id = ?`)
        .run(dados.categoria_id, dados.descricao, dados.valor, dados.data, dados.forma, id, req.session.userId);
      res.json({ ok: true });
    },
    excluir(req, res) {
      const r = db.prepare(`DELETE FROM ${tabela} WHERE id = ? AND usuario_id = ?`).run(Number(req.params.id), req.session.userId);
      if (!r.changes) return bad(res, `${rotulo} não encontrada.`, 404);
      res.json({ ok: true });
    },
  };
};
