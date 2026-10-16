const reportesService = require('../services/reportes');

async function listar(req, res) {
  res.json(await reportesService.listarActivos());
}

module.exports = { listar };
