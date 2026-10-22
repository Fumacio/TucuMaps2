const eventosService = require('../services/eventos');

async function listar(req, res) {
  res.json(await eventosService.listarParaAdmin(req.validado.query));
}

async function detalle(req, res) {
  res.json(await eventosService.obtenerParaAdmin(req.validado.params.id));
}

async function crear(req, res) {
  res.status(201).json(await eventosService.crearComoAdmin(req.body, req.usuario));
}

async function editar(req, res) {
  res.json(await eventosService.editarComoAdmin(req.validado.params.id, req.body, req.usuario));
}

async function aprobar(req, res) {
  res.json(await eventosService.aprobar(req.validado.params.id, req.usuario));
}

async function rechazar(req, res) {
  res.json(await eventosService.rechazar(req.validado.params.id, req.body.motivo, req.usuario));
}

async function retirar(req, res) {
  res.json(await eventosService.retirar(req.validado.params.id, req.usuario));
}

module.exports = { listar, detalle, crear, editar, aprobar, rechazar, retirar };
