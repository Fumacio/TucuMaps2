// Encabezados de caché de la API.
// - Por defecto nada se guarda (`no-store`): la mayoría de las respuestas dependen de la sesión
//   (perfil, Mis aportes, panel) y no tienen que quedar en el navegador ni en un proxy.
// - Las listas públicas del mapa usan `no-cache`: el navegador puede guardarlas, pero pregunta
//   siempre al servidor antes de usarlas. Como Express manda un ETag, si nada cambió la respuesta
//   es un 304 sin cuerpo; y un lugar editado o una alerta aprobada o retirada se ven al instante.
// Los catálogos, que cambian solo con un deploy, se guardan 5 minutos (controllers/catalogos.js).
function sinCache(req, res, next) {
  res.set('Cache-Control', 'no-store');
  next();
}

function revalidar(req, res, next) {
  res.set('Cache-Control', 'no-cache');
  next();
}

module.exports = { sinCache, revalidar };
