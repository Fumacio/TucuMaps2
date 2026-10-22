const authService = require('../services/auth');
const { setearSesion, borrarSesion } = require('../sesion');

async function registro(req, res) {
  const usuario = await authService.registrar(req.body);
  setearSesion(res, usuario);
  res.status(201).json({ usuario: authService.usuarioPublico(usuario) });
}

async function login(req, res) {
  const usuario = await authService.login(req.body);
  setearSesion(res, usuario);
  res.json({ usuario: authService.usuarioPublico(usuario) });
}

function logout(req, res) {
  borrarSesion(res);
  res.status(204).end();
}

async function logoutTodos(req, res) {
  await authService.cerrarTodasLasSesiones(req.usuario.id);
  borrarSesion(res);
  res.status(204).end();
}

function me(req, res) {
  res.json({ usuario: authService.usuarioPublico(req.usuario) });
}

async function verificarEmail(req, res) {
  await authService.verificarEmail(req.body.token);
  res.json({ ok: true });
}

async function reenviarVerificacion(req, res) {
  await authService.reenviarVerificacion(req.usuario);
  res.json({ ok: true });
}

async function recuperar(req, res) {
  await authService.pedirRecuperacion(req.body.email);
  res.json({ ok: true });
}

async function restablecer(req, res) {
  await authService.restablecerPassword(req.body);
  res.json({ ok: true });
}

async function cambiarPassword(req, res) {
  const usuario = await authService.cambiarPassword(req.usuario, req.body);
  // Las otras sesiones quedan cerradas; esta sigue con la versión nueva.
  setearSesion(res, usuario);
  res.json({ ok: true });
}

async function cambiarNombre(req, res) {
  const usuario = await authService.cambiarNombre(req.usuario, req.body);
  res.json({ usuario: authService.usuarioPublico(usuario) });
}

async function pedirCambioEmail(req, res) {
  await authService.pedirCambioEmail(req.usuario, req.body);
  res.status(202).json({ ok: true });
}

async function confirmarCambioEmail(req, res) {
  await authService.confirmarCambioEmail(req.body.token);
  res.json({ ok: true });
}

// RF-24: la cuenta ya no existe, así que también se borra la cookie.
async function darDeBaja(req, res) {
  await authService.darDeBaja(req.usuario, req.body);
  borrarSesion(res);
  res.status(204).end();
}

module.exports = {
  darDeBaja,
  registro,
  login,
  logout,
  logoutTodos,
  me,
  verificarEmail,
  reenviarVerificacion,
  recuperar,
  restablecer,
  cambiarPassword,
  cambiarNombre,
  pedirCambioEmail,
  confirmarCambioEmail,
};
