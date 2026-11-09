(function () {
  'use strict';
  if (document.body.dataset.page !== 'configuracoes') return;
  const { $, api, esc, toast, mostrarErro, icon } = MM;

  async function carregarPerfil() {
    const u = await api('GET', '/api/auth/me');
    $('#p-nome').value = u.nome; $('#p-email').value = u.email;
  }

  $('#form-perfil').addEventListener('submit', async (e) => {
    e.preventDefault(); mostrarErro(e.target, '');
    try { await api('PUT', '/api/perfil', { nome: $('#p-nome').value }); toast('Perfil atualizado.'); const n = $('#user-nome'); if (n) n.textContent = $('#p-nome').value.trim(); }
    catch (err) { mostrarErro(e.target, err.message); }
  });

  $('#form-senha').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target; mostrarErro(f, '');
    try { await api('PUT', '/api/senha', { atual: f.atual.value, nova: f.nova.value, confirmacao: f.confirmacao.value }); f.reset(); toast('Senha alterada.'); }
    catch (err) { mostrarErro(f, err.message); }
  });

  async function carregarCategorias() {
    const cats = await api('GET', '/api/categorias');
    ['receita', 'despesa'].forEach((t) => {
      $('#cat-' + t).innerHTML = cats.filter((c) => c.tipo === t).map((c) => `
        <li><span>${esc(c.nome)}</span><button class="icon-btn perigo" type="button" data-id="${c.id}" data-nome="${esc(c.nome)}" aria-label="Excluir categoria ${esc(c.nome)}">${icon('trash')}</button></li>`).join('');
    });
  }

  $('#form-categoria').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target; mostrarErro(f, '');
    try { await api('POST', '/api/categorias', { nome: f.nome.value, tipo: f.tipo.value }); f.nome.value = ''; toast('Categoria adicionada.'); carregarCategorias(); }
    catch (err) { mostrarErro(f, err.message); }
  });

  ['#cat-receita', '#cat-despesa'].forEach((s) => $(s).addEventListener('click', async (e) => {
    const b = e.target.closest('button[data-id]');
    if (!b || !confirm(`Excluir a categoria "${b.dataset.nome}"?`)) return;
    try { await api('DELETE', '/api/categorias/' + b.dataset.id); toast('Categoria excluída.'); carregarCategorias(); }
    catch (err) { toast(err.message, 'erro'); }
  }));

  carregarPerfil().catch((e) => toast(e.message, 'erro'));
  carregarCategorias().catch((e) => toast(e.message, 'erro'));
})();
