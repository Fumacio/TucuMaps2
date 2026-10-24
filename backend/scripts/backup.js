// Copia de seguridad de la base (SRS 4.3, "Copias de seguridad"): npm run backup
//
// Hace un pg_dump de BACKUP_DATABASE_URL (la rama "production" de Neon) en BACKUP_DIR
// y borra las copias de más de BACKUP_DIAS días (30 por defecto, según la Política de
// Privacidad). Se programa en la compu de Nacho con el Programador de tareas de Windows;
// no usa GitHub Actions. Ver "Copias de seguridad" en docs/Tecnologias TucuMaps.md.
//
// Necesita pg_dump de la misma versión que el servidor o más nueva (Neon usa PostgreSQL 18).
// Si pg_dump no está en el PATH, poner la ruta completa en PG_DUMP.
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const dotenv = require('dotenv');

const PREFIJO = 'tucumaps-';
const EXTENSION = '.dump';
const DIA_MS = 24 * 60 * 60 * 1000;

// Cadena de conexión para pg_dump sin la contraseña, que viaja aparte en PGPASSWORD: así
// no aparece en la lista de procesos. El resto de la cadena (sslmode, channel_binding, etc.)
// lo interpreta pg_dump tal cual.
function conexion(url) {
  let u;
  try {
    u = new URL(url);
  } catch {
    throw new Error('BACKUP_DATABASE_URL no es una cadena de conexión válida.');
  }
  if (u.protocol !== 'postgres:' && u.protocol !== 'postgresql:') {
    throw new Error('BACKUP_DATABASE_URL tiene que empezar con postgres:// o postgresql://');
  }
  const password = decodeURIComponent(u.password);
  u.password = '';
  return { dbname: u.toString(), password, destino: `${u.hostname}${u.pathname}` };
}

// Entorno de pg_dump: el de la terminal sin ninguna variable PG* (PGSSLMODE=disable de otra
// prueba, por ejemplo), así la conexión depende solo de BACKUP_DATABASE_URL.
function entornoPgDump(entorno, password) {
  const limpio = Object.fromEntries(Object.entries(entorno).filter(([clave]) => !clave.toUpperCase().startsWith('PG')));
  return password ? { ...limpio, PGPASSWORD: password } : limpio;
}

// tucumaps-2026-10-24T04-30-00Z.dump: ordenable y sin ":" (Windows no los acepta).
function nombreArchivo(fecha) {
  return `${PREFIJO}${fecha.toISOString().slice(0, 19).replace(/:/g, '-')}Z${EXTENSION}`;
}

// Fecha de una copia a partir de su nombre; null si el archivo no es una copia nuestra.
// También reconoce las .parcial que quedaron de una copia cortada (apagón, tarea frenada),
// para que la retención las borre y no queden datos personales más de 30 días.
function fechaDeArchivo(nombre) {
  const m = /^tucumaps-(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2})Z\.dump(?:\.parcial)?$/.exec(nombre);
  if (!m) return null;
  const fecha = new Date(`${m[1]}T${m[2]}:${m[3]}:${m[4]}Z`);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

// Copias con más de `dias` días. Solo mira archivos con nuestro formato de nombre, así
// nunca borra otra cosa que haya en la carpeta.
function archivosVencidos(nombres, ahora, dias) {
  return nombres.filter((nombre) => {
    const fecha = fechaDeArchivo(nombre);
    return fecha !== null && ahora.getTime() - fecha.getTime() > dias * DIA_MS;
  });
}

function leerConfiguracion(entorno) {
  const url = entorno.BACKUP_DATABASE_URL;
  if (!url) {
    throw new Error('Falta BACKUP_DATABASE_URL en backend/.env (cadena de conexión de la rama production de Neon).');
  }
  const dias = Number(entorno.BACKUP_DIAS || 30);
  if (!Number.isInteger(dias) || dias < 1) throw new Error('BACKUP_DIAS tiene que ser un número entero mayor que 0.');
  return {
    url,
    dias,
    carpeta: path.resolve(__dirname, '..', entorno.BACKUP_DIR || 'backups'),
    pgDump: entorno.PG_DUMP || 'pg_dump',
  };
}

function correrPgDump(pgDump, dbname, archivo, entorno) {
  return new Promise((resolve, reject) => {
    // Formato "custom": comprimido y se restaura con pg_restore, tabla por tabla si hace falta.
    const proceso = spawn(pgDump, ['--format=custom', '--no-owner', '--no-privileges', `--file=${archivo}`, `--dbname=${dbname}`], {
      env: entorno,
      stdio: ['ignore', 'inherit', 'inherit'],
    });
    proceso.on('error', (err) => {
      reject(err.code === 'ENOENT' ? new Error(`No se encontró pg_dump (${pgDump}). Instalalo o poné su ruta en PG_DUMP.`) : err);
    });
    proceso.on('close', (codigo) => {
      if (codigo === 0) resolve();
      else reject(new Error(`pg_dump terminó con código ${codigo}.`));
    });
  });
}

async function main() {
  // Sin pisar lo que ya esté definido en la terminal (igual que config/env.js).
  dotenv.config({ path: path.join(__dirname, '..', '.env'), quiet: true });
  const config = leerConfiguracion(process.env);
  const db = conexion(config.url);
  fs.mkdirSync(config.carpeta, { recursive: true });

  const ahora = new Date();
  const final = path.join(config.carpeta, nombreArchivo(ahora));
  // Se escribe con otro nombre y se renombra al final: una copia cortada a la mitad
  // nunca queda con el nombre de una copia buena.
  const parcial = `${final}.parcial`;
  console.log(`Copiando ${db.destino} en ${final}...`);
  try {
    await correrPgDump(config.pgDump, db.dbname, parcial, entornoPgDump(process.env, db.password));
    fs.renameSync(parcial, final);
  } catch (err) {
    fs.rmSync(parcial, { force: true });
    throw err;
  }
  const kb = Math.round(fs.statSync(final).size / 1024);
  console.log(`Listo: ${path.basename(final)} (${kb} KB).`);

  // Las viejas se borran recién después de tener una copia nueva buena.
  const vencidos = archivosVencidos(fs.readdirSync(config.carpeta), ahora, config.dias);
  for (const nombre of vencidos) fs.rmSync(path.join(config.carpeta, nombre));
  if (vencidos.length > 0) console.log(`Copias de más de ${config.dias} días borradas: ${vencidos.length}.`);
}

if (require.main === module) {
  main().catch((err) => {
    console.error(`La copia de seguridad falló: ${err.message}`);
    process.exitCode = 1;
  });
}

module.exports = { conexion, entornoPgDump, leerConfiguracion, nombreArchivo, fechaDeArchivo, archivosVencidos };
