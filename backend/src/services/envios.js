const { enTransaccion } = require('../db/pool');
const { errores } = require('../errores');
const usuarios = require('../models/usuarios');
const envios = require('../models/envios');

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
    const usuario = await usuarios.bloquearFila(usuarioId, db);
    if (!usuario) throw errores.noAutenticado();
    if (usuario.bloqueado) throw errores.usuarioBloqueado();
    if (validar) await validar(db);

    const { cantidad, segundos } = await envios.contarRecientes(tabla, usuarioId, limite, db);
    if (cantidad >= limite) throw errores.limiteDiario(mensaje, Math.max(1, segundos));
    return guardar(db);
  });
}

module.exports = { conLimiteDiario };
