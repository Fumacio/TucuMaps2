// Sesión en cookie httpOnly con un JWT { sub, rol, v } (RF-01).
const jwt = require('jsonwebtoken');
const env = require('./config/env');

const NOMBRE_COOKIE = 'tm_sesion';
const DURACION_MS = 90 * 24 * 60 * 60 * 1000; // 90 días

const opcionesCookie = {
  httpOnly: true, // el JavaScript de la página no la puede leer
  secure: env.NODE_ENV === 'production', // solo HTTPS en producción
  sameSite: 'lax',
  path: '/',
};

function setearSesion(res, usuario) {
  const token = jwt.sign(
    { sub: String(usuario.id), rol: usuario.rol, v: usuario.token_version },
    env.JWT_SECRET,
    { algorithm: 'HS256', expiresIn: Math.floor(DURACION_MS / 1000) },
  );
  res.cookie(NOMBRE_COOKIE, token, { ...opcionesCookie, maxAge: DURACION_MS });
}

function borrarSesion(res) {
  res.clearCookie(NOMBRE_COOKIE, opcionesCookie);
}

// Devuelve el contenido del token si es válido; null en cualquier otro caso.
function leerSesion(req) {
  const token = req.cookies?.[NOMBRE_COOKIE];
  if (!token) return null;
  try {
    return jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
  } catch {
    return null;
  }
}

module.exports = { NOMBRE_COOKIE, setearSesion, borrarSesion, leerSesion };
