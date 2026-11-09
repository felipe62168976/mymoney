(function () {
  'use strict';
  if (document.body.dataset.page !== 'dashboard') return;
  const { $, api, brl, dataBR, mesBR, esc, toast } = MM;

  function vazio(id, temDados) {
    $('#' + id + '-vazio').hidden = temDados;
    $('#' + id).parentElement.hidden = !temDados;
  }

  async function carregar() {
    let d;
    try { d = await api('GET', '/api/relatorios/dashboard'); } catch (e) { return toast(e.message, 'erro'); }

    $('#ind-saldo').textContent = brl(d.saldo_atual);
    $('#ind-saldo').classList.toggle('neg', d.saldo_atual < 0);
    $('#ind-receitas').textContent = brl(d.total_receitas);
    $('#ind-despesas').textContent = brl(d.total_despesas);
    $('#ind-mes').textContent = brl(d.saldo_mes);
    $('#ind-mes').classList.toggle('neg', d.saldo_mes < 0);
    $('#ind-mes-detalhe').textContent = `Receitas ${brl(d.receitas_mes)} · Despesas ${brl(d.despesas_mes)}`;

    const meses = d.mensal.map((m) => mesBR(m.mes));
    const temMov = d.mensal.some((m) => m.receitas || m.despesas);
    vazio('graf-comparacao', temMov);
    vazio('graf-evolucao', temMov);
    if (temMov) {
      Graficos.barras('graf-comparacao', meses, [
        { label: 'Receitas', data: d.mensal.map((m) => m.receitas), cor: 'verde' },
        { label: 'Despesas', data: d.mensal.map((m) => m.despesas), cor: 'vermelho' },
      ]);
      Graficos.linha('graf-evolucao', meses, [{ label: 'Saldo acumulado', data: d.mensal.map((m) => m.saldo_acumulado), cor: 'verde' }]);
    }
    const cats = d.despesas_por_categoria;
    vazio('graf-categorias', cats.length > 0);
    if (cats.length) Graficos.rosca('graf-categorias', cats.map((c) => c.categoria), cats.map((c) => c.total));

    const tb = $('#recentes');
    $('#recentes-vazio').hidden = d.recentes.length > 0;
    $('#recentes-tabela').hidden = d.recentes.length === 0;
    tb.innerHTML = d.recentes.map((m) => `
      <tr><td>${esc(m.descricao)}</td><td>${esc(m.categoria)}</td><td>${dataBR(m.data)}</td>
      <td><span class="badge ${m.tipo}">${m.tipo === 'receita' ? 'Receita' : 'Despesa'}</span></td>
      <td class="num ${m.tipo}">${m.tipo === 'receita' ? '+' : '−'} ${brl(m.valor)}</td></tr>`).join('');
  }
  carregar();
})();
