const pool = require('../db/pool');
const { aNumeros } = require('./comunes');

// La vista eventos_vigentes ya deja solo los aprobados y los saca 24 hs después de su fin,
// o de su inicio si no tiene fin (RF-08, RF-12). No tiene propuesto_por: el autor nunca sale.
const COLUMNAS = `id, nombre, categoria, modalidad, descripcion, lugar_nombre, direccion, barrio,
  lat, lng, inicio, fin, flyer_url, etiquetas`;

// Con desde/hasta devuelve los eventos que se cruzan con ese rango: todavía no terminaron
// en `desde` y ya empezaron en `hasta`.
async function listarVigentes({ categoria, desde, hasta } = {}, db = pool) {
  const { rows } = await db.query(
    `SELECT ${COLUMNAS} FROM eventos_vigentes
     WHERE ($1::text IS NULL OR categoria = $1)
       AND ($2::timestamptz IS NULL OR COALESCE(fin, inicio) >= $2)
       AND ($3::timestamptz IS NULL OR inicio <= $3)
     ORDER BY inicio, id`,
    [categoria ?? null, desde ?? null, hasta ?? null],
  );
  return rows.map(aNumeros);
}

async function buscarVigentePorId(id, db = pool) {
  const { rows } = await db.query(`SELECT ${COLUMNAS} FROM eventos_vigentes WHERE id = $1`, [id]);
  return rows[0] ? aNumeros(rows[0]) : null;
}

module.exports = { listarVigentes, buscarVigentePorId };
