const env = require('../config/env');
const reportes = require('../models/reportes');
const { conLimiteDiario } = require('./envios');

// RF-02, RF-11: la capa de Seguridad del mapa solo ve las alertas activas.
function listarActivos() {
  return reportes.listarActivos();
}

// RF-07, RF-09: el reporte queda pendiente y no se ve en el mapa hasta que un admin lo apruebe.
function enviar(datos, usuario) {
  const limite = env.LIMITE_REPORTES_DIA;
  return conLimiteDiario({
    usuarioId: usuario.id,
    limite,
    mensaje: `Alcanzaste el máximo de ${limite} reportes en 24 horas. Probá de nuevo más tarde.`,
    contar: reportes.contarRecientes,
    guardar: (db) => reportes.crear(datos, usuario.id, db),
  });
}

module.exports = { listarActivos, enviar };
