const crypto = require('crypto');

function garantirToken(req) {
  if (!req.session.csrf) req.session.csrf = crypto.randomBytes(32).toString('hex');
  return req.session.csrf;
}

function csrfProtect(req, res, next) {
  const esperado = garantirToken(req);
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const a = Buffer.from(String(req.get('x-csrf-token') || ''));
  const b = Buffer.from(esperado);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return res.status(403).json({ erro: 'Token CSRF inválido. Recarregue a página e tente novamente.' });
  }
  next();
}

module.exports = { csrfProtect, garantirToken };
