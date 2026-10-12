const crypto = require('node:crypto');
const bcrypt = require('bcrypt');
const env = require('../config/env');
const pool = require('../db/pool');
const { errores } = require('../errores');
const usuarios = require('../models/usuarios');
const tokens = require('../models/tokens');
const correo = require('./correo');

const COSTO_BCRYPT = env.NODE_ENV === 'test' ? 4 : 12;
// Hash de relleno: un email inexistente tarda lo mismo que una contraseña incorrecta,
// así no se puede averiguar qué cuentas existen midiendo el tiempo de respuesta.
const HASH_FALSO = bcrypt.hashSync('relleno-para-tiempo-constante-1', COSTO_BCRYPT);

// RF-03: duración de los enlaces.
const DURACION_MIN = { verificar_email: 24 * 60, recuperar_password: 60 };
const MAX_REENVIOS_POR_HORA = 3;

function usuarioPublico(u) {
  return {
    id: Number(u.id),
    nombre: u.nombre,
    email: u.email,
    rol: u.rol,
    email_verificado: u.email_verificado,
  };
}

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

async function generarToken(usuarioId, tipo) {
  const token = crypto.randomBytes(32).toString('hex');
  await tokens.crear({ usuarioId, tipo, tokenHash: hashToken(token), minutos: DURACION_MIN[tipo] });
  return token;
}

// RF-01, RF-04: el registro público siempre crea un 'ciudadano' y guarda la versión
// de términos aceptada. Queda con sesión iniciada y se envía el email de verificación.
async function registrar({ nombre, email, password }) {
  const passwordHash = await bcrypt.hash(password, COSTO_BCRYPT);
  let usuario;
  try {
    usuario = await usuarios.crear({ nombre, email, passwordHash, terminosVersion: env.TERMINOS_VERSION });
  } catch (err) {
    if (err.code === '23505') throw errores.emailEnUso();
    throw err;
  }
  const token = await generarToken(usuario.id, 'verificar_email');
  correo.verificacion({ nombre: usuario.nombre, email: usuario.email, token });
  return usuario;
}

// RF-01: mismo error para email inexistente y contraseña incorrecta.
async function login({ email, password }) {
  const usuario = await usuarios.buscarPorEmail(email);
  const coincide = await bcrypt.compare(password, usuario?.password_hash ?? HASH_FALSO);
  if (!usuario || !coincide) throw errores.credencialesInvalidas();
  if (usuario.bloqueado) throw errores.usuarioBloqueado();
  return usuario;
}

async function cerrarTodasLasSesiones(id) {
  await usuarios.incrementarTokenVersion(id);
}

// RF-03
async function verificarEmail(token) {
  const usuarioId = await tokens.consumir({ tipo: 'verificar_email', tokenHash: hashToken(token) });
  if (!usuarioId) throw errores.tokenInvalido();
  await usuarios.marcarEmailVerificado(usuarioId);
}

// RF-03: máximo 3 por hora.
async function reenviarVerificacion(usuario) {
  if (usuario.email_verificado) return;
  const enviados = await tokens.contarCreadosUltimaHora({
    usuarioId: usuario.id,
    tipo: 'verificar_email',
    minutos: DURACION_MIN.verificar_email,
  });
  if (enviados >= MAX_REENVIOS_POR_HORA) {
    throw errores.demasiadosIntentos('Ya te enviamos 3 enlaces en la última hora. Revisá tu correo o probá más tarde.');
  }
  const token = await generarToken(usuario.id, 'verificar_email');
  correo.verificacion({ nombre: usuario.nombre, email: usuario.email, token });
}

// RF-03: responde igual exista o no el email.
async function pedirRecuperacion(email) {
  const usuario = await usuarios.buscarPorEmail(email);
  if (!usuario || usuario.bloqueado) return;
  const token = await generarToken(usuario.id, 'recuperar_password');
  correo.recuperacion({ nombre: usuario.nombre, email: usuario.email, token });
}

// RF-03: cambia la contraseña, invalida los otros enlaces pendientes y cierra
// todas las sesiones (incrementa token_version). Todo en una transacción.
async function restablecerPassword({ token, password }) {
  const passwordHash = await bcrypt.hash(password, COSTO_BCRYPT);
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');
    const usuarioId = await tokens.consumir(
      { tipo: 'recuperar_password', tokenHash: hashToken(token) },
      cliente,
    );
    if (!usuarioId) throw errores.tokenInvalido();
    await usuarios.cambiarPassword(usuarioId, passwordHash, cliente);
    await tokens.invalidarPendientes({ usuarioId, tipo: 'recuperar_password' }, cliente);
    await cliente.query('COMMIT');
  } catch (err) {
    await cliente.query('ROLLBACK');
    throw err;
  } finally {
    cliente.release();
  }
}

// RF-01: cambio de contraseña con sesión; pide la actual. Cierra las otras sesiones.
async function cambiarPassword(usuario, { password_actual, password_nueva }) {
  const coincide = await bcrypt.compare(password_actual, usuario.password_hash);
  if (!coincide) throw errores.credencialesInvalidas();
  const passwordHash = await bcrypt.hash(password_nueva, COSTO_BCRYPT);
  return usuarios.cambiarPassword(usuario.id, passwordHash);
}

module.exports = {
  usuarioPublico,
  registrar,
  login,
  cerrarTodasLasSesiones,
  verificarEmail,
  reenviarVerificacion,
  pedirRecuperacion,
  restablecerPassword,
  cambiarPassword,
};
