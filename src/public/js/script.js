/* MyMoney - utilitários comuns, shell (menu lateral), tema e formulários de autenticação */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  // ---------- Ícones (SVG inline, sem bibliotecas externas) ----------
  const ICONS = {
    wallet: '<path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"/><path d="M4 6v12c0 1.1.9 2 2 2h14v-4"/><path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z"/>',
    grid: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
    up: '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>',
    down: '<polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/>',
    list: '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>',
    target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    chart: '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
    settings: '<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>',
    moon: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
    sun: '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
    menu: '<line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>',
    plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    edit: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>',
    trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
    eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    coins: '<circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/>',
    x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  };
  const icon = (n) => `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ''}</svg>`;
  const aplicarIcones = (r = document) => $$('[data-icon]', r).forEach((el) => { el.innerHTML = icon(el.dataset.icon); });

  // ---------- Formatação (moeda e datas no padrão brasileiro) ----------
  const fmtBRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  const brl = (v) => fmtBRL.format(Number(v) || 0);
  const dataBR = (iso) => (iso && /^\d{4}-\d{2}-\d{2}/.test(iso) ? iso.slice(8, 10) + '/' + iso.slice(5, 7) + '/' + iso.slice(0, 4) : '');
  const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const mesBR = (ym) => MESES[Number(ym.slice(5, 7)) - 1] + '/' + ym.slice(2, 4);
  const valorInput = (n) => Number(n).toFixed(2).replace('.', ',');
  // Aceita "1.234,56", "1234,56", "1234.56", "R$ 10"
  function parseBRL(s) {
    s = String(s == null ? '' : s).replace(/[R$\s]/g, '');
    if (!s) return NaN;
    if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
    else if ((s.match(/\./g) || []).length > 1) s = s.replace(/\./g, '');
    return /^\d+(\.\d+)?$/.test(s) ? Number(s) : NaN;
  }
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const hojeISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

  // ---------- API (com token CSRF) ----------
  let csrf = null;
  async function getCsrf(force) {
    if (!csrf || force) {
      const r = await fetch('/api/csrf', { credentials: 'same-origin' });
      csrf = (await r.json()).token;
    }
    return csrf;
  }
  async function api(method, url, body, _retry) {
    const opts = { method, credentials: 'same-origin', headers: {} };
    if (method !== 'GET') opts.headers['X-CSRF-Token'] = await getCsrf();
    if (body !== undefined) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
    const r = await fetch(url, opts);
    let data = null;
    try { data = await r.json(); } catch (_) {}
    if (r.status === 403 && !_retry && data && /CSRF/.test(data.erro || '')) { await getCsrf(true); return api(method, url, body, true); }
    if (r.status === 401 && document.body.dataset.page) { location.href = '/login'; }
    if (!r.ok) { const e = new Error((data && data.erro) || 'Erro inesperado. Tente novamente.'); e.status = r.status; throw e; }
    return data;
  }

  // ---------- Toast ----------
  function toast(msg, tipo = 'ok') {
    let box = $('#toasts');
    if (!box) { box = document.createElement('div'); box.id = 'toasts'; box.setAttribute('aria-live', 'polite'); document.body.appendChild(box); }
    const t = document.createElement('div');
    t.className = 'toast ' + tipo;
    t.textContent = msg;
    box.appendChild(t);
    setTimeout(() => t.remove(), 4000);
  }

  // ---------- Tema ----------
  function alternarTema() {
    const novo = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', novo);
    try { localStorage.setItem('mm-tema', novo); } catch (_) {}
    atualizarBotoesTema();
    document.dispatchEvent(new Event('mm:tema'));
  }
  function atualizarBotoesTema() {
    const escuro = document.documentElement.getAttribute('data-theme') === 'dark';
    $$('[data-toggle-tema]').forEach((b) => {
      b.innerHTML = icon(escuro ? 'sun' : 'moon') + `<span>${escuro ? 'Tema claro' : 'Tema escuro'}</span>`;
    });
  }

  // ---------- Shell (menu lateral) ----------
  const NAV = [
    ['dashboard', 'Dashboard', 'grid'], ['receitas', 'Receitas', 'up'], ['despesas', 'Despesas', 'down'],
    ['movimentacoes', 'Movimentações', 'list'], ['metas', 'Metas', 'target'], ['relatorios', 'Relatórios', 'chart'],
    ['configuracoes', 'Configurações', 'settings'],
  ];
  async function montarShell() {
    const sb = $('#sidebar');
    if (!sb) return;
    const page = document.body.dataset.page;
    let u = { nome: '', email: '' };
    try { u = await api('GET', '/api/auth/me'); } catch (_) { return; }
    sb.innerHTML = `
      <a class="brand" href="/dashboard"><span class="brand-icon">${icon('wallet')}</span><span>MyMoney</span></a>
      <nav>${NAV.map(([id, nome, ic]) => `<a href="/${id}" class="${id === page ? 'ativo' : ''}">${icon(ic)}<span>${nome}</span></a>`).join('')}</nav>
      <div class="sidebar-foot">
        <div class="user"><span class="avatar">${esc((u.nome || '?').trim().charAt(0).toUpperCase())}</span>
          <div><strong id="user-nome">${esc(u.nome)}</strong><small>${esc(u.email)}</small></div></div>
        <button class="btn btn-ghost btn-block" data-toggle-tema type="button"></button>
        <button class="btn btn-ghost btn-block" id="btn-sair" type="button">${icon('logout')}<span>Sair</span></button>
      </div>`;
    const menu = document.createElement('button');
    menu.className = 'menu-toggle';
    menu.type = 'button';
    menu.setAttribute('aria-label', 'Abrir menu');
    menu.innerHTML = icon('menu');
    menu.addEventListener('click', () => sb.classList.toggle('aberto'));
    $('.app-shell').prepend(menu);
    $('#btn-sair').addEventListener('click', async () => { try { await api('POST', '/api/auth/logout'); } finally { location.href = '/'; } });
    atualizarBotoesTema();
    $$('[data-toggle-tema]', sb).forEach((b) => b.addEventListener('click', alternarTema));
  }

  // ---------- Diálogos ----------
  function abrirDialog(d) { if (!d.open) d.showModal(); }
  function fecharDialog(d) { if (d.open) d.close(); }
  function ligarDialogs() {
    $$('dialog').forEach((d) => {
      $$('[data-fechar]', d).forEach((b) => b.addEventListener('click', () => d.close()));
      d.addEventListener('click', (e) => { if (e.target === d) d.close(); });
    });
  }
  function mostrarErro(form, msg) {
    const el = $('.form-erro', form);
    if (!el) return toast(msg, 'erro');
    el.textContent = msg || '';
    el.hidden = !msg;
  }

  // ---------- Autenticação (login / cadastro) ----------
  function ligarAuth() {
    $$('[data-toggle-senha]').forEach((b) => {
      b.innerHTML = icon('eye');
      b.addEventListener('click', () => {
        const campos = $$('input[data-senha]', b.closest('form'));
        const mostrar = campos[0].type === 'password';
        campos.forEach((c) => { c.type = mostrar ? 'text' : 'password'; });
        b.setAttribute('aria-pressed', String(mostrar));
      });
    });
    const enviar = (form, url, corpo) => {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        mostrarErro(form, '');
        const btn = $('button[type=submit]', form);
        btn.disabled = true;
        try { await api('POST', url, corpo(form)); location.href = '/dashboard'; }
        catch (err) { mostrarErro(form, err.message); btn.disabled = false; }
      });
    };
    const login = $('#form-login');
    if (login) enviar(login, '/api/auth/login', (f) => ({ email: f.email.value, senha: f.senha.value }));
    const cad = $('#form-cadastro');
    if (cad) {
      enviar(cad, '/api/auth/register', (f) => ({ nome: f.nome.value, email: f.email.value, senha: f.senha.value, confirmacao: f.confirmacao.value }));
    }
  }

  window.MM = { $, $$, api, brl, dataBR, mesBR, valorInput, parseBRL, esc, hojeISO, toast, icon, aplicarIcones, abrirDialog, fecharDialog, mostrarErro };

  document.addEventListener('DOMContentLoaded', () => {
    aplicarIcones();
    atualizarBotoesTema();
    $$('[data-toggle-tema]').forEach((b) => b.addEventListener('click', alternarTema));
    ligarDialogs();
    ligarAuth();
    montarShell();
  });
})();
