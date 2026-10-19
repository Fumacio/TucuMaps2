const { enTransaccion } = require('../db/pool');
const { errores } = require('../errores');
const usuarios = require('../models/usuarios');

const DIA_MS = 24 * 60 * 60 * 1000;

// RF-09: guarda un envío (reporte o propuesta de evento) solo si el usuario no llegó a su
// límite de las últimas 24 horas. Los cancelados también cuentan, así cancelar no libera cupo.
// La fila del usuario queda bloqueada durante la transacción: dos envíos simultáneos se
// cuentan uno después del otro y no pueden pasarse del límite juntos.
// - contar(usuarioId, db) → { cantidad, primero } (el envío más viejo dentro de la ventana).
// - guardar(db) → lo que devuelve el modelo al insertar.
function conLimiteDiario({ usuarioId, limite, mensaje, contar, guardar }) {
  return enTransaccion(async (db) => {
    await usuarios.bloquearFila(usuarioId, db);
    const { cantidad, primero } = await contar(usuarioId, db);
    if (cantidad >= limite) {
      // El próximo cupo se libera cuando el envío más viejo de la ventana cumple 24 horas.
      const segundos = Math.max(1, Math.ceil((primero.getTime() + DIA_MS - Date.now()) / 1000));
      throw errores.limiteDiario(mensaje, segundos);
    }
    return guardar(db);
  });
}

module.exports = { conLimiteDiario };
