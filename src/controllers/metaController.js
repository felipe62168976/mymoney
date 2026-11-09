const db = require('../../database/database');
const { bad, dataValida, dinheiro } = require('../utils');

function validar(req) {
  const b = req.body || {};
  const nome = String(b.nome || '').trim();
  if (nome.length < 2 || nome.length > 80) return { erro: 'O nome da meta deve ter entre 2 e 80 caracteres.' };
  const valor_desejado = dinheiro(b.valor_desejado);
  if (!valor_desejado) return { erro: 'Informe um valor desejado maior que zero.' };
  const acumulado = b.valor_acumulado === undefined || b.valor_acumulado === '' ? 0 : dinheiro(b.valor_acumulado, { permiteZero: true });
  if (acumulado === null) return { erro: 'O valor acumulado é inválido.' };
  if (!dataValida(b.data_limite)) return { erro: 'Informe uma data limite válida.' };
  return { dados: { nome, valor_desejado, valor_acumulado: acumulado, data_limite: b.data_limite } };
}

module.exports = {
  listar(req, res) {
    res.json(
      db.prepare('SELECT id, nome, valor_desejado, valor_acumulado, data_limite FROM metas_financeiras WHERE usuario_id = ? ORDER BY data_limite ASC, id ASC')
        .all(req.session.userId)
    );
  },
  criar(req, res) {
    const { erro, dados } = validar(req);
    if (erro) return bad(res, erro);
    const r = db.prepare('INSERT INTO metas_financeiras (usuario_id, nome, valor_desejado, valor_acumulado, data_limite) VALUES (?, ?, ?, ?, ?)')
      .run(req.session.userId, dados.nome, dados.valor_desejado, dados.valor_acumulado, dados.data_limite);
    res.status(201).json({ id: r.lastInsertRowid });
  },
  atualizar(req, res) {
    const { erro, dados } = validar(req);
    if (erro) return bad(res, erro);
    const r = db.prepare('UPDATE metas_financeiras SET nome = ?, valor_desejado = ?, valor_acumulado = ?, data_limite = ? WHERE id = ? AND usuario_id = ?')
      .run(dados.nome, dados.valor_desejado, dados.valor_acumulado, dados.data_limite, Number(req.params.id), req.session.userId);
    if (!r.changes) return bad(res, 'Meta não encontrada.', 404);
    res.json({ ok: true });
  },
  depositar(req, res) {
    const valor = dinheiro((req.body || {}).valor);
    if (!valor) return bad(res, 'Informe um valor maior que zero.');
    const r = db.prepare('UPDATE metas_financeiras SET valor_acumulado = ROUND(valor_acumulado + ?, 2) WHERE id = ? AND usuario_id = ?')
      .run(valor, Number(req.params.id), req.session.userId);
    if (!r.changes) return bad(res, 'Meta não encontrada.', 404);
    res.json({ ok: true });
  },
  excluir(req, res) {
    const r = db.prepare('DELETE FROM metas_financeiras WHERE id = ? AND usuario_id = ?').run(Number(req.params.id), req.session.userId);
    if (!r.changes) return bad(res, 'Meta não encontrada.', 404);
    res.json({ ok: true });
  },
};
