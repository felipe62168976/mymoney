const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const ctrl = require('../controllers/authController');
const { requireAuthApi } = require('../middleware/authMiddleware');
const { garantirToken } = require('../middleware/csrfMiddleware');

const limitador = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { erro: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.' },
});

router.get('/csrf', (req, res) => res.json({ token: garantirToken(req) }));
router.post('/auth/register', limitador, ctrl.cadastrar);
router.post('/auth/login', limitador, ctrl.entrar);
router.post('/auth/logout', ctrl.sair);
router.get('/auth/me', requireAuthApi, ctrl.eu);

module.exports = router;
