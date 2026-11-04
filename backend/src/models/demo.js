const pool = require('../db/pool');

// SQL de los datos de demostración (#97, npm run seed-demo). Todo lo de ejemplo queda a nombre
// del usuario de demostración: así se encuentra y se borra sin tocar datos reales.
// Las funciones reciben el cliente de la transacción que abre seeds/demo.js.

const ZONA = 'America/Argentina/Tucuman';

// Crea el usuario si no existe (con el email ya verificado) y lo bloquea hasta el final de la
// transacción, para que dos corridas simultáneas no carguen los datos dos veces.
async function asegurarUsuario({ nombre, email, passwordHash, terminosVersion }, db = pool) {
  if (passwordHash) {
    await db.query(
      `INSERT INTO usuarios (nombre, email, password_hash, email_verificado,
                             terminos_version, terminos_aceptados_en)
       VALUES ($1, $2, $3, true, $4, now())
       ON CONFLICT (email) DO NOTHING`,
      [nombre, email, passwordHash, terminosVersion],
    );
  }
  return buscarUsuario(email, db);
}

async function buscarUsuario(email, db = pool) {
  const { rows } = await db.query(
    `SELECT id, nombre, email, rol, email_verificado, bloqueado
     FROM usuarios WHERE email = $1 FOR UPDATE`,
    [email],
  );
  return rows[0] ? { ...rows[0], id: Number(rows[0].id) } : null;
}

async function contarEnvios(usuarioId, db = pool) {
  const { rows } = await db.query(
    `SELECT (SELECT count(*) FROM reportes WHERE usuario_id = $1)::int AS reportes,
            (SELECT count(*) FROM eventos WHERE propuesto_por = $1)::int AS eventos`,
    [usuarioId],
  );
  return rows[0];
}

// Los aprobados y el rechazado quedan revisados por el primer admin, si hay uno.
const PRIMER_ADMIN = "(SELECT id FROM usuarios WHERE rol = 'admin' ORDER BY id LIMIT 1)";

// RF-11: aprobado_en es "hace N minutos", así las alertas quedan dentro de sus 24 hs.
async function crearReportes(reportes, usuarioId, motivoRechazo, db = pool) {
  const { rowCount } = await db.query(
    `INSERT INTO reportes (usuario_id, tipo, descripcion, direccion, barrio, lat, lng, estado,
                           aprobado_en, revisado_por, revisado_en, motivo_rechazo,
                           creado_en, actualizado_en)
     SELECT $2, d.tipo, d.descripcion, d.direccion, d.barrio, d.lat, d.lng, d.estado::estado_reporte,
            CASE WHEN d.estado = 'aprobado' THEN d.momento END,
            CASE WHEN d.estado <> 'pendiente' THEN ${PRIMER_ADMIN} END,
            CASE WHEN d.estado <> 'pendiente' THEN d.momento END,
            CASE WHEN d.estado = 'rechazado' THEN $3 END,
            d.momento - interval '5 minutes', d.momento
     FROM (
       SELECT r.*, now() - make_interval(mins => r.minutos) AS momento
       FROM jsonb_to_recordset($1::jsonb) AS r(
         tipo text, descripcion text, direccion text, barrio text, lat numeric, lng numeric,
         estado text, minutos int)
     ) d`,
    [JSON.stringify(reportes), usuarioId, motivoRechazo],
  );
  return rowCount;
}

// Las fechas se calculan desde hoy en la hora de Tucumán. La sede (lugar_id) se busca por
// nombre entre los lugares activos; si no está, el evento queda sin sede.
async function crearEventos(eventos, usuarioId, db = pool) {
  const { rowCount } = await db.query(
    `INSERT INTO eventos (nombre, categoria, modalidad, descripcion, lugar_nombre, direccion, barrio,
                          lugar_id, lat, lng, inicio, fin, etiquetas, estado, propuesto_por,
                          revisado_por, revisado_en)
     SELECT d.nombre, d.categoria, d.modalidad, d.descripcion, d.lugar_nombre, d.direccion, d.barrio,
            (SELECT l.id FROM lugares l WHERE l.nombre = d.sede AND l.activo),
            d.lat, d.lng, d.inicio,
            CASE WHEN d.duracion IS NOT NULL THEN d.inicio + make_interval(hours => d.duracion) END,
            d.etiquetas, d.estado::estado_revision, $2,
            CASE WHEN d.estado = 'aprobado' THEN ${PRIMER_ADMIN} END,
            CASE WHEN d.estado = 'aprobado' THEN now() END
     FROM (
       SELECT e.*,
              (date_trunc('day', now() AT TIME ZONE '${ZONA}')
                 + make_interval(days => e.dia, hours => e.hora)) AT TIME ZONE '${ZONA}' AS inicio
       FROM jsonb_to_recordset($1::jsonb) AS e(
         nombre text, categoria text, modalidad text, descripcion text, lugar_nombre text,
         direccion text, barrio text, sede text, lat numeric, lng numeric, dia int, hora int,
         duracion int, etiquetas text[], estado text)
     ) d`,
    [JSON.stringify(eventos), usuarioId],
  );
  return rowCount;
}

// Borra lo del usuario de demostración. Las confirmaciones de sus reportes se van en cascada.
async function borrarEnvios(usuarioId, db = pool) {
  const reportes = await db.query('DELETE FROM reportes WHERE usuario_id = $1', [usuarioId]);
  const eventos = await db.query('DELETE FROM eventos WHERE propuesto_por = $1', [usuarioId]);
  return { reportes: reportes.rowCount, eventos: eventos.rowCount };
}

// Sus tokens y las confirmaciones que haya hecho se borran en cascada.
async function borrarUsuario(usuarioId, db = pool) {
  await db.query('DELETE FROM usuarios WHERE id = $1', [usuarioId]);
}

module.exports = {
  asegurarUsuario,
  buscarUsuario,
  contarEnvios,
  crearReportes,
  crearEventos,
  borrarEnvios,
  borrarUsuario,
};
