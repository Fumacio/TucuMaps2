const enviosService = require('../services/envios');

async function listar(req, res) {
  res.json(await enviosService.listarMios(req.usuario.id, req.validado.query));
}

module.exports = { listar };
