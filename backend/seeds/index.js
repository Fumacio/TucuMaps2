// Carga inicial de datos (RF-02): npm run seed
//
//   npm run seed                      crea los lugares que falten (no toca los existentes)
//   npm run seed -- --actualizar      además actualiza los existentes con los datos del seed
//
// Por defecto usa la DATABASE_URL de backend/.env (la rama "desarrollo" de Neon).
// Si DATABASE_URL viene de otro lado (por ejemplo, la de producción puesta en la terminal)
// o NODE_ENV es production, exige además --confirmar-produccion.
const fs = require('node:fs');
const path = require('node:path');
const dotenv = require('dotenv');
const lugaresSeed = require('./lugares');
const lugaresModel = require('../src/models/lugares');

// Carga los lugares en una transacción. Bloquea la tabla para que dos corridas a la vez
// no dupliquen lugares (la tabla no tiene una restricción UNIQUE por nombre).
async function sembrarLugares(pool, { actualizar = false } = {}) {
  const resumen = { creados: 0, actualizados: 0, sin_cambios: 0 };
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');
    await cliente.query('LOCK TABLE lugares IN SHARE ROW EXCLUSIVE MODE');
    for (const lugar of lugaresSeed) {
      if (await lugaresModel.crearSiNoExiste(lugar, cliente)) resumen.creados++;
      else if (actualizar && (await lugaresModel.actualizarDesdeSeed(lugar, cliente))) resumen.actualizados++;
      else resumen.sin_cambios++;
    }
    await cliente.query('COMMIT');
  } catch (err) {
    await cliente.query('ROLLBACK');
    throw err;
  } finally {
    cliente.release();
  }
  return resumen;
}

// true si la base de destino no es la de backend/.env.
function apuntaAOtraBase() {
  const archivo = path.join(__dirname, '..', '.env');
  const delArchivo = fs.existsSync(archivo) ? dotenv.parse(fs.readFileSync(archivo)).DATABASE_URL : undefined;
  return process.env.NODE_ENV === 'production' || process.env.DATABASE_URL !== delArchivo;
}

// Host y base, sin usuario ni contraseña, para mostrar a dónde se va a escribir.
function destino(url) {
  try {
    const u = new URL(url);
    return `${u.hostname}${u.pathname}`;
  } catch {
    return '(DATABASE_URL inválida)';
  }
}

async function main() {
  const args = process.argv.slice(2);
  require('dotenv').config({ quiet: true }); // no pisa una DATABASE_URL ya definida
  if (apuntaAOtraBase() && !args.includes('--confirmar-produccion')) {
    console.error(
      `La base de destino (${destino(process.env.DATABASE_URL)}) no es la de backend/.env.\n` +
      'Si de verdad querés cargar ahí (por ejemplo, producción), agregá --confirmar-produccion.',
    );
    process.exitCode = 1;
    return;
  }

  const pool = require('../src/db/pool');
  try {
    console.log(`Cargando ${lugaresSeed.length} lugares en ${destino(process.env.DATABASE_URL)}...`);
    const r = await sembrarLugares(pool, { actualizar: args.includes('--actualizar') });
    console.log(`Listo: ${r.creados} creados, ${r.actualizados} actualizados, ${r.sin_cambios} sin cambios.`);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error('El seed falló:', err.message);
    process.exitCode = 1;
  });
}

module.exports = { sembrarLugares };
