const rateLimit = require('express-rate-limit');
const env = require('../config/env');
const { errores } = require('../errores');

const MINUTO = 60 * 1000;

// Arma un limitador por IP que responde con el formato de error de la API.
function limitador({ ventanaMin, limite, mensaje, ...extra }) {
  return rateLimit({
    windowMs: ventanaMin * MINUTO,
    limit: limite,
    standardHeaders: 'draft-6',
    legacyHeaders: false,
    handler: (req, res, next) => next(errores.demasiadosIntentos(mensaje, ventanaMin * 60)),
    ...extra,
  });
}

// 100 solicitudes por minuto por IP.
const limiteGeneral = limitador({
  ventanaMin: 1,
  limite: 100,
  mensaje: 'Hiciste demasiadas solicitudes. Esperá un momento y probá de nuevo.',
});

// RF-01: 5 logins fallidos en 15 minutos, por IP y por email. Los exitosos no cuentan.
const opcionesLogin = {
  ventanaMin: 15,
  limite: 5,
  skipSuccessfulRequests: true,
  mensaje: 'Demasiados intentos de inicio de sesión. Probá de nuevo en 15 minutos.',
};

const emailDelCuerpo = (req) => {
  const email = req.body?.email;
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
};

const limiteLoginPorIp = limitador(opcionesLogin);

// El de email frena a quien prueba contraseñas contra una misma cuenta cambiando de IP.
// Sin email no hay cuenta que proteger: esa solicitud la frena solo el de IP.
const limiteLoginPorEmail = limitador({
  ...opcionesLogin,
  keyGenerator: (req) => `email:${emailDelCuerpo(req)}`,
  skip: (req) => emailDelCuerpo(req) === '',
});

const limiteLogin = [limiteLoginPorIp, limiteLoginPorEmail];

// Mismo criterio para el cambio de contraseña: evita adivinar la actual con una sesión robada.
const limiteCambioPassword = limitador({
  ventanaMin: 15,
  limite: 5,
  skipSuccessfulRequests: true,
  mensaje: 'Demasiados intentos. Probá de nuevo en 15 minutos.',
});

// Rutas que envían correos: evita usarlas para llenar la casilla de otra persona.
// En las pruebas se desactivan, porque cada prueba registra usuarios nuevos.
const limiteCorreos = (limite) =>
  limitador({
    ventanaMin: 60,
    limite,
    skip: () => env.NODE_ENV === 'test',
    mensaje: 'Pediste demasiados correos. Probá de nuevo en una hora.',
  });

const limiteRegistro = limiteCorreos(20);
const limiteRecuperar = limiteCorreos(5);

module.exports = {
  limiteGeneral,
  limiteLogin,
  limiteLoginPorEmail,
  limiteCambioPassword,
  limiteRegistro,
  limiteRecuperar,
};
