const pool = require('../db/pool');

// Columnas que se muestran en el mapa. El detalle suma el contenido histórico y su fuente.
const COLUMNAS_LISTA = `id, nombre, categoria, descripcion, direccion, localidad, barrio,
  horarios, imagen_url, lat, lng`;
const COLUMNAS_DETALLE = `${COLUMNAS_LISTA}, contenido_historico, fuente`;

// PostgreSQL devuelve BIGINT y NUMERIC como texto: se pasan a número para el mapa.
const aNumeros = (fila) => ({ ...fila, id: Number(fila.id), lat: Number(fila.lat), lng: Number(fila.lng) });

async function listarActivos({ categoria } = {}, db = pool) {
  const { rows } = await db.query(
    `SELECT ${COLUMNAS_LISTA} FROM lugares
     WHERE activo AND ($1::text IS NULL OR categoria = $1)
     ORDER BY nombre`,
    [categoria ?? null],
  );
  return rows.map(aNumeros);
}

async function buscarActivoPorId(id, db = pool) {
  const { rows } = await db.query(
    `SELECT ${COLUMNAS_DETALLE} FROM lugares WHERE id = $1 AND activo`,
    [id],
  );
  return rows[0] ? aNumeros(rows[0]) : null;
}

module.exports = { listarActivos, buscarActivoPorId };
