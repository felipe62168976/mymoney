(function () {
  'use strict';
  if (document.body.dataset.page !== 'metas') return;
  const { $, api, brl, dataBR, valorInput, parseBRL, esc, hojeISO, toast, abrirDialog, fecharDialog, mostrarErro, icon } = MM;
  const lista = $('#lista');
  const dlg = $('#modal');
  const form = $('#form-meta');
  const dlgDep = $('#modal-dep');
  const formDep = $('#form-dep');
  let metas = [];
  let editandoId = null;
  let depositoId = null;

  function diasAte(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
    return Math.round((new Date(y, m - 1, d) - hoje) / 86400000);
  }

  function render() {
    $('#vazio').hidden = metas.length > 0;
    lista.innerHTML = metas.map((m) => {
      const pct = Math.min(100, (m.valor_acumulado / m.valor_desejado) * 100);
      const concluida = m.valor_acumulado >= m.valor_desejado;
      const dias = diasAte(m.data_limite);
      let prazo;
      if (concluida) prazo = 'Meta alcançada';
      else if (dias < 0) prazo = `Prazo vencido há ${-dias} dia(s)`;
      else if (dias === 0) prazo = 'O prazo termina hoje';
      else prazo = `Faltam ${dias} dia(s)`;
      const falta = Math.max(0, m.valor_desejado - m.valor_acumulado);
      return `
      <article class="card meta ${concluida ? 'concluida' : ''} ${!concluida && dias < 0 ? 'vencida' : ''}">
        <header><h3>${esc(m.nome)}</h3>
          <div class="acoes">
            <button class="icon-btn" type="button" data-act="editar" data-id="${m.id}" aria-label="Editar meta">${icon('edit')}</button>
            <button class="icon-btn perigo" type="button" data-act="excluir" data-id="${m.id}" aria-label="Excluir meta">${icon('trash')}</button>
          </div></header>
        <div class="meta-valores"><strong>${brl(m.valor_acumulado)}</strong><span>de ${brl(m.valor_desejado)}</span></div>
        <div class="progresso" role="progressbar" aria-valuenow="${pct.toFixed(0)}" aria-valuemin="0" aria-valuemax="100"><div style="width:${pct.toFixed(1)}%"></div></div>
        <div class="meta-info"><span>${pct.toFixed(0)}% concluído${concluida ? '' : ' · faltam ' + brl(falta)}</span><span>${prazo} (${dataBR(m.data_limite)})</span></div>
        <button class="btn btn-secondary btn-block" type="button" data-act="depositar" data-id="${m.id}">${icon('plus')}<span>Adicionar valor</span></button>
      </article>`;
    }).join('');
  }

  async function carregar() {
    try { metas = await api('GET', '/api/metas'); render(); } catch (e) { toast(e.message, 'erro'); }
  }

  function abrir(meta) {
    editandoId = meta ? meta.id : null;
    form.reset();
    mostrarErro(form, '');
    $('#modal-titulo').textContent = meta ? 'Editar meta' : 'Nova meta';
    $('#g-nome').value = meta ? meta.nome : '';
    $('#g-desejado').value = meta ? valorInput(meta.valor_desejado) : '';
    $('#g-acumulado').value = meta ? valorInput(meta.valor_acumulado) : '0,00';
    $('#g-data').value = meta ? meta.data_limite : hojeISO();
    abrirDialog(dlg);
    $('#g-nome').focus();
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    mostrarErro(form, '');
    const desejado = parseBRL($('#g-desejado').value);
    const acumulado = $('#g-acumulado').value.trim() === '' ? 0 : parseBRL($('#g-acumulado').value);
    if (!(desejado > 0)) return mostrarErro(form, 'Informe o valor desejado. Exemplo: 5.000,00');
    if (Number.isNaN(acumulado)) return mostrarErro(form, 'O valor acumulado é inválido. Exemplo: 350,00');
    const corpo = { nome: $('#g-nome').value, valor_desejado: desejado, valor_acumulado: acumulado, data_limite: $('#g-data').value };
    try {
      if (editandoId) await api('PUT', '/api/metas/' + editandoId, corpo); else await api('POST', '/api/metas', corpo);
      fecharDialog(dlg); toast(editandoId ? 'Meta atualizada.' : 'Meta criada.'); carregar();
    } catch (err) { mostrarErro(form, err.message); }
  });

  formDep.addEventListener('submit', async (e) => {
    e.preventDefault();
    mostrarErro(formDep, '');
    const v = parseBRL($('#d-valor').value);
    if (!(v > 0)) return mostrarErro(formDep, 'Informe um valor maior que zero.');
    try { await api('POST', `/api/metas/${depositoId}/depositar`, { valor: v }); fecharDialog(dlgDep); toast('Valor adicionado à meta.'); carregar(); }
    catch (err) { mostrarErro(formDep, err.message); }
  });

  lista.addEventListener('click', async (e) => {
    const b = e.target.closest('button[data-act]');
    if (!b) return;
    const meta = metas.find((m) => String(m.id) === b.dataset.id);
    if (!meta) return;
    if (b.dataset.act === 'editar') return abrir(meta);
    if (b.dataset.act === 'depositar') {
      depositoId = meta.id; formDep.reset(); mostrarErro(formDep, '');
      $('#dep-titulo').textContent = 'Adicionar valor: ' + meta.nome;
      abrirDialog(dlgDep); return $('#d-valor').focus();
    }
    if (!confirm(`Excluir a meta "${meta.nome}"?`)) return;
    try { await api('DELETE', '/api/metas/' + meta.id); toast('Meta excluída.'); carregar(); } catch (err) { toast(err.message, 'erro'); }
  });

  $('#btn-novo').addEventListener('click', () => abrir(null));
  carregar();
})();
