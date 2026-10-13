const { catalogos } = require('../catalogos');

// RF-10: valores y etiquetas para armar formularios y filtros. Cambian solo con una
// migración; se guardan 5 minutos para que un deploy nuevo se vea enseguida.
function listar(req, res) {
  res.set('Cache-Control', 'public, max-age=300');
  res.json(catalogos);
}

module.exports = { listar };
