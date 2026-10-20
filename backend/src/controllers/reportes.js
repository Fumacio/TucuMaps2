const reportesService = require('../services/reportes');

async function listar(req, res) {
  res.json(await reportesService.listarActivos());
}

async function crear(req, res) {
  res.status(201).json(await reportesService.enviar(req.body, req.usuario));
}

async function editar(req, res) {
  res.json(await reportesService.editar(req.validado.params.id, req.body, req.usuario));
}

async function cancelar(req, res) {
  res.json(await reportesService.cancelar(req.validado.params.id, req.usuario));
}

module.exports = { listar, crear, editar, cancelar };
