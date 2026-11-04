// Datos de demostración (#97; RF-07, RF-08, RF-11): npm run seed-demo
//
//   npm run seed-demo                     crea el usuario de demostración y sus reportes y eventos
//                                         (si ya están cargados, no hace nada)
//   npm run seed-demo -- --reiniciar      borra los de ejemplo y los vuelve a crear (las alertas
//                                         aprobadas arrancan otra vez sus 24 hs)
//   npm run seed-demo -- --borrar         borra los de ejemplo y el usuario de demostración
//
// La contraseña del usuario sale de DEMO_PASSWORD (backend/.env); nunca va en el repo.
// Igual que `npm run seed`, contra otra base que no sea la de desarrollo exige --confirmar-produccion.
const bcrypt = require('bcrypt');
const { registro } = require('../src/schemas/auth');
const { USUARIO_DEMO, MOTIVO_RECHAZO_DEMO, reportes, eventos } = require('./demo-datos');

const COSTO_BCRYPT = process.env.NODE_ENV === 'test' ? 4 : 12;

// Solo se toca una cuenta que tenga la forma de la que crea este script. Si alguien hubiera
// registrado ese email, o lo hicieran admin, el script se frena en vez de usarla o borrarla.
function esCuentaDemo(usuario) {
  return usuario.nombre === USUARIO_DEMO.nombre && usuario.rol === 'ciudadano' && usuario.email_verificado;
}

function errorCuentaAjena() {
  return new Error(
    `Ya existe una cuenta ${USUARIO_DEMO.email} que no es la de demostración (otro nombre, otro rol ` +
    'o sin verificar). No se tocó nada; revisala a mano.',
  );
}

async function enTransaccion(pool, trabajo) {
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');
    const resultado = await trabajo(cliente);
    await cliente.query('COMMIT');
    return resultado;
  } catch (err) {
    await cliente.query('ROLLBACK');
    throw err;
  } finally {
    cliente.release();
  }
}

// accion: 'cargar' | 'reiniciar' | 'borrar'. password: la de DEMO_PASSWORD; hace falta
// solo cuando todavía no existe el usuario.
async function sembrarDemo({ accion = 'cargar', password } = {}) {
  const demo = require('../src/models/demo');
  const pool = require('../src/db/pool');
  const env = require('../src/config/env');

  let passwordHash = null;
  if (accion !== 'borrar' && password !== undefined) {
    const valida = registro.shape.password.safeParse(password);
    if (!valida.success) throw new Error(`DEMO_PASSWORD no sirve: ${valida.error.issues[0].message}`);
    passwordHash = await bcrypt.hash(password, COSTO_BCRYPT);
  }

  return enTransaccion(pool, async (db) => {
    if (accion === 'borrar') {
      const usuario = await demo.buscarUsuario(USUARIO_DEMO.email, db);
      if (!usuario) return { usuario: 'no_existia', reportes: 0, eventos: 0 };
      if (!esCuentaDemo(usuario)) throw errorCuentaAjena();
      const borrados = await demo.borrarEnvios(usuario.id, db);
      await demo.borrarUsuario(usuario.id, db);
      return { usuario: 'borrado', ...borrados };
    }

    const existia = await demo.buscarUsuario(USUARIO_DEMO.email, db);
    if (!existia && !passwordHash) {
      throw new Error('Falta DEMO_PASSWORD en backend/.env para crear el usuario de demostración.');
    }
    const usuario = existia ?? await demo.asegurarUsuario(
      { ...USUARIO_DEMO, passwordHash, terminosVersion: env.TERMINOS_VERSION }, db,
    );
    if (!esCuentaDemo(usuario)) throw errorCuentaAjena();

    if (accion === 'reiniciar') await demo.borrarEnvios(usuario.id, db);
    else {
      const ya = await demo.contarEnvios(usuario.id, db);
      if (ya.reportes + ya.eventos > 0) {
        return { usuario: 'existia', ya_cargados: true, reportes: 0, eventos: 0 };
      }
    }

    const creadosReportes = await demo.crearReportes(reportes, usuario.id, MOTIVO_RECHAZO_DEMO, db);
    const creadosEventos = await demo.crearEventos(eventos, usuario.id, db);
    return {
      usuario: existia ? 'existia' : 'creado',
      ya_cargados: false,
      reportes: creadosReportes,
      eventos: creadosEventos,
    };
  });
}

async function main() {
  const args = process.argv.slice(2);
  const { destino, esOtraBase } = require('./index');
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
  if (args.includes('--borrar') && args.includes('--reiniciar')) {
    console.error('Usá --borrar o --reiniciar, no los dos juntos.');
    process.exitCode = 1;
    return;
  }
  let accion = 'cargar';
  if (args.includes('--borrar')) accion = 'borrar';
  else if (args.includes('--reiniciar')) accion = 'reiniciar';

  const pool = require('../src/db/pool');
  try {
    console.log(`Datos de demostración en ${destino(env.DATABASE_URL)} (${accion})...`);
    const password = process.env.DEMO_PASSWORD || undefined;
    const r = await sembrarDemo({ accion, password });
    if (accion === 'borrar') {
      console.log(r.usuario === 'no_existia'
        ? 'No había datos de demostración.'
        : `Listo: borrados ${r.reportes} reportes, ${r.eventos} eventos y el usuario ${USUARIO_DEMO.email}.`);
    } else if (r.ya_cargados) {
      console.log('Ya estaban cargados; no se creó nada. Usá --reiniciar para cargarlos de nuevo.');
    } else {
      console.log(`Listo: ${r.reportes} reportes y ${r.eventos} eventos de ejemplo a nombre de ` +
        `${USUARIO_DEMO.email} (usuario ${r.usuario}).`);
    }
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error('El seed de demostración falló:', err.message);
    process.exitCode = 1;
  });
}

module.exports = { sembrarDemo };
