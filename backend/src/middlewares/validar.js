const { errores } = require('../errores');

// Valida una parte de la solicitud con un esquema zod. Los campos desconocidos se descartan.
// - 'body': reemplaza req.body por los datos validados.
// - 'query' / 'params': los deja en req.validado.query / req.validado.params
//   (en Express 5 req.query no se puede reemplazar). Cada origen va por separado
//   para que un mismo nombre en la URL y en la query no se pisen.
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
    else req.validado = { ...req.validado, [origen]: resultado.data };
    return next();
  };
}

module.exports = validar;
