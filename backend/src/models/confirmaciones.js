const pool = require('../db/pool');

// RF-14: guarda la confirmación. La restricción UNIQUE (reporte_id, usuario_id) de la base
// evita los duplicados, también si llegan dos solicitudes a la vez: la segunda espera a la
// primera y no inserta nada. Devuelve true si se guardó y false si ya existía.
async function crear(reporteId, usuarioId, db = pool) {
  const { rowCount } = await db.query(
    `INSERT INTO confirmaciones (reporte_id, usuario_id) VALUES ($1, $2)
     ON CONFLICT (reporte_id, usuario_id) DO NOTHING`,
    [reporteId, usuarioId],
  );
  return rowCount === 1;
}

async function contar(reporteId, db = pool) {
  const { rows } = await db.query('SELECT count(*)::int AS n FROM confirmaciones WHERE reporte_id = $1', [
    reporteId,
  ]);
  return rows[0].n;
}

module.exports = { crear, contar };
