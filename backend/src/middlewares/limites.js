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

// RF-01: 5 logins fallidos en 15 minutos, por IP y por email. Solo cuentan las credenciales
// incorrectas (401): ni los exitosos, ni los datos inválidos, ni los 429 del otro límite.
// Va después de validar(schemas.login), así el email ya llega normalizado y con largo acotado.
const opcionesLogin = {
  ventanaMin: 15,
  limite: 5,
  skipSuccessfulRequests: true,
  requestWasSuccessful: (req, res) => res.statusCode !== 401,
  mensaje: 'Demasiados intentos de inicio de sesión. Probá de nuevo en 15 minutos.',
};

// El de email frena a quien prueba contraseñas contra una misma cuenta cambiando de IP.
const limiteLogin = [
  limitador(opcionesLogin),
  limitador({ ...opcionesLogin, keyGenerator: (req) => req.body.email }),
];

// Mismo criterio para las rutas que piden la contraseña con la sesión abierta (cambiar la
// contraseña o el email, dar de baja la cuenta): evita adivinarla con una sesión robada.
// Por IP, antes de requerirSesion: cuenta cualquier respuesta con error.
const almacenPorIp = new rateLimit.MemoryStore();
const almacenPorCuenta = new rateLimit.MemoryStore();
const opcionesCambioPassword = {
  ventanaMin: 15,
  limite: 5,
  skipSuccessfulRequests: true,
  mensaje: 'Demasiados intentos. Probá de nuevo en 15 minutos.',
};
const limiteCambioPassword = limitador({ ...opcionesCambioPassword, store: almacenPorIp });

// Por cuenta: frena a quien prueba contraseñas cambiando de IP. Va después de requerirSesion
// (la sesión ya se verificó contra la base, así un token viejo o revocado no gasta el cupo del
// dueño) y solo cuenta las contraseñas incorrectas, que marca el manejador de errores: otros
// errores (email en uso, datos inválidos) no bloquean la cuenta.
const limitePasswordPorCuenta = limitador({
  ...opcionesCambioPassword,
  store: almacenPorCuenta,
  keyGenerator: (req) => `cuenta:${req.usuario.id}`,
  requestWasSuccessful: (req, res) => !res.locals.passwordIncorrecta,
});

// Para las pruebas: pone en cero los contadores de estos dos límites.
async function reiniciarLimitesPassword() {
  await Promise.all([almacenPorIp.resetAll(), almacenPorCuenta.resetAll()]);
}

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
// RF-25: el pedido de cambio de email manda un correo a una dirección que elige el usuario.
const limiteCambioEmail = limiteCorreos(10);

module.exports = {
  limiteGeneral,
  limiteLogin,
  limiteCambioPassword,
  limitePasswordPorCuenta,
  reiniciarLimitesPassword,
  limiteRegistro,
  limiteRecuperar,
  limiteCambioEmail,
};
