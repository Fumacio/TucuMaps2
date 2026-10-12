const { Pool } = require('pg');
const env = require('../config/env');

// Neon exige SSL; la cadena de conexión ya trae sslmode.
const pool = new Pool({ connectionString: env.DATABASE_URL, max: 10 });

// Neon cierra las conexiones inactivas cuando la base entra en reposo. Sin este
// manejador, ese error sin escuchar tiraría abajo el proceso.
pool.on('error', (err) => {
  console.error('Conexión inactiva de PostgreSQL cerrada:', err.message);
});

// Ejecuta fn(cliente) dentro de una transacción: si algo falla, se deshace todo.
async function enTransaccion(fn) {
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');
    const resultado = await fn(cliente);
    await cliente.query('COMMIT');
    return resultado;
  } catch (err) {
    await cliente.query('ROLLBACK');
    throw err;
  } finally {
    cliente.release();
  }
}

module.exports = pool;
module.exports.enTransaccion = enTransaccion;
