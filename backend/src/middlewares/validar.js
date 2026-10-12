const { errores } = require('../errores');

// Valida el cuerpo con un esquema zod. Los campos desconocidos se descartan.
function validar(esquema) {
  return (req, res, next) => {
    const resultado = esquema.safeParse(req.body ?? {});
    if (!resultado.success) {
      const detalles = resultado.error.issues.map((i) => ({
        campo: i.path.join('.'),
        mensaje: i.message,
      }));
      return next(errores.datosInvalidos(detalles));
    }
    req.body = resultado.data;
    return next();
  };
}

module.exports = validar;
