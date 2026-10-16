const eventosService = require('../services/eventos');

async function listar(req, res) {
  res.json(await eventosService.listarVigentes(req.validado.query));
}

async function detalle(req, res) {
  res.json(await eventosService.obtenerVigente(req.validado.params.id));
}

module.exports = { listar, detalle };
