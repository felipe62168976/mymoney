// Lista unificada de receitas + despesas com filtros, pesquisa e paginação.
const router = require('express').Router();
const db = require('../../database/database');
const { dataValida } = require('../utils');

const UNIAO = `(
  SELECT 'receita' AS tipo, r.id, r.descricao, r.valor, r.data, r.forma, r.categoria_id, c.nome AS categoria
    FROM receitas r JOIN categorias c ON c.id = r.categoria_id WHERE r.usuario_id = @u
  UNION ALL
  SELECT 'despesa' AS tipo, d.id, d.descricao, d.valor, d.data, d.forma, d.categoria_id, c.nome AS categoria
    FROM despesas d JOIN categorias c ON c.id = d.categoria_id WHERE d.usuario_id = @u
)`;

router.get('/', (req, res) => {
  const q = req.query;
  const filtros = [];
  const p = { u: req.session.userId };

  if (dataValida(q.inicio)) { filtros.push('data >= @inicio'); p.inicio = q.inicio; }
  if (dataValida(q.fim)) { filtros.push('data <= @fim'); p.fim = q.fim; }
  if (/^\d+$/.test(String(q.categoria || ''))) { filtros.push('categoria_id = @cat'); p.cat = Number(q.categoria); }
  if (q.tipo === 'receita' || q.tipo === 'despesa') { filtros.push('tipo = @tipo'); p.tipo = q.tipo; }
  if (q.q && String(q.q).trim()) {
    filtros.push("descricao LIKE @busca ESCAPE '\\'");
    p.busca = '%' + String(q.q).trim().slice(0, 100).replace(/[\\%_]/g, '\\$&') + '%';
  }
  const where = filtros.length ? 'WHERE ' + filtros.join(' AND ') : '';

  const limite = Math.min(Math.max(parseInt(q.limite, 10) || 15, 1), 100);
  const pagina = Math.max(parseInt(q.pagina, 10) || 1, 1);

  const totais = db.prepare(
    `SELECT COUNT(*) AS total,
            ROUND(COALESCE(SUM(CASE WHEN tipo = 'receita' THEN valor END), 0), 2) AS receitas,
            ROUND(COALESCE(SUM(CASE WHEN tipo = 'despesa' THEN valor END), 0), 2) AS despesas
       FROM ${UNIAO} ${where}`
  ).get(p);

  const itens = db.prepare(`SELECT * FROM ${UNIAO} ${where} ORDER BY data DESC, id DESC LIMIT @limite OFFSET @offset`)
    .all({ ...p, limite, offset: (pagina - 1) * limite });

  res.json({
    itens,
    pagina,
    paginas: Math.max(Math.ceil(totais.total / limite), 1),
    total: totais.total,
    totais: { receitas: totais.receitas, despesas: totais.despesas, saldo: Math.round((totais.receitas - totais.despesas) * 100) / 100 },
  });
});

module.exports = router;
