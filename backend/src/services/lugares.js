const { errores } = require('../errores');
const lugares = require('../models/lugares');

// RF-02: el mapa público solo ve lugares activos.
function listarPublicos(filtros) {
  return lugares.listarActivos(filtros);
}

// Un lugar inexistente o inactivo responde igual: 404 (no se revela que existe).
async function obtenerPublico(id) {
  const lugar = await lugares.buscarActivoPorId(id);
  if (!lugar) throw errores.noEncontrado();
  return lugar;
}

module.exports = { listarPublicos, obtenerPublico };
