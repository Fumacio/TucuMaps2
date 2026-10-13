// Carga inicial de datos (RF-02): npm run seed
//
//   npm run seed                      crea los lugares que falten (no toca los existentes)
//   npm run seed -- --actualizar      además pone en los existentes los datos del seed
//                                     (categoría y coordenadas siempre; el resto si no es null)
//
// Por defecto escribe en la DATABASE_URL de backend/.env (la rama "desarrollo" de Neon).
// Si la base es otra (por ejemplo, producción puesta en la terminal) o NODE_ENV no es
// development, exige además --confirmar-produccion.
const fs = require('node:fs');
const path = require('node:path');
const dotenv = require('dotenv');
const lugaresSeed = require('./lugares');

// Carga los lugares del seed y oculta los retirados del alcance (ver seeds/lugares.js).
async function sembrarLugares(opciones, db) {
  const lugaresModel = require('../src/models/lugares');
  const resumen = await lugaresModel.cargarDesdeSeed(lugaresSeed, opciones, db);
  resumen.ocultados = await lugaresModel.ocultarPorNombre(lugaresSeed.retirados, db);
  return resumen;
}

// Host y base, sin usuario, contraseña ni parámetros.
function destino(url) {
  try {
    const u = new URL(url);
    return `${u.hostname}${u.pathname}`;
  } catch {
    return '(DATABASE_URL inválida)';
  }
}

// true si se va a escribir en una base que no es la de desarrollo de backend/.env.
function esOtraBase(urlDestino) {
  const archivo = path.join(__dirname, '..', '.env');
  const delArchivo = fs.existsSync(archivo) ? dotenv.parse(fs.readFileSync(archivo)).DATABASE_URL : undefined;
  const entorno = process.env.NODE_ENV ?? 'development';
  return entorno !== 'development' || !delArchivo || destino(urlDestino) !== destino(delArchivo);
}

async function main() {
  const args = process.argv.slice(2);
  // env.js carga .env sin pisar una DATABASE_URL ya definida en la terminal.
  const env = require('../src/config/env');
  if (esOtraBase(env.DATABASE_URL) && !args.includes('--confirmar-produccion')) {
    console.error(
      `La base de destino (${destino(env.DATABASE_URL)}) no es la de desarrollo de backend/.env.\n` +
      'Si de verdad querés cargar ahí (por ejemplo, producción), agregá --confirmar-produccion.',
    );
    process.exitCode = 1;
    return;
  }

  const pool = require('../src/db/pool');
  try {
    console.log(`Cargando ${lugaresSeed.length} lugares en ${destino(env.DATABASE_URL)}...`);
    const r = await sembrarLugares({ actualizar: args.includes('--actualizar') });
    console.log(
      `Listo: ${r.creados} creados, ${r.actualizados} actualizados, ${r.sin_cambios} sin cambios, ` +
      `${r.ocultados} ocultados.`,
    );
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
