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

// ---------- Seed (npm run seed) ----------
// La tabla no tiene una clave natural: el seed reconoce sus lugares por el nombre.
const CAMPOS_SEED = ['nombre', 'categoria', 'descripcion', 'contenido_historico', 'fuente',
  'direccion', 'localidad', 'barrio', 'horarios', 'imagen_url', 'lat', 'lng'];
const valoresSeed = (lugar) => CAMPOS_SEED.map((c) => lugar[c] ?? null);

// Inserta el lugar solo si no hay otro con el mismo nombre. Devuelve true si lo creó.
async function crearSiNoExiste(lugar, db = pool) {
  const { rowCount } = await db.query(
    `INSERT INTO lugares (nombre, categoria, descripcion, contenido_historico, fuente,
                          direccion, localidad, barrio, horarios, imagen_url, lat, lng)
     SELECT $1::text, $2::text, $3::text, $4::text, $5::text, $6::text,
            COALESCE($7::text, 'San Miguel de Tucumán'), $8::text, $9::text, $10::text,
            $11::numeric, $12::numeric
     WHERE NOT EXISTS (SELECT 1 FROM lugares WHERE nombre = $1::text)`,
    valoresSeed(lugar),
  );
  return rowCount === 1;
}

// Actualiza un lugar existente con los datos del seed. Los campos en null del seed no
// pisan lo que ya haya en la base (por ejemplo, un texto cargado desde el panel).
async function actualizarDesdeSeed(lugar, db = pool) {
  const { rowCount } = await db.query(
    `UPDATE lugares SET
       categoria = $2,
       descripcion = COALESCE($3, descripcion),
       contenido_historico = COALESCE($4, contenido_historico),
       fuente = COALESCE($5, fuente),
       direccion = COALESCE($6, direccion),
       localidad = COALESCE($7, localidad),
       barrio = COALESCE($8, barrio),
       horarios = COALESCE($9, horarios),
       imagen_url = COALESCE($10, imagen_url),
       lat = $11, lng = $12,
       actualizado_en = now()
     WHERE nombre = $1`,
    valoresSeed(lugar),
  );
  return rowCount > 0;
}

module.exports = { listarActivos, buscarActivoPorId, crearSiNoExiste, actualizarDesdeSeed };
