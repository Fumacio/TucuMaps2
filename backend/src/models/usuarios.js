const pool = require('../db/pool');

const COLUMNAS = 'id, nombre, email, password_hash, rol, email_verificado, bloqueado, token_version';

async function buscarPorEmail(email, db = pool) {
  const { rows } = await db.query(`SELECT ${COLUMNAS} FROM usuarios WHERE email = $1`, [email]);
  return rows[0] ?? null;
}

async function buscarPorId(id, db = pool) {
  const { rows } = await db.query(`SELECT ${COLUMNAS} FROM usuarios WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

// Bloquea la fila del usuario hasta el fin de la transacción, para que dos
// solicitudes simultáneas del mismo usuario se ejecuten una después de la otra.
// FOR NO KEY UPDATE no frena los INSERT de otras tablas que apuntan al usuario.
// Devuelve el estado actual (por si cambió desde que se verificó la sesión), o null.
async function bloquearFila(id, db) {
  const { rows } = await db.query(
    'SELECT id, rol, bloqueado FROM usuarios WHERE id = $1 FOR NO KEY UPDATE',
    [id],
  );
  return rows[0] ?? null;
}

async function crear({ nombre, email, passwordHash, terminosVersion }, db = pool) {
  const { rows } = await db.query(
    `INSERT INTO usuarios (nombre, email, password_hash, terminos_version, terminos_aceptados_en)
     VALUES ($1, $2, $3, $4, now())
     RETURNING ${COLUMNAS}`,
    [nombre, email, passwordHash, terminosVersion],
  );
  return rows[0];
}

async function incrementarTokenVersion(id, db = pool) {
  const { rows } = await db.query(
    `UPDATE usuarios SET token_version = token_version + 1 WHERE id = $1 RETURNING ${COLUMNAS}`,
    [id],
  );
  return rows[0] ?? null;
}

// Cambia la contraseña e invalida todas las sesiones anteriores.
async function cambiarPassword(id, passwordHash, db = pool) {
  const { rows } = await db.query(
    `UPDATE usuarios SET password_hash = $2, token_version = token_version + 1
     WHERE id = $1 RETURNING ${COLUMNAS}`,
    [id, passwordHash],
  );
  return rows[0] ?? null;
}

async function marcarEmailVerificado(id, db = pool) {
  await db.query('UPDATE usuarios SET email_verificado = TRUE WHERE id = $1', [id]);
}

// RF-25: el nombre se cambia al instante.
async function cambiarNombre(id, nombre, db = pool) {
  const { rows } = await db.query(`UPDATE usuarios SET nombre = $2 WHERE id = $1 RETURNING ${COLUMNAS}`, [
    id,
    nombre,
  ]);
  return rows[0] ?? null;
}

// RF-25: el email nuevo ya lo confirmó el enlace, así que queda verificado. Si otra cuenta
// lo usa, la restricción UNIQUE de la base hace fallar el UPDATE (código 23505).
async function cambiarEmail(id, email, db = pool) {
  const { rows } = await db.query(
    `UPDATE usuarios SET email = $2, email_verificado = TRUE WHERE id = $1 RETURNING ${COLUMNAS}`,
    [id, email],
  );
  return rows[0] ?? null;
}

async function hacerAdmin(email, db = pool) {
  const { rows } = await db.query(
    `UPDATE usuarios SET rol = 'admin' WHERE email = $1 RETURNING ${COLUMNAS}`,
    [email],
  );
  return rows[0] ?? null;
}

// ---------- Administración (RF-16, RF-15) ----------
// El panel ve los datos de contacto y la actividad, nunca password_hash ni token_version.
// envios: reportes + propuestas de eventos; rechazos: los que terminaron rechazados.
const SELECT_ADMIN = `
  SELECT u.id, u.nombre, u.email, u.rol, u.email_verificado, u.bloqueado, u.creado_en,
         (SELECT count(*) FROM reportes r WHERE r.usuario_id = u.id)
           + (SELECT count(*) FROM eventos e WHERE e.propuesto_por = u.id) AS envios,
         (SELECT count(*) FROM reportes r WHERE r.usuario_id = u.id AND r.estado = 'rechazado')
           + (SELECT count(*) FROM eventos e WHERE e.propuesto_por = u.id AND e.estado = 'rechazado') AS rechazos
  FROM usuarios u`;

const armarParaAdmin = ({ id, envios, rechazos, ...resto }) => ({
  id: Number(id),
  ...resto,
  envios: Number(envios),
  rechazos: Number(rechazos),
});

// q busca en el nombre o el email sin distinguir mayúsculas. Los comodines de LIKE (% y _) que
// escriba el admin se buscan como texto, no como comodines.
const FILTROS_ADMIN = `
  WHERE ($1::boolean IS NULL OR u.bloqueado = $1)
    AND ($2::text IS NULL OR u.nombre ILIKE $2 ESCAPE '\\' OR u.email ILIKE $2 ESCAPE '\\')`;
const patronBusqueda = (q) => (q ? `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%` : null);

// RF-16: lista del panel, del más nuevo al más viejo. Igual que en reportes, el total sale de la
// misma consulta y solo una página vacía lo pide aparte.
async function listarParaAdmin({ bloqueado, q, pagina, por_pagina }, db = pool) {
  const filtros = [bloqueado ?? null, patronBusqueda(q)];
  const { rows } = await db.query(
    `SELECT lista.*, count(*) OVER ()::int AS total FROM (${SELECT_ADMIN} ${FILTROS_ADMIN}) lista
     ORDER BY creado_en DESC, id DESC LIMIT $3 OFFSET $4`,
    [...filtros, por_pagina, (pagina - 1) * por_pagina],
  );
  if (rows.length === 0) {
    const conteo = await db.query(`SELECT count(*)::int AS total FROM usuarios u ${FILTROS_ADMIN}`, filtros);
    return { datos: [], total: conteo.rows[0].total };
  }
  return { datos: rows.map(({ total, ...u }) => armarParaAdmin(u)), total: rows[0].total }; // eslint-disable-line no-unused-vars
}

async function buscarParaAdmin(id, db = pool) {
  const { rows } = await db.query(`${SELECT_ADMIN} WHERE u.id = $1`, [id]);
  return rows[0] ? armarParaAdmin(rows[0]) : null;
}

// RF-16: bloquear o desbloquear. La sesión se corta sola: requerirSesion mira `bloqueado` en
// cada solicitud. No cambia token_version, así al desbloquearlo puede volver a entrar.
async function cambiarBloqueo(id, bloqueado, db) {
  await db.query('UPDATE usuarios SET bloqueado = $2 WHERE id = $1', [id, bloqueado]);
}

module.exports = {
  buscarPorEmail,
  buscarPorId,
  bloquearFila,
  crear,
  incrementarTokenVersion,
  cambiarPassword,
  marcarEmailVerificado,
  cambiarNombre,
  cambiarEmail,
  hacerAdmin,
  listarParaAdmin,
  buscarParaAdmin,
  cambiarBloqueo,
};
