const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const bad = (res, erro, status = 400) => res.status(status).json({ erro });

function dataValida(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s + 'T00:00:00Z');
  return !isNaN(d) && d.toISOString().slice(0, 10) === s;
}

// Retorna número com 2 casas ou null se inválido
function dinheiro(v, { permiteZero = false } = {}) {
  if (typeof v === 'string' && v.trim() === '') return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n > 1e12 || n < 0) return null;
  if (n === 0 && !permiteZero) return null;
  return Math.round(n * 100) / 100;
}

const emailValido = (e) => typeof e === 'string' && e.length <= 150 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);

const pad = (n) => String(n).padStart(2, '0');
const hojeISO = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };

module.exports = { wrap, bad, dataValida, dinheiro, emailValido, pad, hojeISO };
