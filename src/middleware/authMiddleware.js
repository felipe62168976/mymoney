function requireAuthApi(req, res, next) {
  if (req.session && req.session.userId) return next();
  return res.status(401).json({ erro: 'Sessão expirada. Faça login novamente.' });
}

function requirePage(req, res, next) {
  if (req.session && req.session.userId) {
    res.set('Cache-Control', 'no-store');
    return next();
  }
  return res.redirect('/login');
}

module.exports = { requireAuthApi, requirePage };
