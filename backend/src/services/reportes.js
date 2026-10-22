const env = require('../config/env');
const { enTransaccion } = require('../db/pool');
const { errores } = require('../errores');
const reportes = require('../models/reportes');
const confirmaciones = require('../models/confirmaciones');
const { conLimiteDiario, modificarPendiente, exigirUsuarioActivo } = require('./envios');
const { moderar } = require('./moderacion');

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

// ---------- Administración (RF-08, RF-13, RF-15) ----------

// Formato de las listas paginadas de la API: { datos, pagina, por_pagina, total }.
async function listarParaAdmin(filtros) {
  const { datos, total } = await reportes.listarParaAdmin(filtros);
  return { datos, pagina: filtros.pagina, por_pagina: filtros.por_pagina, total };
}

async function obtenerParaAdmin(id) {
  const reporte = await reportes.buscarParaAdmin(id);
  if (!reporte) throw errores.noEncontrado();
  return reporte;
}

// Transiciones del admin (diagrama de estados de un reporte): cada una dice de qué estado
// puede partir. Responden el reporte actualizado, como el detalle.
const moderarReporte = (id, admin, desde, verbo, aplicar) =>
  moderar({
    tabla: 'reportes',
    nombre: 'El reporte',
    id,
    admin,
    desde,
    verbo,
    aplicar,
    devolver: (db) => reportes.buscarParaAdmin(id, db),
  });

// RF-08, RF-11: pendiente → aprobado. Desde ahora se ve en el mapa durante 24 hs.
function aprobar(id, admin) {
  return moderarReporte(id, admin, ['pendiente'], 'aprobar', (db) => reportes.aprobar(id, admin.id, db));
}

// RF-08: pendiente → rechazado, con motivo obligatorio (lo valida el esquema).
function rechazar(id, motivo, admin) {
  return moderarReporte(id, admin, ['pendiente'], 'rechazar', (db) => reportes.rechazar(id, admin.id, motivo, db));
}

// RF-08: aprobado → resuelto (aunque la alerta ya haya vencido).
function resolver(id, admin) {
  return moderarReporte(id, admin, ['aprobado'], 'resolver', (db) => reportes.resolver(id, db));
}

// RF-13: aprobado → retirado, sin motivo.
function retirar(id, admin) {
  return moderarReporte(id, admin, ['aprobado'], 'retirar', (db) => reportes.retirar(id, admin.id, db));
}

module.exports = {
  listarActivos,
  enviar,
  editar,
  cancelar,
  confirmar,
  listarParaAdmin,
  obtenerParaAdmin,
  aprobar,
  rechazar,
  resolver,
  retirar,
};
