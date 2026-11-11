const { catalogos } = require('../catalogos');

// RF-10: valores y etiquetas para armar formularios y filtros.
function listar(req, res) {
  res.json(catalogos);
}

module.exports = { listar };
