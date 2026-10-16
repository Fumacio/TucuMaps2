const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const env = require('./config/env');
const exigirEncabezadoCsrf = require('./middlewares/csrf');
const { limiteGeneral } = require('./middlewares/limites');
const { noEncontrado, manejarErrores } = require('./middlewares/errores');
const authRoutes = require('./routes/auth');
const cuentaRoutes = require('./routes/cuenta');
const catalogosRoutes = require('./routes/catalogos');
const lugaresRoutes = require('./routes/lugares');
const eventosRoutes = require('./routes/eventos');
const reportesRoutes = require('./routes/reportes');

const app = express();

// Detrás de Render/Vercel hay que confiar en sus proxies para ver la IP real
// (la usa el rate limiting). Se ajusta con TRUST_PROXY al desplegar.
app.set('trust proxy', env.TRUST_PROXY);
app.disable('x-powered-by');

app.use(helmet());
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

const api = express.Router();
api.use(limiteGeneral);
api.use(exigirEncabezadoCsrf);

// RF-06: el frontend lo usa para saber si el backend está despierto.
api.get('/salud', (req, res) => res.json({ ok: true }));
api.use('/auth', authRoutes);
api.use('/cuenta', cuentaRoutes);
api.use('/catalogos', catalogosRoutes);
api.use('/lugares', lugaresRoutes);
api.use('/eventos', eventosRoutes);
api.use('/reportes', reportesRoutes);

app.use('/api', api);
app.use(noEncontrado);
app.use(manejarErrores);

module.exports = app;
