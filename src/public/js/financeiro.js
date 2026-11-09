/* Receitas, Despesas e Movimentações (mesma lógica de listagem, filtros e formulário) */
(function () {
  'use strict';
  const page = document.body.dataset.page;
  if (!['receitas', 'despesas', 'movimentacoes'].includes(page)) return;
  const { $, api, brl, dataBR, valorInput, parseBRL, esc, hojeISO, toast, abrirDialog, fecharDialog, mostrarErro, icon } = MM;

  const FORMAS = {
    receita: ['Dinheiro', 'PIX', 'Transferência', 'Depósito', 'Cheque', 'Outro'],
    despesa: ['Dinheiro', 'PIX', 'Cartão de crédito', 'Cartão de débito', 'Boleto', 'Transferência', 'Outro'],
  };
  const tipoFixo = document.body.dataset.tipo || ''; // 'receita' | 'despesa' | '' (movimentações)
  const ENDPOINT = { receita: '/api/receitas', despesa: '/api/despesas' };
  let categorias = [];
  let pagina = 1;
  let editando = null; // { id, tipo }

  const dlg = $('#modal');
  const form = $('#form-mov');
  const tbody = $('#tbody');

  // ---------- Categorias ----------
  async function carregarCategorias() {
    categorias = await api('GET', '/api/categorias');
    const sel = $('#f-categoria');
    const grupo = (t, nome) => `<optgroup label="${nome}">${categorias.filter((c) => c.tipo === t).map((c) => `<option value="${c.id}">${esc(c.nome)}</option>`).join('')}</optgroup>`;
    if (tipoFixo) sel.innerHTML = '<option value="">Todas as categorias</option>' + categorias.filter((c) => c.tipo === tipoFixo).map((c) => `<option value="${c.id}">${esc(c.nome)}</option>`).join('');
    else sel.innerHTML = '<option value="">Todas as categorias</option>' + grupo('receita', 'Receitas') + grupo('despesa', 'Despesas');
  }

  // ---------- Listagem ----------
  function filtros() {
    const p = new URLSearchParams();
    const add = (k, v) => { if (v) p.set(k, v); };
    add('inicio', $('#f-inicio').value);
    add('fim', $('#f-fim').value);
    add('categoria', $('#f-categoria').value);
    add('q', $('#f-q').value.trim());
    add('tipo', tipoFixo || ($('#f-tipo') ? $('#f-tipo').value : ''));
    p.set('pagina', pagina);
    return p;
  }

  async function carregar() {
    let r;
    try { r = await api('GET', '/api/movimentacoes?' + filtros()); } catch (e) { return toast(e.message, 'erro'); }
    if (pagina > r.paginas) { pagina = r.paginas; return carregar(); }
    const mov = page === 'movimentacoes';
    $('#vazio').hidden = r.itens.length > 0;
    $('#tabela').hidden = r.itens.length === 0;
    tbody.innerHTML = r.itens.map((m) => `
      <tr><td>${dataBR(m.data)}</td><td>${esc(m.descricao)}</td><td>${esc(m.categoria)}</td><td>${esc(m.forma)}</td>
      ${mov ? `<td><span class="badge ${m.tipo}">${m.tipo === 'receita' ? 'Receita' : 'Despesa'}</span></td>` : ''}
      <td class="num ${m.tipo}">${m.tipo === 'receita' ? '+' : '−'} ${brl(m.valor)}</td>
      <td class="acoes">
        <button class="icon-btn" type="button" data-act="editar" data-id="${m.id}" data-tipo="${m.tipo}" aria-label="Editar">${icon('edit')}</button>
        <button class="icon-btn perigo" type="button" data-act="excluir" data-id="${m.id}" data-tipo="${m.tipo}" aria-label="Excluir">${icon('trash')}</button>
      </td></tr>`).join('');
    tbody._itens = r.itens;

    const t = r.totais;
    const partes = [];
    if (tipoFixo !== 'despesa') partes.push(`<span class="receita">Receitas: <strong>${brl(t.receitas)}</strong></span>`);
    if (tipoFixo !== 'receita') partes.push(`<span class="despesa">Despesas: <strong>${brl(t.despesas)}</strong></span>`);
    if (!tipoFixo) partes.push(`<span class="${t.saldo < 0 ? 'despesa' : 'receita'}">Saldo: <strong>${brl(t.saldo)}</strong></span>`);
    $('#resumo').innerHTML = `<span>${r.total} registro(s)</span>${partes.join('')}`;
    $('#pag-info').textContent = `Página ${r.pagina} de ${r.paginas}`;
    $('#pag-ant').disabled = r.pagina <= 1;
    $('#pag-prox').disabled = r.pagina >= r.paginas;
  }

  // ---------- Formulário ----------
  function opcoesCategoria(tipo, selecionada) {
    $('#m-categoria').innerHTML = categorias.filter((c) => c.tipo === tipo)
      .map((c) => `<option value="${c.id}" ${c.id === selecionada ? 'selected' : ''}>${esc(c.nome)}</option>`).join('');
  }
  function ajustarTipo(tipo, selecionada, forma) {
    opcoesCategoria(tipo, selecionada);
    $('#m-forma').innerHTML = FORMAS[tipo].map((f) => `<option ${f === forma ? 'selected' : ''}>${f}</option>`).join('');
    $('#lbl-forma').textContent = tipo === 'receita' ? 'Forma de recebimento' : 'Forma de pagamento';
    $('#modal-titulo').textContent = (editando ? 'Editar ' : 'Nova ') + (tipo === 'receita' ? 'receita' : 'despesa');
  }
  function abrir(tipo, registro) {
    editando = registro ? { id: registro.id, tipo } : null;
    form.reset();
    mostrarErro(form, '');
    const selTipo = $('#m-tipo');
    if (selTipo) { selTipo.value = tipo; selTipo.disabled = !!registro; }
    ajustarTipo(tipo, registro && registro.categoria_id, registro && registro.forma);
    $('#m-descricao').value = registro ? registro.descricao : '';
    $('#m-valor').value = registro ? valorInput(registro.valor) : '';
    $('#m-data').value = registro ? registro.data : hojeISO();
    abrirDialog(dlg);
    $('#m-descricao').focus();
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    mostrarErro(form, '');
    const tipo = editando ? editando.tipo : (tipoFixo || $('#m-tipo').value);
    const valor = parseBRL($('#m-valor').value);
    if (!(valor > 0)) return mostrarErro(form, 'Informe um valor maior que zero. Exemplo: 1.250,90');
    const corpo = { descricao: $('#m-descricao').value, valor, categoria_id: Number($('#m-categoria').value), data: $('#m-data').value, forma: $('#m-forma').value };
    const btn = $('button[type=submit]', form);
    btn.disabled = true;
    try {
      if (editando) await api('PUT', `${ENDPOINT[tipo]}/${editando.id}`, corpo);
      else await api('POST', ENDPOINT[tipo], corpo);
      fecharDialog(dlg);
      toast(editando ? 'Alterações salvas.' : (tipo === 'receita' ? 'Receita cadastrada.' : 'Despesa cadastrada.'));
      carregar();
    } catch (err) { mostrarErro(form, err.message); }
    finally { btn.disabled = false; }
  });

  if ($('#m-tipo')) $('#m-tipo').addEventListener('change', (e) => ajustarTipo(e.target.value));

  // ---------- Ações da tabela ----------
  tbody.addEventListener('click', async (e) => {
    const b = e.target.closest('button[data-act]');
    if (!b) return;
    const item = (tbody._itens || []).find((m) => String(m.id) === b.dataset.id && m.tipo === b.dataset.tipo);
    if (!item) return;
    if (b.dataset.act === 'editar') return abrir(item.tipo, item);
    if (!confirm(`Excluir "${item.descricao}" (${brl(item.valor)})? Esta ação não pode ser desfeita.`)) return;
    try { await api('DELETE', `${ENDPOINT[item.tipo]}/${item.id}`); toast('Lançamento excluído.'); carregar(); }
    catch (err) { toast(err.message, 'erro'); }
  });

  // ---------- Filtros e paginação ----------
  let tempo;
  const refiltrar = () => { pagina = 1; carregar(); };
  ['#f-inicio', '#f-fim', '#f-categoria', '#f-tipo'].forEach((s) => { const el = $(s); if (el) el.addEventListener('change', refiltrar); });
  $('#filtros').addEventListener('submit', (e) => e.preventDefault());
  $('#f-q').addEventListener('input', () => { clearTimeout(tempo); tempo = setTimeout(refiltrar, 300); });
  $('#btn-limpar').addEventListener('click', () => { $('#filtros').reset(); refiltrar(); });
  $('#pag-ant').addEventListener('click', () => { pagina--; carregar(); });
  $('#pag-prox').addEventListener('click', () => { pagina++; carregar(); });
  $('#btn-novo').addEventListener('click', () => abrir(tipoFixo || 'despesa'));

  carregarCategorias().then(carregar).catch((e) => toast(e.message, 'erro'));
})();
