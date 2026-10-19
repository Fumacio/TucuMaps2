const eventosService = require('../services/eventos');

async function listar(req, res) {
  res.json(await eventosService.listarVigentes(req.validado.query));
}

async function detalle(req, res) {
  res.json(await eventosService.obtenerVigente(req.validado.params.id));
}

async function proponer(req, res) {
  res.status(201).json(await eventosService.proponer(req.body, req.usuario));
}

module.exports = { listar, detalle, proponer };
