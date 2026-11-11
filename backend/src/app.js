const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const env = require('./config/env');
const exigirEncabezadoCsrf = require('./middlewares/csrf');
const { sinCache } = require('./middlewares/cache');
const { limiteGeneral } = require('./middlewares/limites');
const { noEncontrado, manejarErrores } = require('./middlewares/errores');
const authRoutes = require('./routes/auth');
const cuentaRoutes = require('./routes/cuenta');
const catalogosRoutes = require('./routes/catalogos');
const lugaresRoutes = require('./routes/lugares');
const eventosRoutes = require('./routes/eventos');
const reportesRoutes = require('./routes/reportes');
const misEnviosRoutes = require('./routes/mis-envios');
const adminRoutes = require('./routes/admin');

const app = express();

// Detrás de Render/Vercel hay que confiar en sus proxies para ver la IP real
// (la usa el rate limiting). Se ajusta con TRUST_PROXY al desplegar.
app.set('trust proxy', env.TRUST_PROXY);
app.disable('x-powered-by');

app.use(helmet());
// Comprime las respuestas de más de 1 KB (gzip o brotli, según lo que acepte el navegador): la
// lista de lugares baja a menos de la mitad, que se nota en un celular con datos.
app.use(compression());
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

const api = express.Router();
api.use(sinCache);
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
api.use('/mis-envios', misEnviosRoutes);
api.use('/admin', adminRoutes);

app.use('/api', api);
app.use(noEncontrado);
app.use(manejarErrores);

module.exports = app;
