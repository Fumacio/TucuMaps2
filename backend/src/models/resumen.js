const pool = require('../db/pool');

// RF-15: contadores de la portada del panel. Las alertas activas usan la misma vista que el
// mapa (RF-11).
async function contadores(db = pool) {
  const { rows } = await db.query(
    `SELECT (SELECT count(*) FROM reportes WHERE estado = 'pendiente')::int AS reportes_pendientes,
            (SELECT count(*) FROM eventos WHERE estado = 'pendiente')::int AS eventos_pendientes,
            (SELECT count(*) FROM reportes_activos)::int AS alertas_activas,
            (SELECT count(*) FROM usuarios WHERE bloqueado)::int AS usuarios_bloqueados`,
  );
  return rows[0];
}

module.exports = { contadores };
