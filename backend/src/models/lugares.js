const pool = require('../db/pool');
const { aNumeros } = require('./comunes');

// Columnas que se muestran en el mapa. El detalle suma el contenido histórico y su fuente.
const COLUMNAS_LISTA = `id, nombre, categoria, descripcion, direccion, localidad, barrio,
  horarios, imagen_url, lat, lng`;
const COLUMNAS_DETALLE = `${COLUMNAS_LISTA}, contenido_historico, fuente`;

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

// ---------- Seed (npm run seed) ----------
// El seed reconoce sus lugares por el nombre (índice único lugares_nombre_unico).
// Todo va en una sola sentencia, así que es atómico y no hace falta bloquear la tabla.
const CAMPOS_SEED = ['nombre', 'categoria', 'descripcion', 'contenido_historico', 'fuente',
  'direccion', 'localidad', 'barrio', 'horarios', 'imagen_url', 'lat', 'lng'];

// Con actualizar = true, los lugares existentes toman los valores del seed: categoría y
// coordenadas siempre; los demás campos solo si en el seed no son null (así no se borra un
// texto cargado desde el panel). Un lugar que ya coincide no cuenta como actualizado.
const AL_COINCIDIR = {
  nada: 'DO NOTHING',
  actualizar: `DO UPDATE SET
       categoria = EXCLUDED.categoria,
       descripcion = COALESCE(EXCLUDED.descripcion, lugares.descripcion),
       contenido_historico = COALESCE(EXCLUDED.contenido_historico, lugares.contenido_historico),
       fuente = COALESCE(EXCLUDED.fuente, lugares.fuente),
       direccion = COALESCE(EXCLUDED.direccion, lugares.direccion),
       localidad = EXCLUDED.localidad,
       barrio = COALESCE(EXCLUDED.barrio, lugares.barrio),
       horarios = COALESCE(EXCLUDED.horarios, lugares.horarios),
       imagen_url = COALESCE(EXCLUDED.imagen_url, lugares.imagen_url),
       lat = EXCLUDED.lat,
       lng = EXCLUDED.lng,
       actualizado_en = now()
     WHERE (lugares.categoria, lugares.descripcion, lugares.contenido_historico, lugares.fuente,
            lugares.direccion, lugares.localidad, lugares.barrio, lugares.horarios,
            lugares.imagen_url, lugares.lat, lugares.lng)
       IS DISTINCT FROM
           (EXCLUDED.categoria, COALESCE(EXCLUDED.descripcion, lugares.descripcion),
            COALESCE(EXCLUDED.contenido_historico, lugares.contenido_historico),
            COALESCE(EXCLUDED.fuente, lugares.fuente), COALESCE(EXCLUDED.direccion, lugares.direccion),
            EXCLUDED.localidad, COALESCE(EXCLUDED.barrio, lugares.barrio),
            COALESCE(EXCLUDED.horarios, lugares.horarios),
            COALESCE(EXCLUDED.imagen_url, lugares.imagen_url), EXCLUDED.lat, EXCLUDED.lng)`,
};

// Devuelve { creados, actualizados, sin_cambios }.
async function cargarDesdeSeed(lugares, { actualizar = false } = {}, db = pool) {
  const datos = lugares.map((l) => Object.fromEntries(CAMPOS_SEED.map((c) => [c, l[c] ?? null])));
  const { rows } = await db.query(
    `INSERT INTO lugares (${CAMPOS_SEED.join(', ')})
     SELECT ${CAMPOS_SEED.join(', ')}
     FROM jsonb_to_recordset($1::jsonb) AS d(
       nombre text, categoria text, descripcion text, contenido_historico text, fuente text,
       direccion text, localidad text, barrio text, horarios text, imagen_url text,
       lat numeric, lng numeric)
     ON CONFLICT (nombre) ${actualizar ? AL_COINCIDIR.actualizar : AL_COINCIDIR.nada}
     RETURNING (xmax = 0) AS creado`,
    [JSON.stringify(datos)],
  );
  const creados = rows.filter((r) => r.creado).length;
  const actualizados = rows.length - creados;
  return { creados, actualizados, sin_cambios: lugares.length - rows.length };
}

module.exports = { listarActivos, buscarActivoPorId, cargarDesdeSeed };
