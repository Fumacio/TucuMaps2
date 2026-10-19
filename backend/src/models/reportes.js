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

// RF-09: envíos del usuario en las últimas 24 horas, en cualquier estado (también cancelados).
async function contarRecientes(usuarioId, db = pool) {
  const { rows } = await db.query(
    `SELECT count(*)::int AS cantidad, min(creado_en) AS primero
     FROM reportes WHERE usuario_id = $1 AND creado_en > now() - interval '24 hours'`,
    [usuarioId],
  );
  return rows[0];
}

// RF-07: el reporte nuevo queda pendiente de moderación.
async function crear({ tipo, descripcion, direccion, barrio, lat, lng }, usuarioId, db = pool) {
  const { rows } = await db.query(
    `INSERT INTO reportes (usuario_id, tipo, descripcion, direccion, barrio, lat, lng)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, estado`,
    [usuarioId, tipo, descripcion, direccion, barrio, lat, lng],
  );
  return { id: Number(rows[0].id), estado: rows[0].estado };
}

module.exports = { listarActivos, contarRecientes, crear };
