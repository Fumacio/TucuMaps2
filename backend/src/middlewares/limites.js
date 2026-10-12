const rateLimit = require('express-rate-limit');
const env = require('../config/env');
const { errores } = require('../errores');

const opcionesComunes = { standardHeaders: 'draft-6', legacyHeaders: false };

// 100 solicitudes por minuto por IP. El encabezado Retry-After lo agrega la librería.
const limiteGeneral = rateLimit({
  ...opcionesComunes,
  windowMs: 60 * 1000,
  limit: 100,
  handler: (req, res, next) =>
    next(errores.demasiadosIntentos('Hiciste demasiadas solicitudes. Esperá un momento y probá de nuevo.')),
});

// RF-01: 5 logins fallidos en 15 minutos por IP. Los exitosos no cuentan.
const limiteLogin = rateLimit({
  ...opcionesComunes,
  windowMs: 15 * 60 * 1000,
  limit: 5,
  skipSuccessfulRequests: true,
  handler: (req, res, next) =>
    next(errores.demasiadosIntentos('Demasiados intentos de inicio de sesión. Probá de nuevo en 15 minutos.')),
});

// Rutas que envían correos: evita usarlas para llenar la casilla de otra persona.
// En las pruebas se desactiva, porque cada prueba registra usuarios nuevos.
const limiteCorreos = (limit) =>
  rateLimit({
    ...opcionesComunes,
    windowMs: 60 * 60 * 1000,
    limit,
    skip: () => env.NODE_ENV === 'test',
    handler: (req, res, next) =>
      next(errores.demasiadosIntentos('Pediste demasiados correos. Probá de nuevo en una hora.')),
  });

const limiteRegistro = limiteCorreos(20);
const limiteRecuperar = limiteCorreos(5);

module.exports = { limiteGeneral, limiteLogin, limiteRegistro, limiteRecuperar };
