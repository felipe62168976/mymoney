(function () {
  'use strict';
  if (document.body.dataset.page !== 'relatorios') return;
  const { $, api, brl, mesBR, esc, toast } = MM;
  const pad = (n) => String(n).padStart(2, '0');
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  const PRESETS = {
    mes: () => { const h = new Date(); return [new Date(h.getFullYear(), h.getMonth(), 1), h]; },
    '6m': () => { const h = new Date(); return [new Date(h.getFullYear(), h.getMonth() - 5, 1), h]; },
    ano: () => { const h = new Date(); return [new Date(h.getFullYear(), 0, 1), h]; },
  };

  function toggle(id, tem) { $('#' + id + '-vazio').hidden = tem; $('#' + id).parentElement.hidden = !tem; }

  async function gerar() {
    const inicio = $('#r-inicio').value, fim = $('#r-fim').value;
    let d;
    try { d = await api('GET', `/api/relatorios/periodo?inicio=${inicio}&fim=${fim}`); } catch (e) { return toast(e.message, 'erro'); }
    $('#r-inicio').value = d.inicio; $('#r-fim').value = d.fim;
    $('#t-receitas').textContent = brl(d.totais.receitas);
    $('#t-despesas').textContent = brl(d.totais.despesas);
    $('#t-saldo').textContent = brl(d.totais.saldo);
    $('#t-saldo').classList.toggle('neg', d.totais.saldo < 0);

    const meses = d.mensal.map((m) => mesBR(m.mes));
    const tem = d.mensal.some((m) => m.receitas || m.despesas);
    ['g-receitas', 'g-despesas', 'g-comparacao', 'g-saldo'].forEach((id) => toggle(id, tem));
    if (tem) {
      Graficos.barras('g-receitas', meses, [{ label: 'Receitas', data: d.mensal.map((m) => m.receitas), cor: 'verde' }]);
      Graficos.barras('g-despesas', meses, [{ label: 'Despesas', data: d.mensal.map((m) => m.despesas), cor: 'vermelho' }]);
      Graficos.barras('g-comparacao', meses, [
        { label: 'Receitas', data: d.mensal.map((m) => m.receitas), cor: 'verde' },
        { label: 'Despesas', data: d.mensal.map((m) => m.despesas), cor: 'vermelho' },
      ]);
      Graficos.linha('g-saldo', meses, [{ label: 'Saldo acumulado', data: d.mensal.map((m) => m.saldo_acumulado), cor: 'verde' }]);
    }
    const cats = d.despesas_por_categoria;
    toggle('g-categorias', cats.length > 0);
    if (cats.length) Graficos.rosca('g-categorias', cats.map((c) => c.categoria), cats.map((c) => c.total));

    const totalDesp = cats.reduce((s, c) => s + c.total, 0);
    $('#cat-tabela').innerHTML = cats.map((c) => `<tr><td>${esc(c.categoria)}</td><td class="num">${brl(c.total)}</td><td class="num">${((c.total / totalDesp) * 100).toFixed(1).replace('.', ',')}%</td></tr>`).join('');
    $('#mes-tabela').innerHTML = d.mensal.map((m) => `<tr><td>${mesBR(m.mes)}</td><td class="num receita">${brl(m.receitas)}</td><td class="num despesa">${brl(m.despesas)}</td><td class="num ${m.resultado < 0 ? 'despesa' : 'receita'}">${brl(m.resultado)}</td><td class="num">${brl(m.saldo_acumulado)}</td></tr>`).join('');
  }

  $('#form-periodo').addEventListener('submit', (e) => { e.preventDefault(); gerar(); });
  $('#r-preset').addEventListener('change', (e) => {
    const f = PRESETS[e.target.value]; if (!f) return;
    const [a, b] = f(); $('#r-inicio').value = iso(a); $('#r-fim').value = iso(b); gerar();
  });
  const [a, b] = PRESETS['6m']();
  $('#r-inicio').value = iso(a); $('#r-fim').value = iso(b);
  gerar();
})();
