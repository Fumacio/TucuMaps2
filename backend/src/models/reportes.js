const pool = require('../db/pool');
const { aNumeros } = require('./comunes');

// La vista reportes_activos ya deja solo los aprobados con menos de 24 hs desde su aprobación
// (RF-11). No tiene usuario_id ni revisado_por: el autor y el moderador nunca salen (RF-04).
// Las confirmaciones (RF-14) se cuentan aparte; hasta que exista esa función dan 0.
async function listarActivos(db = pool) {
  const { rows } = await db.query(
    `SELECT r.id, r.tipo, r.descripcion, r.direccion, r.barrio, r.lat, r.lng, r.aprobado_en,
            (SELECT count(*) FROM confirmaciones c WHERE c.reporte_id = r.id)::int AS confirmaciones
     FROM reportes_activos r
     ORDER BY r.aprobado_en DESC, r.id DESC`,
  );
  return rows.map(aNumeros);
}

module.exports = { listarActivos };
