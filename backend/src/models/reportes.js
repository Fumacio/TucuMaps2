const pool = require('../db/pool');
const { aNumeros } = require('./comunes');

// La vista reportes_activos ya deja solo los aprobados con menos de 24 hs desde su aprobación
// (RF-11). No tiene usuario_id ni revisado_por: el autor y el moderador nunca salen (RF-04).
// Las confirmaciones (RF-14) se cuentan aparte.
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

// RF-14: autor de una alerta activa, o null si no existe, no está aprobada o ya venció.
// FOR SHARE: nadie la cambia de estado hasta el fin de la transacción. La condición repite la
// de la vista reportes_activos sobre la misma fila bloqueada, para que, si un admin la retira
// mientras tanto, PostgreSQL la vuelva a evaluar con el estado nuevo (con la vista en una
// subconsulta vería el anterior).
async function buscarActivoParaConfirmar(id, db) {
  const { rows } = await db.query(
    `SELECT usuario_id FROM reportes
     WHERE id = $1 AND estado = 'aprobado' AND aprobado_en > now() - interval '24 hours'
     FOR SHARE`,
    [id],
  );
  return rows[0] ?? null;
}

// ---------- Administración (RF-08, RF-13, RF-15) ----------
// El panel ve todo el reporte: autor y moderadores (id y nombre), confirmaciones, fechas de
// cada paso y la pre-validación con IA (vacía hasta la Fase 6). `activa` dice si hoy se ve en
// el mapa: la misma condición que la vista reportes_activos (RF-11).
const SELECT_ADMIN = `
  SELECT r.id, r.tipo, r.descripcion, r.direccion, r.barrio, r.lat, r.lng, r.estado,
         (r.estado = 'aprobado' AND r.aprobado_en > now() - interval '24 hours') AS activa,
         r.usuario_id, autor.nombre AS autor_nombre,
         (SELECT count(*) FROM confirmaciones c WHERE c.reporte_id = r.id)::int AS confirmaciones,
         r.creado_en, r.actualizado_en, r.aprobado_en, r.resuelto_en,
         r.revisado_por, revisor.nombre AS revisor_nombre, r.revisado_en, r.motivo_rechazo,
         r.retirado_por, retiro.nombre AS retiro_nombre, r.retirado_en,
         r.ia_veredicto, r.ia_confianza, r.ia_motivo, r.ia_analizado_en
  FROM reportes r
  LEFT JOIN usuarios autor ON autor.id = r.usuario_id
  LEFT JOIN usuarios revisor ON revisor.id = r.revisado_por
  LEFT JOIN usuarios retiro ON retiro.id = r.retirado_por`;

// Un usuario como { id, nombre }, o null si no hay (o si borró su cuenta, RF-24).
const persona = (id, nombre) => (id === null ? null : { id: Number(id), nombre });

function armarParaAdmin(f) {
  return {
    id: Number(f.id),
    tipo: f.tipo,
    descripcion: f.descripcion,
    direccion: f.direccion,
    barrio: f.barrio,
    lat: Number(f.lat),
    lng: Number(f.lng),
    estado: f.estado,
    activa: f.activa,
    autor: persona(f.usuario_id, f.autor_nombre),
    confirmaciones: f.confirmaciones,
    creado_en: f.creado_en,
    actualizado_en: f.actualizado_en,
    aprobado_en: f.aprobado_en,
    resuelto_en: f.resuelto_en,
    revisado_por: persona(f.revisado_por, f.revisor_nombre),
    revisado_en: f.revisado_en,
    motivo_rechazo: f.motivo_rechazo,
    retirado_por: persona(f.retirado_por, f.retiro_nombre),
    retirado_en: f.retirado_en,
    ia_veredicto: f.ia_veredicto,
    ia_confianza: f.ia_confianza === null ? null : Number(f.ia_confianza),
    ia_motivo: f.ia_motivo,
    ia_analizado_en: f.ia_analizado_en,
  };
}

// RF-15: lista del panel, del más nuevo al más viejo. Los filtros ausentes llegan en null.
// Igual que en lugares, el total sale de la misma consulta y solo una página vacía lo pide aparte.
const FILTROS_ADMIN = `
  WHERE ($1::text IS NULL OR r.estado::text = $1)
    AND ($2::text IS NULL OR r.tipo = $2)
    AND ($3::text IS NULL OR r.ia_veredicto::text = $3)
    AND ($4::timestamptz IS NULL OR r.creado_en >= $4)
    AND ($5::timestamptz IS NULL OR r.creado_en <= $5)`;

async function listarParaAdmin({ estado, tipo, ia_veredicto, desde, hasta, pagina, por_pagina }, db = pool) {
  const filtros = [estado ?? null, tipo ?? null, ia_veredicto ?? null, desde ?? null, hasta ?? null];
  const { rows } = await db.query(
    `SELECT lista.*, count(*) OVER ()::int AS total FROM (${SELECT_ADMIN} ${FILTROS_ADMIN}) lista
     ORDER BY creado_en DESC, id DESC LIMIT $6 OFFSET $7`,
    [...filtros, por_pagina, (pagina - 1) * por_pagina],
  );
  if (rows.length === 0) {
    const conteo = await db.query(`SELECT count(*)::int AS total FROM reportes r ${FILTROS_ADMIN}`, filtros);
    return { datos: [], total: conteo.rows[0].total };
  }
  return { datos: rows.map(armarParaAdmin), total: rows[0].total };
}

// RF-15: detalle del panel, en cualquier estado (también las alertas vencidas, RF-11).
async function buscarParaAdmin(id, db = pool) {
  const { rows } = await db.query(`${SELECT_ADMIN} WHERE r.id = $1`, [id]);
  return rows[0] ? armarParaAdmin(rows[0]) : null;
}

// RF-08: pendiente → aprobado. aprobado_en arranca las 24 hs de la alerta en el mapa (RF-11).
// Cada acción supone que el servicio ya bloqueó la fila y controló el estado de partida.
async function aprobar(id, adminId, db) {
  await db.query(
    `UPDATE reportes SET estado = 'aprobado', aprobado_en = now(), revisado_por = $2, revisado_en = now(),
       actualizado_en = now()
     WHERE id = $1`,
    [id, adminId],
  );
}

// RF-08: pendiente → rechazado, con el motivo que ve el autor en "Mis envíos".
async function rechazar(id, adminId, motivo, db) {
  await db.query(
    `UPDATE reportes SET estado = 'rechazado', motivo_rechazo = $3, revisado_por = $2, revisado_en = now(),
       actualizado_en = now()
     WHERE id = $1`,
    [id, adminId, motivo],
  );
}

// RF-08: aprobado → resuelto, la situación ya se solucionó. Sale del mapa al instante.
async function resolver(id, db) {
  await db.query(
    `UPDATE reportes SET estado = 'resuelto', resuelto_en = now(), actualizado_en = now() WHERE id = $1`,
    [id],
  );
}

// RF-13: aprobado → retirado, sin motivo. Registra quién lo retiró y cuándo.
async function retirar(id, adminId, db) {
  await db.query(
    `UPDATE reportes SET estado = 'retirado', retirado_por = $2, retirado_en = now(), actualizado_en = now()
     WHERE id = $1`,
    [id, adminId],
  );
}

module.exports = {
  listarActivos,
  crear,
  editarPendiente,
  cancelarPendiente,
  buscarActivoParaConfirmar,
  listarParaAdmin,
  buscarParaAdmin,
  aprobar,
  rechazar,
  resolver,
  retirar,
};
