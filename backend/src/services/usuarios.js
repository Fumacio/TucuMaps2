const { enTransaccion } = require('../db/pool');
const { errores } = require('../errores');
const usuarios = require('../models/usuarios');
const envios = require('../models/envios');
const resumen = require('../models/resumen');
const { exigirAdminActivo } = require('./moderacion');

// RF-16: motivo que ve el autor en "Mis envíos" cuando sus pendientes se rechazan por el bloqueo.
const MOTIVO_BLOQUEO = 'Usuario bloqueado';

// ---------- Administración (RF-15, RF-16) ----------

// Formato de las listas paginadas de la API: { datos, pagina, por_pagina, total }.
async function listarParaAdmin(filtros) {
  const { datos, total } = await usuarios.listarParaAdmin(filtros);
  return { datos, pagina: filtros.pagina, por_pagina: filtros.por_pagina, total };
}

// Bloquear o desbloquear, en una transacción con las dos filas bloqueadas: la del admin (que
// siga siéndolo) y la del usuario. Un envío del usuario que llega a la vez espera su fila (ver
// services/envios.js): si entra antes, el bloqueo lo rechaza; si entra después, ve el bloqueo.
// Controla en este orden: no existe 404, es uno mismo o es un admin 409. Repetir la acción no
// es un error: responde el usuario igual.
async function cambiarBloqueo(id, bloquear, admin) {
  const exigirBloqueable = (usuario) => {
    if (!usuario) throw errores.noEncontrado();
    if (!bloquear) return;
    if (String(usuario.id) === String(admin.id)) throw errores.transicionInvalida('No podés bloquear tu propia cuenta.');
    if (usuario.rol === 'admin') throw errores.transicionInvalida('No se puede bloquear a otro administrador.');
  };
  // Primero sin bloquear filas: si dos admins intentaran bloquearse entre sí, cada uno tendría
  // su fila y esperaría la del otro (un deadlock y un 500). Así responden 409 antes.
  exigirBloqueable(await usuarios.buscarPorId(id));
  return enTransaccion(async (db) => {
    await exigirAdminActivo(admin.id, db);
    const usuario = await usuarios.bloquearFila(id, db);
    exigirBloqueable(usuario);
    await usuarios.cambiarBloqueo(id, bloquear, db);
    // Lo rechazado no se reabre al desbloquear (RF-16, estados finales de RF-08).
    if (bloquear) await envios.rechazarPendientesDe(id, admin.id, MOTIVO_BLOQUEO, db);
    return usuarios.buscarParaAdmin(id, db);
  });
}

const bloquear = (id, admin) => cambiarBloqueo(id, true, admin);
const desbloquear = (id, admin) => cambiarBloqueo(id, false, admin);

// RF-15: contadores de la portada del panel.
function obtenerResumen() {
  return resumen.contadores();
}

module.exports = { MOTIVO_BLOQUEO, listarParaAdmin, bloquear, desbloquear, obtenerResumen };
