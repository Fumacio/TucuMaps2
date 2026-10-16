const lugaresService = require('../services/lugares');

async function listar(req, res) {
  res.json(await lugaresService.listarParaAdmin(req.validado.query));
}

async function crear(req, res) {
  res.status(201).json(await lugaresService.crear(req.body, req.usuario));
}

async function actualizar(req, res) {
  res.json(await lugaresService.actualizar(req.validado.params.id, req.body));
}

async function cambiarActivo(req, res) {
  res.json(await lugaresService.cambiarActivo(req.validado.params.id, req.body.activo));
}

module.exports = { listar, crear, actualizar, cambiarActivo };
