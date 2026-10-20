const env = require('../config/env');
const { enTransaccion } = require('../db/pool');
const { errores } = require('../errores');
const reportes = require('../models/reportes');
const confirmaciones = require('../models/confirmaciones');
const { conLimiteDiario, modificarPendiente, exigirUsuarioActivo } = require('./envios');

// RF-02, RF-11: la capa de Seguridad del mapa solo ve las alertas activas.
function listarActivos() {
  return reportes.listarActivos();
}

// RF-07, RF-09: el reporte queda pendiente y no se ve en el mapa hasta que un admin lo apruebe.
function enviar(datos, usuario) {
  const limite = env.LIMITE_REPORTES_DIA;
  return conLimiteDiario({
    tabla: 'reportes',
    usuarioId: usuario.id,
    limite,
    mensaje: `Alcanzaste el máximo de ${limite} reportes en 24 horas. Probá de nuevo más tarde.`,
    guardar: (db) => reportes.crear(datos, usuario.id, db),
  });
}

// RF-07: el autor corrige su reporte mientras sigue pendiente.
function editar(id, datos, usuario) {
  return modificarPendiente({
    tabla: 'reportes',
    id,
    usuarioId: usuario.id,
    modificar: (db) => reportes.editarPendiente(id, usuario.id, datos, db),
  });
}

// RF-07, RF-08: pendiente → cancelado. Es final: después no se edita ni se reabre.
function cancelar(id, usuario) {
  return modificarPendiente({
    tabla: 'reportes',
    id,
    usuarioId: usuario.id,
    modificar: (db) => reportes.cancelarPendiente(id, usuario.id, db),
  });
}

// RF-14: un ciudadano verificado confirma una alerta activa ajena, una sola vez. Es un aporte
// comunitario: no cambia el estado de moderación del reporte. Devuelve el total actualizado.
// Orden de los controles: no activa 404, propia 403, repetida 409.
function confirmar(id, usuario) {
  return enTransaccion(async (db) => {
    await exigirUsuarioActivo(usuario.id, db);
    const reporte = await reportes.buscarActivoParaConfirmar(id, db);
    if (!reporte) throw errores.noEncontrado();
    if (reporte.usuario_id !== null && String(reporte.usuario_id) === String(usuario.id)) {
      throw errores.sinPermiso();
    }
    const { nueva, total } = await confirmaciones.crear(id, usuario.id, db);
    if (!nueva) throw errores.yaConfirmado();
    return { confirmaciones: total };
  });
}

module.exports = { listarActivos, enviar, editar, cancelar, confirmar };
