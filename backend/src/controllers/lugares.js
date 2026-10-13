const lugaresService = require('../services/lugares');

async function listar(req, res) {
  res.json(await lugaresService.listarPublicos(req.validado.query));
}

async function detalle(req, res) {
  res.json(await lugaresService.obtenerPublico(req.validado.params.id));
}

module.exports = { listar, detalle };
