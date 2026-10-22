const usuariosService = require('../services/usuarios');

async function listar(req, res) {
  res.json(await usuariosService.listarParaAdmin(req.validado.query));
}

async function bloquear(req, res) {
  res.json(await usuariosService.bloquear(req.validado.params.id, req.usuario));
}

async function desbloquear(req, res) {
  res.json(await usuariosService.desbloquear(req.validado.params.id, req.usuario));
}

async function resumen(req, res) {
  res.json(await usuariosService.obtenerResumen());
}

module.exports = { listar, bloquear, desbloquear, resumen };
