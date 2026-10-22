const { enTransaccion } = require('../db/pool');
const { errores } = require('../errores');
const usuarios = require('../models/usuarios');
const envios = require('../models/envios');

// Relee al usuario con su fila bloqueada hasta el fin de la transacción: si lo bloquearon o
// borraron mientras la solicitud esperaba, no se guarda nada (RF-16, RF-24). Dos solicitudes
// del mismo usuario se ejecutan una después de la otra.
// Devuelve { id, rol, bloqueado } por si quien lo llama necesita controlar el rol.
async function exigirUsuarioActivo(usuarioId, db) {
  const usuario = await usuarios.bloquearFila(usuarioId, db);
  if (!usuario) throw errores.noAutenticado();
  if (usuario.bloqueado) throw errores.usuarioBloqueado();
  return usuario;
}

// RF-09: guarda un envío (reporte o propuesta de evento) solo si el usuario no llegó a su
// límite de las últimas 24 horas. Los cancelados también cuentan, así cancelar no libera cupo.
// La fila del usuario queda bloqueada durante la transacción: dos envíos simultáneos se
// cuentan uno después del otro y no pueden pasarse del límite juntos.
// - tabla: 'reportes' o 'eventos'.
// - validar(db), opcional: controles que necesitan la base (ej. que exista el lugar). Va antes
//   del límite, así un dato inválido responde 400 aunque el usuario ya no tenga cupo.
// - guardar(db) → lo que devuelve el modelo al insertar.
function conLimiteDiario({ tabla, usuarioId, limite, mensaje, validar, guardar }) {
  return enTransaccion(async (db) => {
    // Se relee el usuario ya bloqueado: si lo bloquearon o borraron mientras la solicitud
    // esperaba, no se guarda nada (RF-16, RF-24).
    await exigirUsuarioActivo(usuarioId, db);
    if (validar) await validar(db);

    const { cantidad, segundos } = await envios.contarRecientes(tabla, usuarioId, limite, db);
    if (cantidad >= limite) throw errores.limiteDiario(mensaje, Math.max(1, segundos));
    return guardar(db);
  });
}

// RF-07, RF-08: editar o cancelar un envío propio que sigue pendiente. Primero se bloquea la
// fila y se controla en este orden: no existe 404, es de otro 403, ya no está pendiente 409.
// Recién después corren los controles de datos que necesitan la base (validar) y el cambio
// (modificar), así dos solicitudes a la vez se ejecutan una después de la otra.
// No pasa por el límite diario (RF-09): editar no crea un envío nuevo y cancelar no borra la
// fila, así que tampoco libera cupo.
// - validar(db), opcional: ej. que exista el lugar del evento.
// - modificar(db) → lo que devuelve el modelo al actualizar.
function modificarPendiente({ tabla, id, usuarioId, validar, modificar }) {
  return enTransaccion(async (db) => {
    // Igual que al enviar: si lo bloquearon o borraron mientras la solicitud esperaba, no se
    // cambia nada (RF-16, RF-24).
    await exigirUsuarioActivo(usuarioId, db);

    const envio = await envios.bloquearEnvio(tabla, id, db);
    if (!envio) throw errores.noEncontrado();
    if (envio.autor_id === null || String(envio.autor_id) !== String(usuarioId)) throw errores.sinPermiso();
    if (envio.estado !== 'pendiente') {
      throw errores.transicionInvalida(
        envio.estado === 'cancelado'
          ? 'Este envío está cancelado y ya no se puede modificar.'
          : 'Este envío ya no está pendiente y no se puede modificar.',
      );
    }
    if (validar) await validar(db);
    return modificar(db);
  });
}

// RF-07, RF-08: "Mis envíos", paginado. Solo lo propio, incluido el motivo de rechazo.
async function listarMios(usuarioId, filtros) {
  const { datos, total } = await envios.listarDeUsuario(usuarioId, filtros);
  return { datos, pagina: filtros.pagina, por_pagina: filtros.por_pagina, total };
}

module.exports = { exigirUsuarioActivo, conLimiteDiario, modificarPendiente, listarMios };
