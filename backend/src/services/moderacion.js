const { enTransaccion } = require('../db/pool');
const { errores } = require('../errores');
const envios = require('../models/envios');
const { exigirUsuarioActivo } = require('./envios');

// Igual que en los envíos, relee al admin con su fila bloqueada: si lo bloquearon, borró su
// cuenta o le sacaron el rol mientras la solicitud esperaba, no se modera nada (RF-16, RF-24).
async function exigirAdminActivo(adminId, db) {
  const admin = await exigirUsuarioActivo(adminId, db);
  if (admin.rol !== 'admin') throw errores.sinPermiso();
}

// RF-08, RF-13: una acción del admin sobre un reporte o un evento, según el diagrama de estados
// de "Modelo de datos". Bloquea la fila y controla en este orden: no existe 404, el estado de
// partida no es uno de `desde` 409. Los estados finales nunca están en `desde`, así no se reabren.
// - tabla: 'reportes' o 'eventos'; nombre: 'El reporte' o 'El evento' (para el mensaje).
// - verbo: 'aprobar', 'rechazar', ... (para el mensaje).
// - aplicar(db): el UPDATE del modelo.
// - devolver(db) → lo que responde la API (el elemento actualizado).
function moderar({ tabla, nombre, id, admin, desde, verbo, aplicar, devolver }) {
  return enTransaccion(async (db) => {
    await exigirAdminActivo(admin.id, db);
    const envio = await envios.bloquearEnvio(tabla, id, db);
    if (!envio) throw errores.noEncontrado();
    if (!desde.includes(envio.estado)) {
      throw errores.transicionInvalida(`${nombre} está ${envio.estado} y no se puede ${verbo}.`);
    }
    await aplicar(db);
    return devolver(db);
  });
}

module.exports = { exigirAdminActivo, moderar };
