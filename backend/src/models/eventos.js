const pool = require('../db/pool');
const { aNumeros, persona } = require('./comunes');

// La vista eventos_vigentes ya deja solo los aprobados y los saca 24 hs después de su fin,
// o de su inicio si no tiene fin (RF-08, RF-12). No tiene propuesto_por: el autor nunca sale.
// lugar_id es la sede opcional: el id de uno de los lugares del mapa, o null.
const COLUMNAS = `id, nombre, categoria, modalidad, descripcion, lugar_nombre, direccion, barrio,
  lat, lng, inicio, fin, flyer_url, etiquetas, lugar_id`;

// lugar_id también llega como texto (BIGINT).
const conLugar = (fila) => ({
  ...aNumeros(fila),
  lugar_id: fila.lugar_id === null ? null : Number(fila.lugar_id),
});

// Con desde/hasta devuelve los eventos que se cruzan con ese rango: todavía no terminaron
// en `desde` y ya empezaron en `hasta`.
async function listarVigentes({ categoria, desde, hasta, lugar_id } = {}, db = pool) {
  const { rows } = await db.query(
    `SELECT ${COLUMNAS} FROM eventos_vigentes
     WHERE ($1::text IS NULL OR categoria = $1)
       AND ($2::timestamptz IS NULL OR COALESCE(fin, inicio) >= $2)
       AND ($3::timestamptz IS NULL OR inicio <= $3)
       AND ($4::bigint IS NULL OR lugar_id = $4)
     ORDER BY inicio, id`,
    [categoria ?? null, desde ?? null, hasta ?? null, lugar_id ?? null],
  );
  return rows.map(conLugar);
}

async function buscarVigentePorId(id, db = pool) {
  const { rows } = await db.query(`SELECT ${COLUMNAS} FROM eventos_vigentes WHERE id = $1`, [id]);
  return rows[0] ? conLugar(rows[0]) : null;
}

// RF-07: la propuesta nueva queda pendiente de moderación.
async function crearPropuesta(d, propuestoPor, db = pool) {
  const { rows } = await db.query(
    `INSERT INTO eventos (nombre, categoria, modalidad, descripcion, lugar_nombre, direccion, barrio,
       lugar_id, lat, lng, inicio, fin, flyer_url, etiquetas, propuesto_por)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
     RETURNING id, estado`,
    [d.nombre, d.categoria, d.modalidad, d.descripcion, d.lugar_nombre, d.direccion, d.barrio,
      d.lugar_id, d.lat, d.lng, d.inicio, d.fin, d.flyer_url, d.etiquetas, propuestoPor],
  );
  return { id: Number(rows[0].id), estado: rows[0].estado };
}

// RF-07: el autor edita su propuesta mientras sigue pendiente. Si no es suya o ya no está
// pendiente no cambia nada y devuelve null (el servicio ya lo controló antes, con la fila
// bloqueada). Borra la pre-validación con IA (RF-20): describía el texto anterior.
async function editarPendiente(id, usuarioId, d, db = pool) {
  const { rows } = await db.query(
    `UPDATE eventos
     SET nombre = $3, categoria = $4, modalidad = $5, descripcion = $6, lugar_nombre = $7,
         direccion = $8, barrio = $9, lugar_id = $10, lat = $11, lng = $12, inicio = $13, fin = $14,
         flyer_url = $15, etiquetas = $16,
         ia_veredicto = NULL, ia_confianza = NULL, ia_motivo = NULL, ia_analizado_en = NULL, actualizado_en = now()
     WHERE id = $1 AND propuesto_por = $2 AND estado = 'pendiente'
     RETURNING id, estado`,
    [id, usuarioId, d.nombre, d.categoria, d.modalidad, d.descripcion, d.lugar_nombre, d.direccion,
      d.barrio, d.lugar_id, d.lat, d.lng, d.inicio, d.fin, d.flyer_url, d.etiquetas],
  );
  return rows[0] ? { id: Number(rows[0].id), estado: rows[0].estado } : null;
}

// RF-07, RF-08: pendiente → cancelado, solo por su autor. Igual que editar: null si no se pudo.
async function cancelarPendiente(id, usuarioId, db = pool) {
  const { rows } = await db.query(
    `UPDATE eventos SET estado = 'cancelado', actualizado_en = now()
     WHERE id = $1 AND propuesto_por = $2 AND estado = 'pendiente'
     RETURNING id, estado`,
    [id, usuarioId],
  );
  return rows[0] ? { id: Number(rows[0].id), estado: rows[0].estado } : null;
}

// ---------- Administración (RF-08, RF-12, RF-13, RF-15) ----------
// El panel ve todo el evento: autor y moderadores (id y nombre), fechas de cada paso y la
// pre-validación con IA (vacía hasta la Fase 6). `archivado`: pasaron 24 hs desde que sucedió
// (RF-12), en cualquier estado. `vigente`: hoy se ve en la agenda, la misma condición que la
// vista eventos_vigentes.
const ARCHIVADO = "COALESCE(e.fin, e.inicio) + interval '24 hours' <= now()";
const SELECT_ADMIN = `
  SELECT e.id, e.nombre, e.categoria, e.modalidad, e.descripcion, e.lugar_nombre, e.direccion, e.barrio,
         e.lugar_id, e.lat, e.lng, e.inicio, e.fin, e.flyer_url, e.etiquetas, e.estado,
         (${ARCHIVADO}) AS archivado,
         (e.estado = 'aprobado' AND NOT (${ARCHIVADO})) AS vigente,
         e.propuesto_por, autor.nombre AS autor_nombre,
         e.creado_en, e.actualizado_en,
         e.revisado_por, revisor.nombre AS revisor_nombre, e.revisado_en, e.motivo_rechazo,
         e.retirado_por, retiro.nombre AS retiro_nombre, e.retirado_en,
         e.ia_veredicto, e.ia_confianza, e.ia_motivo, e.ia_analizado_en
  FROM eventos e
  LEFT JOIN usuarios autor ON autor.id = e.propuesto_por
  LEFT JOIN usuarios revisor ON revisor.id = e.revisado_por
  LEFT JOIN usuarios retiro ON retiro.id = e.retirado_por`;

function armarParaAdmin(f) {
  return {
    id: Number(f.id),
    nombre: f.nombre,
    categoria: f.categoria,
    modalidad: f.modalidad,
    descripcion: f.descripcion,
    lugar_nombre: f.lugar_nombre,
    direccion: f.direccion,
    barrio: f.barrio,
    lugar_id: f.lugar_id === null ? null : Number(f.lugar_id),
    lat: Number(f.lat),
    lng: Number(f.lng),
    inicio: f.inicio,
    fin: f.fin,
    flyer_url: f.flyer_url,
    etiquetas: f.etiquetas,
    estado: f.estado,
    vigente: f.vigente,
    archivado: f.archivado,
    autor: persona(f.propuesto_por, f.autor_nombre),
    creado_en: f.creado_en,
    actualizado_en: f.actualizado_en,
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
// Igual que en reportes, el total sale de la misma consulta y solo una página vacía lo pide aparte.
const FILTROS_ADMIN = `
  WHERE ($1::estado_revision IS NULL OR e.estado = $1::estado_revision)
    AND ($2::text IS NULL OR e.categoria = $2)
    AND ($3::boolean IS NULL OR (${ARCHIVADO}) = $3)
    AND ($4::veredicto_ia IS NULL OR e.ia_veredicto = $4::veredicto_ia)`;

async function listarParaAdmin({ estado, categoria, archivado, ia_veredicto, pagina, por_pagina }, db = pool) {
  const filtros = [estado ?? null, categoria ?? null, archivado ?? null, ia_veredicto ?? null];
  const { rows } = await db.query(
    `SELECT lista.*, count(*) OVER ()::int AS total FROM (${SELECT_ADMIN} ${FILTROS_ADMIN}) lista
     ORDER BY creado_en DESC, id DESC LIMIT $5 OFFSET $6`,
    [...filtros, por_pagina, (pagina - 1) * por_pagina],
  );
  if (rows.length === 0) {
    const conteo = await db.query(`SELECT count(*)::int AS total FROM eventos e ${FILTROS_ADMIN}`, filtros);
    return { datos: [], total: conteo.rows[0].total };
  }
  return { datos: rows.map(armarParaAdmin), total: rows[0].total };
}

// RF-15: detalle del panel, en cualquier estado (también los archivados, RF-12).
async function buscarParaAdmin(id, db = pool) {
  const { rows } = await db.query(`${SELECT_ADMIN} WHERE e.id = $1`, [id]);
  return rows[0] ? armarParaAdmin(rows[0]) : null;
}

// RF-13: el admin crea el evento ya publicado, sin pasar por la cola. Queda como autor y como
// quien lo revisó. Devuelve el id.
async function crearAprobado(d, adminId, db) {
  const { rows } = await db.query(
    `INSERT INTO eventos (nombre, categoria, modalidad, descripcion, lugar_nombre, direccion, barrio,
       lugar_id, lat, lng, inicio, fin, flyer_url, etiquetas, propuesto_por,
       estado, revisado_por, revisado_en)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'aprobado', $15, now())
     RETURNING id`,
    [d.nombre, d.categoria, d.modalidad, d.descripcion, d.lugar_nombre, d.direccion, d.barrio,
      d.lugar_id, d.lat, d.lng, d.inicio, d.fin, d.flyer_url, d.etiquetas, adminId],
  );
  return Number(rows[0].id);
}

// RF-13: el admin edita un evento pendiente o aprobado (reemplazo completo); no cambia su
// estado ni su autor. Supone que el servicio ya bloqueó la fila y controló el estado. Igual que
// la edición del autor, borra la pre-validación con IA (RF-20): describía el texto anterior.
async function editarComoAdmin(id, d, db) {
  await db.query(
    `UPDATE eventos
     SET nombre = $2, categoria = $3, modalidad = $4, descripcion = $5, lugar_nombre = $6,
         direccion = $7, barrio = $8, lugar_id = $9, lat = $10, lng = $11, inicio = $12, fin = $13,
         flyer_url = $14, etiquetas = $15,
         ia_veredicto = NULL, ia_confianza = NULL, ia_motivo = NULL, ia_analizado_en = NULL, actualizado_en = now()
     WHERE id = $1`,
    [id, d.nombre, d.categoria, d.modalidad, d.descripcion, d.lugar_nombre, d.direccion, d.barrio,
      d.lugar_id, d.lat, d.lng, d.inicio, d.fin, d.flyer_url, d.etiquetas],
  );
}

// RF-08: pendiente → aprobado. Aparece en la agenda mientras no esté archivado (RF-12).
// Igual que en reportes, cada acción supone la fila ya bloqueada y el estado controlado.
async function aprobar(id, adminId, db) {
  await db.query(
    `UPDATE eventos SET estado = 'aprobado', revisado_por = $2, revisado_en = now(), actualizado_en = now()
     WHERE id = $1`,
    [id, adminId],
  );
}

// RF-08: pendiente → rechazado, con el motivo que ve el autor en "Mis envíos".
async function rechazar(id, adminId, motivo, db) {
  await db.query(
    `UPDATE eventos SET estado = 'rechazado', motivo_rechazo = $3, revisado_por = $2, revisado_en = now(),
       actualizado_en = now()
     WHERE id = $1`,
    [id, adminId, motivo],
  );
}

// RF-13: aprobado → retirado (ej. un evento suspendido), sin motivo.
async function retirar(id, adminId, db) {
  await db.query(
    `UPDATE eventos SET estado = 'retirado', retirado_por = $2, retirado_en = now(), actualizado_en = now()
     WHERE id = $1`,
    [id, adminId],
  );
}

module.exports = {
  listarVigentes,
  buscarVigentePorId,
  crearPropuesta,
  editarPendiente,
  cancelarPendiente,
  listarParaAdmin,
  buscarParaAdmin,
  crearAprobado,
  editarComoAdmin,
  aprobar,
  rechazar,
  retirar,
};
