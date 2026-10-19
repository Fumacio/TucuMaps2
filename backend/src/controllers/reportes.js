const reportesService = require('../services/reportes');

async function listar(req, res) {
  res.json(await reportesService.listarActivos());
}

async function crear(req, res) {
  res.status(201).json(await reportesService.enviar(req.body, req.usuario));
}

module.exports = { listar, crear };
