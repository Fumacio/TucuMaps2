// RNF-01: encabezados de caché de la API. Toda la política está en este archivo.
// - Por defecto nada se guarda (`no-store`): la mayoría de las respuestas dependen de la sesión
//   (perfil, Mis aportes, panel) y no tienen que quedar en el navegador ni en un proxy. Los
//   errores también salen con `no-store` (lo repone middlewares/errores.js).
// - Las listas y los detalles públicos del mapa usan `no-cache`: el navegador puede guardarlos,
//   pero pregunta siempre al servidor antes de usarlos. Como Express manda un ETag, si nada
//   cambió la respuesta es un 304 sin cuerpo; y un lugar editado o una alerta aprobada o
//   retirada se ven al instante.
// - Los catálogos cambian solo con un deploy: se guardan unos minutos.
const fijar = (valor) => (req, res, next) => {
  res.set('Cache-Control', valor);
  next();
};

const SIN_CACHE = 'no-store';
const sinCache = fijar(SIN_CACHE);
const revalidar = fijar('no-cache');
const guardar = (segundos) => fijar(`public, max-age=${segundos}`);

module.exports = { SIN_CACHE, sinCache, revalidar, guardar };
