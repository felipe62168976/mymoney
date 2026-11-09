const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// --- Configuração (.env) -------------------------------------------------
const envPath = path.join(__dirname, '.env');
require('dotenv').config({ path: envPath });
if (!process.env.SESSION_SECRET) {
  process.env.SESSION_SECRET = crypto.randomBytes(48).toString('hex');
  try {
    const prefix = fs.existsSync(envPath) && fs.readFileSync(envPath, 'utf8').trim() ? '\n' : '';
    fs.appendFileSync(envPath, `${prefix}SESSION_SECRET=${process.env.SESSION_SECRET}\n`);
  } catch (_) { /* sem permissão de escrita: o segredo vale apenas para esta execução */ }
}

const express = require('express');
const helmet = require('helmet');
const session = require('express-session');
const rateLimit = require('express-rate-limit');

const db = require('./database/database');
const { initDatabase } = require('./database/init');
const SQLiteStore = require('./database/sessionStore');
const { ensureLibs } = require('./scripts/copy-libs');
const { requireAuthApi, requirePage } = require('./src/middleware/authMiddleware');
const { csrfProtect } = require('./src/middleware/csrfMiddleware');

initDatabase();
ensureLibs();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const PUBLIC = path.join(__dirname, 'src', 'public');
const view = (nome) => path.join(__dirname, 'src', 'views', `${nome}.html`);

app.disable('x-powered-by');
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: { 'upgrade-insecure-requests': null }, // app local em http://localhost
    },
    hsts: false,
  })
);
app.use(express.json({ limit: '100kb' }));
app.use(
  session({
    name: 'mymoney.sid',
    secret: process.env.SESSION_SECRET,
    store: new SQLiteStore(db),
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: { httpOnly: true, sameSite: 'lax', secure: false, maxAge: 7 * 24 * 3600 * 1000 },
  })
);

app.use(express.static(PUBLIC, { index: false }));

// --- API -----------------------------------------------------------------
const api = express.Router();
api.use(rateLimit({ windowMs: 60 * 1000, limit: 600, standardHeaders: true, legacyHeaders: false, message: { erro: 'Muitas requisições. Aguarde um instante.' } }));
api.use(csrfProtect);
api.use(require('./src/routes/authRoutes'));
api.use(requireAuthApi);
api.use('/receitas', require('./src/routes/receitaRoutes'));
api.use('/despesas', require('./src/routes/despesaRoutes'));
api.use('/movimentacoes', require('./src/routes/movimentacaoRoutes'));
api.use('/metas', require('./src/routes/metaRoutes'));
api.use('/relatorios', require('./src/routes/relatorioRoutes'));
api.use(require('./src/routes/configRoutes'));
api.use((req, res) => res.status(404).json({ erro: 'Recurso não encontrado.' }));
app.use('/api', api);

// --- Páginas -------------------------------------------------------------
app.get('/', (req, res) => res.sendFile(view('index')));
['login', 'cadastro'].forEach((p) =>
  app.get('/' + p, (req, res) => (req.session.userId ? res.redirect('/dashboard') : res.sendFile(view(p))))
);
['dashboard', 'receitas', 'despesas', 'movimentacoes', 'metas', 'relatorios', 'configuracoes'].forEach((p) =>
  app.get('/' + p, requirePage, (req, res) => res.sendFile(view(p)))
);

app.use((req, res) => res.status(404).type('text').send('Página não encontrada.'));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[MyMoney] Erro:', err);
  if (err.type === 'entity.parse.failed') return res.status(400).json({ erro: 'Requisição inválida.' });
  res.status(500).json({ erro: 'Erro interno. Tente novamente.' });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`MyMoney em execução: http://localhost:${PORT}`);
});
