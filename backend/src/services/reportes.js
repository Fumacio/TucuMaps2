const reportes = require('../models/reportes');

// RF-02, RF-11: la capa de Seguridad del mapa solo ve las alertas activas.
function listarActivos() {
  return reportes.listarActivos();
}

module.exports = { listarActivos };
