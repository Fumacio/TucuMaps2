const { errores } = require('../errores');

// Valida una parte de la solicitud con un esquema zod. Los campos desconocidos se descartan.
// - 'body': reemplaza req.body por los datos validados.
// - 'query' / 'params': los deja en req.datos (en Express 5 req.query no se puede reemplazar).
function validar(esquema, origen = 'body') {
  return (req, res, next) => {
    const resultado = esquema.safeParse(req[origen] ?? {});
    if (!resultado.success) {
      const detalles = resultado.error.issues.map((i) => ({
        campo: i.path.join('.'),
        mensaje: i.message,
      }));
      return next(errores.datosInvalidos(detalles));
    }
    if (origen === 'body') req.body = resultado.data;
    else req.datos = { ...req.datos, ...resultado.data };
    return next();
  };
}

module.exports = validar;
