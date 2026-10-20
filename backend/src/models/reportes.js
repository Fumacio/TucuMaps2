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

// RF-07: el autor edita su reporte mientras sigue pendiente. Si no es suyo o ya no está
// pendiente no cambia nada y devuelve null (el servicio ya lo controló antes, con la fila
// bloqueada). Borra la pre-validación con IA (RF-20): describía el texto anterior.
async function editarPendiente(id, usuarioId, { tipo, descripcion, direccion, barrio, lat, lng }, db = pool) {
  const { rows } = await db.query(
    `UPDATE reportes
     SET tipo = $3, descripcion = $4, direccion = $5, barrio = $6, lat = $7, lng = $8,
         ia_veredicto = NULL, ia_confianza = NULL, ia_motivo = NULL, ia_analizado_en = NULL, actualizado_en = now()
     WHERE id = $1 AND usuario_id = $2 AND estado = 'pendiente'
     RETURNING id, estado`,
    [id, usuarioId, tipo, descripcion, direccion, barrio, lat, lng],
  );
  return rows[0] ? { id: Number(rows[0].id), estado: rows[0].estado } : null;
}

// RF-07, RF-08: pendiente → cancelado, solo por su autor. Igual que editar: null si no se pudo.
async function cancelarPendiente(id, usuarioId, db = pool) {
  const { rows } = await db.query(
    `UPDATE reportes SET estado = 'cancelado', actualizado_en = now()
     WHERE id = $1 AND usuario_id = $2 AND estado = 'pendiente'
     RETURNING id, estado`,
    [id, usuarioId],
  );
  return rows[0] ? { id: Number(rows[0].id), estado: rows[0].estado } : null;
}

module.exports = { listarActivos, crear, editarPendiente, cancelarPendiente };
