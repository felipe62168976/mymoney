/* MyMoney - helpers do Chart.js (biblioteca servida localmente em /libs/chart.umd.js) */
(function () {
  'use strict';
  const registro = {}; // id -> { chart, construir }
  const PALETA = ['#16a34a', '#0ea5e9', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#64748b', '#84cc16', '#6366f1'];

  const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const cores = () => ({ texto: css('--muted'), grade: css('--border'), verde: css('--primary'), vermelho: css('--danger'), fundo: css('--surface') });

  function eixos(c, moeda = true) {
    return {
      x: { ticks: { color: c.texto }, grid: { display: false } },
      y: { beginAtZero: true, ticks: { color: c.texto, callback: moeda ? (v) => MM.brl(v) : undefined }, grid: { color: c.grade } },
    };
  }
  const tooltipMoeda = { callbacks: { label: (ctx) => ` ${ctx.dataset.label ? ctx.dataset.label + ': ' : (ctx.label + ': ')}${MM.brl(ctx.parsed.y !== undefined ? ctx.parsed.y : ctx.parsed)}` } };

  function renderizar(id, construir) {
    const canvas = document.getElementById(id);
    if (!canvas || typeof Chart === 'undefined') return;
    if (registro[id]) registro[id].chart.destroy();
    const c = cores();
    Chart.defaults.font.family = getComputedStyle(document.body).fontFamily;
    Chart.defaults.color = c.texto;
    registro[id] = { construir, chart: new Chart(canvas, construir(c)) };
  }

  const G = {
    PALETA,
    barras(id, rotulos, series) { // series: [{label, data, cor: 'verde'|'vermelho'}]
      renderizar(id, (c) => ({
        type: 'bar',
        data: { labels: rotulos, datasets: series.map((s) => ({ label: s.label, data: s.data, backgroundColor: c[s.cor], borderRadius: 6, maxBarThickness: 38 })) },
        options: { responsive: true, maintainAspectRatio: false, scales: eixos(c), plugins: { legend: { display: series.length > 1, labels: { color: c.texto } }, tooltip: tooltipMoeda } },
      }));
    },
    linha(id, rotulos, series) { // series: [{label, data, cor}]
      renderizar(id, (c) => ({
        type: 'line',
        data: { labels: rotulos, datasets: series.map((s) => ({ label: s.label, data: s.data, borderColor: c[s.cor], backgroundColor: c[s.cor] + '22', fill: s.preencher !== false, tension: 0.3, pointRadius: 3, pointBackgroundColor: c[s.cor] })) },
        options: { responsive: true, maintainAspectRatio: false, scales: eixos(c), plugins: { legend: { display: series.length > 1, labels: { color: c.texto } }, tooltip: tooltipMoeda } },
      }));
    },
    rosca(id, rotulos, valores) {
      renderizar(id, (c) => ({
        type: 'doughnut',
        data: { labels: rotulos, datasets: [{ data: valores, backgroundColor: rotulos.map((_, i) => PALETA[i % PALETA.length]), borderColor: c.fundo, borderWidth: 2 }] },
        options: { responsive: true, maintainAspectRatio: false, cutout: '62%', plugins: { legend: { position: 'bottom', labels: { color: c.texto, boxWidth: 12 } }, tooltip: { callbacks: { label: (ctx) => ` ${ctx.label}: ${MM.brl(ctx.parsed)}` } } } },
      }));
    },
    limpar(id) { if (registro[id]) { registro[id].chart.destroy(); delete registro[id]; } },
  };

  document.addEventListener('mm:tema', () => {
    Object.keys(registro).forEach((id) => {
      const { construir } = registro[id];
      registro[id].chart.destroy();
      const canvas = document.getElementById(id);
      const c = cores();
      Chart.defaults.color = c.texto;
      registro[id] = { construir, chart: new Chart(canvas, construir(c)) };
    });
  });

  window.Graficos = G;
})();
