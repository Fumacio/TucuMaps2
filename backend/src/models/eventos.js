const pool = require('../db/pool');
const { aNumeros } = require('./comunes');

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

module.exports = { listarVigentes, buscarVigentePorId, crearPropuesta };
