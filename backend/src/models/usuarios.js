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

async function hacerAdmin(email, db = pool) {
  const { rows } = await db.query(
    `UPDATE usuarios SET rol = 'admin' WHERE email = $1 RETURNING ${COLUMNAS}`,
    [email],
  );
  return rows[0] ?? null;
}

module.exports = {
  buscarPorEmail,
  buscarPorId,
  bloquearFila,
  crear,
  incrementarTokenVersion,
  cambiarPassword,
  marcarEmailVerificado,
  hacerAdmin,
};
