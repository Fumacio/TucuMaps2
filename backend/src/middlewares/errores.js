const { ErrorApi, errores } = require('../errores');

function noEncontrado(req, res, next) {
  next(errores.noEncontrado());
}

// Lo que se registra de un error inesperado: la traza, la causa y los campos de PostgreSQL que
// ayudan a ubicarlo. No se registra el objeto entero, porque `detail` y `where` traen los valores
// de la fila (por ejemplo un email) y los datos personales no van a los logs.
const CAMPOS_PG = ['code', 'constraint', 'table', 'column', 'routine'];
function paraElLog(err) {
  if (!(err instanceof Error)) return ['Se lanzó algo que no es un Error:', typeof err];
  const partes = [err.stack];
  const campos = Object.fromEntries(CAMPOS_PG.filter((c) => err[c]).map((c) => [c, err[c]]));
  if (Object.keys(campos).length > 0) partes.push(JSON.stringify(campos));
  // AggregateError (por ejemplo, la base no responde ni por IPv4 ni por IPv6).
  if (Array.isArray(err.errors)) partes.push(err.errors.map((e) => e?.message).join(' | '));
  if (err.cause instanceof Error) partes.push(`Causa: ${err.cause.stack}`);
  return partes;
}

// Express reconoce el manejador de errores porque recibe 4 parámetros.
function manejarErrores(err, req, res, next) {
  // JSON mal formado o cuerpo demasiado grande.
  if (err.type === 'entity.parse.failed' || err.type === 'entity.too.large') {
    err = errores.datosInvalidos();
  }
  if (err instanceof ErrorApi) {
    if (err.passwordIncorrecta) res.locals.passwordIncorrecta = true;
    const cuerpo = { codigo: err.codigo, mensaje: err.message };
    if (err.detalles) cuerpo.detalles = err.detalles;
    if (err.retryAfterSeg && !res.get('Retry-After')) res.set('Retry-After', String(err.retryAfterSeg));
    return res.status(err.status).json({ error: cuerpo });
  }
  // El detalle solo va al log del servidor.
  console.error(...paraElLog(err));
  return res.status(500).json({
    error: { codigo: 'ERROR_INTERNO', mensaje: 'Ocurrió un error inesperado. Probá de nuevo más tarde.' },
  });
}

module.exports = { noEncontrado, manejarErrores, paraElLog };
