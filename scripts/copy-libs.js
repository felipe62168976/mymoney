// Copia o Chart.js (instalado via npm) para a pasta pública, para ser servido localmente (sem CDN).
const fs = require('fs');
const path = require('path');

function ensureLibs(force = false) {
  try {
    const dist = path.join(__dirname, '..', 'node_modules', 'chart.js', 'dist');
    const dest = path.join(__dirname, '..', 'src', 'public', 'libs');
    const out = path.join(dest, 'chart.umd.js');
    fs.mkdirSync(dest, { recursive: true });
    if (!force && fs.existsSync(out)) return true;
    const src = ['chart.umd.js', 'chart.umd.min.js'].map((f) => path.join(dist, f)).find((f) => fs.existsSync(f));
    if (!src) {
      console.warn('[MyMoney] Chart.js não encontrado em node_modules. Execute "npm install".');
      return false;
    }
    fs.copyFileSync(src, out);
    return true;
  } catch (err) {
    console.warn('[MyMoney] Falha ao copiar Chart.js:', err.message);
    return false;
  }
}

module.exports = { ensureLibs };
if (require.main === module) ensureLibs(true);
