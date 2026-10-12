const { errores } = require('../errores');

const METODOS_QUE_MODIFICAN = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

// Anti-CSRF: toda solicitud que modifica datos debe traer X-Requested-With: TucuMaps.
// Un formulario de otro sitio no puede agregar encabezados propios.
function exigirEncabezadoCsrf(req, res, next) {
  if (METODOS_QUE_MODIFICAN.has(req.method) && req.get('X-Requested-With') !== 'TucuMaps') {
    return next(errores.sinPermiso());
  }
  return next();
}

module.exports = exigirEncabezadoCsrf;
