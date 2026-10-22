const reportesService = require('../services/reportes');

async function listar(req, res) {
  res.json(await reportesService.listarParaAdmin(req.validado.query));
}

async function detalle(req, res) {
  res.json(await reportesService.obtenerParaAdmin(req.validado.params.id));
}

async function aprobar(req, res) {
  res.json(await reportesService.aprobar(req.validado.params.id, req.usuario));
}

async function rechazar(req, res) {
  res.json(await reportesService.rechazar(req.validado.params.id, req.body.motivo, req.usuario));
}

async function resolver(req, res) {
  res.json(await reportesService.resolver(req.validado.params.id, req.usuario));
}

async function retirar(req, res) {
  res.json(await reportesService.retirar(req.validado.params.id, req.usuario));
}

module.exports = { listar, detalle, aprobar, rechazar, resolver, retirar };
