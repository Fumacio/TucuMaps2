const { errores } = require('../errores');
const { leerSesion, setearSesion, borrarSesion } = require('../sesion');
const usuarios = require('../models/usuarios');

// Nivel "Sesión": token válido, token_version vigente y usuario no bloqueado.
// Se consulta la base en cada solicitud para poder cortar sesiones al instante,
// y se renueva la cookie para que la sesión dure 90 días desde el último uso (RF-01).
async function requerirSesion(req, res, next) {
  const payload = leerSesion(req);
  if (!payload) return next(errores.noAutenticado());

  const usuario = await usuarios.buscarPorId(payload.sub);
  if (!usuario || usuario.token_version !== payload.v) {
    borrarSesion(res);
    return next(errores.noAutenticado());
  }
  if (usuario.bloqueado) {
    borrarSesion(res);
    return next(errores.usuarioBloqueado());
  }

  req.usuario = usuario;
  setearSesion(res, usuario);
  return next();
}

// Nivel "Verificado": se usa después de requerirSesion (RF-03).
function requerirVerificado(req, res, next) {
  if (!req.usuario.email_verificado) return next(errores.emailNoVerificado());
  return next();
}

// Nivel "Admin": se usa después de requerirSesion.
function requerirRol(rol) {
  return (req, res, next) => {
    if (req.usuario.rol !== rol) return next(errores.sinPermiso());
    return next();
  };
}

module.exports = { requerirSesion, requerirVerificado, requerirRol };
