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

module.exports = {
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
};
