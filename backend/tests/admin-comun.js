// Ayudas compartidas de las pruebas del panel de administración (#46 a #48). No es un archivo
// de pruebas. Los datos se cargan directo en la base para no gastar solicitudes del límite
// general (100 por minuto en cada archivo).
const { pool, registrarYEntrar } = require('./helpers');

const HORA = 60 * 60 * 1000;
const haceHoras = (horas) => new Date(Date.now() - horas * HORA);

// Admin con sesión iniciada (agente de supertest con la cookie).
async function entrarComoAdmin(extra = {}) {
  const sesion = await registrarYEntrar({ nombre: 'Admin Uno', email: 'admin@mail.com', ...extra });
  await pool.query("UPDATE usuarios SET rol = 'admin' WHERE id = $1", [sesion.usuario.id]);
  return sesion;
}

// Ciudadano verificado cargado en la base, sin sesión. Devuelve su id.
async function crearCiudadano({ nombre = 'Ana Pérez', email = 'ana@mail.com' } = {}) {
  const { rows } = await pool.query(
    `INSERT INTO usuarios (nombre, email, password_hash, email_verificado, terminos_version, terminos_aceptados_en)
     VALUES ($1, $2, 'x', true, '1.0', now()) RETURNING id`,
    [nombre, email],
  );
  return Number(rows[0].id);
}

// Reporte cargado en la base; por defecto pendiente. Uno aprobado, por defecto hace una hora.
async function crearReporte({ usuarioId = null, estado = 'pendiente', aprobadoEn, creadoEn, tipo = 'robo_asalto' } = {}) {
  const aprobado = aprobadoEn ?? (['aprobado', 'resuelto', 'retirado'].includes(estado) ? haceHoras(1) : null);
  const { rows } = await pool.query(
    `INSERT INTO reportes (usuario_id, tipo, descripcion, direccion, barrio, lat, lng, estado, aprobado_en, creado_en)
     VALUES ($1, $2, 'Arrebatos frecuentes en la parada', 'Av. Mate de Luna 2400', 'Barrio Norte',
             -26.8235, -65.2301, $3, $4, COALESCE($5, now()))
     RETURNING id`,
    [usuarioId, tipo, estado, aprobado, creadoEn ?? null],
  );
  return Number(rows[0].id);
}

// Evento cargado en la base; por defecto pendiente, dentro de 3 días y de 4 horas.
async function crearEvento({ usuarioId = null, estado = 'pendiente', inicio, fin, categoria = 'musica', creadoEn } = {}) {
  const empieza = inicio ?? new Date(Date.now() + 72 * HORA);
  const termina = fin === undefined ? new Date(empieza.getTime() + 4 * HORA) : fin;
  const { rows } = await pool.query(
    `INSERT INTO eventos (nombre, categoria, modalidad, descripcion, lugar_nombre, direccion, barrio,
       lat, lng, inicio, fin, etiquetas, estado, propuesto_por, creado_en)
     VALUES ('Peña en el Parque', $1, 'a_la_gorra', 'Peña folclórica abierta a toda la familia',
       'Anfiteatro del Parque 9 de Julio', 'Av. Soldati s/n', 'Parque 9 de Julio', -26.8317, -65.1876,
       $2, $3, '{folclore}', $4, $5, COALESCE($6, now()))
     RETURNING id`,
    [categoria, empieza, termina, estado, usuarioId, creadoEn ?? null],
  );
  return Number(rows[0].id);
}

const filaEvento = async (id) => (await pool.query('SELECT * FROM eventos WHERE id = $1', [id])).rows[0];

const filaReporte = async (id) => (await pool.query('SELECT * FROM reportes WHERE id = $1', [id])).rows[0];

module.exports = {
  HORA,
  haceHoras,
  entrarComoAdmin,
  crearCiudadano,
  crearReporte,
  filaReporte,
  crearEvento,
  filaEvento,
};
