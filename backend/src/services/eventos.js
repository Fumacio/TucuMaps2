const { errores } = require('../errores');
const eventos = require('../models/eventos');

// RF-02, RF-12: el mapa y la agenda solo ven eventos vigentes.
function listarVigentes(filtros) {
  return eventos.listarVigentes(filtros);
}

// Un evento inexistente, no aprobado o ya archivado responde igual: 404.
async function obtenerVigente(id) {
  const evento = await eventos.buscarVigentePorId(id);
  if (!evento) throw errores.noEncontrado();
  return evento;
}

module.exports = { listarVigentes, obtenerVigente };
