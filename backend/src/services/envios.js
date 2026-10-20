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

// RF-07, RF-08: editar o cancelar un envío propio que sigue pendiente. `modificar(db)` hace un
// UPDATE condicionado (autor + estado 'pendiente') y devuelve null si no tocó nada; como la
// condición va en el mismo UPDATE, dos solicitudes a la vez no pueden pasar las dos.
// Si no se pudo, se busca el motivo: no existe 404, es de otro 403, ya no está pendiente 409.
// No pasa por el límite diario (RF-09): editar no crea un envío nuevo y cancelar no borra la
// fila, así que tampoco libera cupo.
// - validar(db), opcional: controles que necesitan la base (ej. que exista el lugar).
function modificarPendiente({ tabla, id, usuarioId, validar, modificar }) {
  return enTransaccion(async (db) => {
    if (validar) await validar(db);
    const resultado = await modificar(db);
    if (resultado) return resultado;

    const actual = await envios.buscarAutorYEstado(tabla, id, db);
    if (!actual) throw errores.noEncontrado();
    if (actual.autor_id === null || String(actual.autor_id) !== String(usuarioId)) throw errores.sinPermiso();
    throw errores.transicionInvalida(
      actual.estado === 'cancelado'
        ? 'Este envío está cancelado y ya no se puede modificar.'
        : 'Este envío ya fue revisado y no se puede modificar.',
    );
  });
}

// Campos del formulario de cada clase de envío, para que el frontend pueda precargarlo al editar.
const CONTENIDO = {
  reporte: ['tipo', 'descripcion', 'direccion', 'barrio', 'lat', 'lng'],
  evento: ['nombre', 'categoria', 'modalidad', 'descripcion', 'lugar_nombre', 'direccion', 'barrio',
    'lugar_id', 'lat', 'lng', 'inicio', 'fin', 'flyer_url', 'etiquetas'],
};

// PostgreSQL devuelve BIGINT y NUMERIC como texto.
const NUMERICOS = new Set(['lat', 'lng', 'lugar_id']);

function armarEnvio(fila) {
  const contenido = {};
  for (const campo of CONTENIDO[fila.clase]) {
    const valor = fila[campo];
    contenido[campo] = NUMERICOS.has(campo) && valor !== null ? Number(valor) : valor;
  }
  return {
    tipo: fila.clase,
    id: Number(fila.id),
    estado: fila.estado,
    motivo_rechazo: fila.motivo_rechazo,
    creado_en: fila.creado_en,
    actualizado_en: fila.actualizado_en,
    contenido,
  };
}

// RF-07, RF-08: "Mis envíos", paginado. Solo lo propio, incluido el motivo de rechazo.
async function listarMios(usuarioId, { tipo, pagina, por_pagina: porPagina }) {
  const { filas, total } = await envios.listarDeUsuario(usuarioId, {
    tipo,
    limite: porPagina,
    desde: (pagina - 1) * porPagina,
  });
  return { datos: filas.map(armarEnvio), pagina, por_pagina: porPagina, total };
}

module.exports = { conLimiteDiario, modificarPendiente, listarMios };
