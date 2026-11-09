// Dados agregados para dashboard e relatórios (sempre filtrados pelo usuário logado).
const router = require('express').Router();
const db = require('../../database/database');
const { dataValida, pad, hojeISO } = require('../utils');

const r2 = (n) => Math.round((n || 0) * 100) / 100;

function soma(tabela, uid, ate, de) {
  let sql = `SELECT COALESCE(SUM(valor), 0) AS t FROM ${tabela} WHERE usuario_id = ?`;
  const p = [uid];
  if (de) { sql += ' AND data >= ?'; p.push(de); }
  if (ate) { sql += ' AND data <= ?'; p.push(ate); }
  return r2(db.prepare(sql).get(...p).t);
}

function somaAntes(tabela, uid, data) {
  return r2(db.prepare(`SELECT COALESCE(SUM(valor), 0) AS t FROM ${tabela} WHERE usuario_id = ? AND data < ?`).get(uid, data).t);
}

function porMes(tabela, uid, de, ate) {
  const m = {};
  db.prepare(`SELECT strftime('%Y-%m', data) AS mes, SUM(valor) AS t FROM ${tabela} WHERE usuario_id = ? AND data >= ? AND data <= ? GROUP BY mes`)
    .all(uid, de, ate).forEach((r) => { m[r.mes] = r2(r.t); });
  return m;
}

function porCategoria(tabela, uid, de, ate) {
  return db.prepare(
    `SELECT c.nome AS categoria, ROUND(SUM(t.valor), 2) AS total
       FROM ${tabela} t JOIN categorias c ON c.id = t.categoria_id
      WHERE t.usuario_id = ? AND t.data >= ? AND t.data <= ?
      GROUP BY c.id ORDER BY total DESC`
  ).all(uid, de, ate);
}

function listaMeses(inicioISO, fimISO) {
  const [ya, ma] = inicioISO.split('-').map(Number);
  const [yb, mb] = fimISO.split('-').map(Number);
  const out = [];
  for (let y = ya, m = ma; y < yb || (y === yb && m <= mb); m++) {
    if (m > 12) { m = 1; y++; }
    out.push(`${y}-${pad(m)}`);
    if (out.length > 600) break;
  }
  return out;
}

function serieMensal(uid, de, ate) {
  const rec = porMes('receitas', uid, de, ate);
  const des = porMes('despesas', uid, de, ate);
  let saldo = r2(somaAntes('receitas', uid, de) - somaAntes('despesas', uid, de));
  return listaMeses(de, ate).map((mes) => {
    const receitas = rec[mes] || 0;
    const despesas = des[mes] || 0;
    saldo = r2(saldo + receitas - despesas);
    return { mes, receitas, despesas, resultado: r2(receitas - despesas), saldo_acumulado: saldo };
  });
}

router.get('/dashboard', (req, res) => {
  const uid = req.session.userId;
  const hoje = new Date();
  const y = hoje.getFullYear();
  const m = hoje.getMonth() + 1;
  const mesAtual = `${y}-${pad(m)}`;
  const iniMes = `${mesAtual}-01`;
  const fimMes = `${mesAtual}-31`;

  const totalReceitas = soma('receitas', uid);
  const totalDespesas = soma('despesas', uid);
  const recMes = soma('receitas', uid, fimMes, iniMes);
  const desMes = soma('despesas', uid, fimMes, iniMes);

  const d6 = new Date(y, m - 1 - 5, 1);
  const inicio6 = `${d6.getFullYear()}-${pad(d6.getMonth() + 1)}-01`;

  const recentes = db.prepare(
    `SELECT * FROM (
       SELECT 'receita' AS tipo, r.id, r.descricao, r.valor, r.data, c.nome AS categoria, r.criado_em
         FROM receitas r JOIN categorias c ON c.id = r.categoria_id WHERE r.usuario_id = @u
       UNION ALL
       SELECT 'despesa', d.id, d.descricao, d.valor, d.data, c.nome, d.criado_em
         FROM despesas d JOIN categorias c ON c.id = d.categoria_id WHERE d.usuario_id = @u
     ) ORDER BY data DESC, criado_em DESC, id DESC LIMIT 8`
  ).all({ u: uid });

  res.json({
    saldo_atual: r2(totalReceitas - totalDespesas),
    total_receitas: totalReceitas,
    total_despesas: totalDespesas,
    saldo_mes: r2(recMes - desMes),
    receitas_mes: recMes,
    despesas_mes: desMes,
    mes_atual: mesAtual,
    despesas_por_categoria: porCategoria('despesas', uid, iniMes, fimMes),
    mensal: serieMensal(uid, inicio6, fimMes),
    recentes,
  });
});

router.get('/periodo', (req, res) => {
  const uid = req.session.userId;
  const hoje = hojeISO();
  const ano = hoje.slice(0, 4);
  let de = dataValida(req.query.inicio) ? req.query.inicio : `${ano}-01-01`;
  let ate = dataValida(req.query.fim) ? req.query.fim : hoje;
  if (de > ate) [de, ate] = [ate, de];

  const receitas = soma('receitas', uid, ate, de);
  const despesas = soma('despesas', uid, ate, de);
  res.json({
    inicio: de,
    fim: ate,
    totais: { receitas, despesas, saldo: r2(receitas - despesas) },
    mensal: serieMensal(uid, de, ate),
    despesas_por_categoria: porCategoria('despesas', uid, de, ate),
    receitas_por_categoria: porCategoria('receitas', uid, de, ate),
  });
});

module.exports = router;
