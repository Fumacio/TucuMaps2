const { ErrorApi, errores } = require('../errores');

function noEncontrado(req, res, next) {
  next(errores.noEncontrado());
}

// Express reconoce el manejador de errores porque recibe 4 parámetros.
function manejarErrores(err, req, res, next) {
  // JSON mal formado o cuerpo demasiado grande.
  if (err.type === 'entity.parse.failed' || err.type === 'entity.too.large') {
    err = errores.datosInvalidos();
  }
  if (err instanceof ErrorApi) {
    const cuerpo = { codigo: err.codigo, mensaje: err.message };
    if (err.detalles) cuerpo.detalles = err.detalles;
    if (err.retryAfterSeg && !res.get('Retry-After')) res.set('Retry-After', String(err.retryAfterSeg));
    return res.status(err.status).json({ error: cuerpo });
  }
  // El detalle solo va al log del servidor.
  console.error(err);
  return res.status(500).json({
    error: { codigo: 'ERROR_INTERNO', mensaje: 'Ocurrió un error inesperado. Probá de nuevo más tarde.' },
  });
}

module.exports = { noEncontrado, manejarErrores };
