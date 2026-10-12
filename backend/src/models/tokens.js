// Tokens de un solo uso para los enlaces de los correos (RF-03).
// En la base se guarda solo el hash SHA-256; el token en claro viaja en el enlace.
const pool = require('../db/pool');

async function crear({ usuarioId, tipo, tokenHash, minutos }, db = pool) {
  await db.query(
    `INSERT INTO tokens_usuario (usuario_id, tipo, token_hash, expira_en)
     VALUES ($1, $2, $3, now() + make_interval(mins => $4))`,
    [usuarioId, tipo, tokenHash, minutos],
  );
}

// Marca el token como usado y devuelve su usuario, solo si existe, es del tipo
// pedido, no se usó y no venció. Es atómico: dos usos simultáneos no pueden ganar los dos.
async function consumir({ tipo, tokenHash }, db = pool) {
  const { rows } = await db.query(
    `UPDATE tokens_usuario SET usado_en = now()
     WHERE token_hash = $1 AND tipo = $2 AND usado_en IS NULL AND expira_en > now()
     RETURNING usuario_id`,
    [tokenHash, tipo],
  );
  return rows[0]?.usuario_id ?? null;
}

// Invalida los tokens pendientes de un tipo (por ejemplo, al restablecer la contraseña).
async function invalidarPendientes({ usuarioId, tipo }, db = pool) {
  await db.query(
    `UPDATE tokens_usuario SET usado_en = now()
     WHERE usuario_id = $1 AND tipo = $2 AND usado_en IS NULL`,
    [usuarioId, tipo],
  );
}

// Cuántos tokens de un tipo se generaron en la última hora (RF-03: máximo 3 reenvíos por hora).
// La tabla no tiene fecha de creación: se deduce como expira_en - minutos de duración.
async function contarCreadosUltimaHora({ usuarioId, tipo, minutos }, db = pool) {
  const { rows } = await db.query(
    `SELECT count(*)::int AS cantidad FROM tokens_usuario
     WHERE usuario_id = $1 AND tipo = $2
       AND expira_en - make_interval(mins => $3) > now() - interval '1 hour'`,
    [usuarioId, tipo, minutos],
  );
  return rows[0].cantidad;
}

module.exports = { crear, consumir, invalidarPendientes, contarCreadosUltimaHora };
