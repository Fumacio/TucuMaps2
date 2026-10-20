const pool = require('../db/pool');

// RF-14: guarda la confirmación y devuelve { nueva, total }. La restricción UNIQUE
// (reporte_id, usuario_id) de la base evita los duplicados, también si llegan dos solicitudes
// a la vez: la segunda espera a la primera y no inserta nada (nueva = false). El conteo de la
// misma sentencia todavía no ve la fila insertada, por eso se le suma.
async function crear(reporteId, usuarioId, db = pool) {
  const { rows } = await db.query(
    `WITH nueva AS (
       INSERT INTO confirmaciones (reporte_id, usuario_id) VALUES ($1, $2)
       ON CONFLICT (reporte_id, usuario_id) DO NOTHING
       RETURNING 1
     )
     SELECT (SELECT count(*) FROM nueva)::int AS nueva,
            ((SELECT count(*) FROM confirmaciones WHERE reporte_id = $1)
              + (SELECT count(*) FROM nueva))::int AS total`,
    [reporteId, usuarioId],
  );
  return { nueva: rows[0].nueva === 1, total: rows[0].total };
}

module.exports = { crear };
