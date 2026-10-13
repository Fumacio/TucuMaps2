const lugaresService = require('../services/lugares');

async function listar(req, res) {
  res.json(await lugaresService.listarPublicos(req.datos));
}

async function detalle(req, res) {
  res.json(await lugaresService.obtenerPublico(req.datos.id));
}

module.exports = { listar, detalle };
