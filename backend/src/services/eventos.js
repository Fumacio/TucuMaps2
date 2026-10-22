const env = require('../config/env');
const { enTransaccion } = require('../db/pool');
const { errores } = require('../errores');
const eventos = require('../models/eventos');
const lugares = require('../models/lugares');
const { conLimiteDiario, modificarPendiente } = require('./envios');
const { exigirAdminActivo, moderar } = require('./moderacion');

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

// Si la propuesta nombra un lugar del mapa (lugar_id), tiene que ser uno activo.
async function validarLugar(datos, db) {
  if (datos.lugar_id !== null && !(await lugares.estaActivo(datos.lugar_id, db))) {
    throw errores.datosInvalidos([{ campo: 'lugar_id', mensaje: 'El lugar no existe o no está en el mapa' }]);
  }
}

// RF-07, RF-09: la propuesta queda pendiente y no se ve en la agenda hasta que un admin la apruebe.
function proponer(datos, usuario) {
  const limite = env.LIMITE_EVENTOS_DIA;
  return conLimiteDiario({
    tabla: 'eventos',
    usuarioId: usuario.id,
    limite,
    mensaje: `Alcanzaste el máximo de ${limite} propuestas de eventos en 24 horas. Probá de nuevo más tarde.`,
    validar: (db) => validarLugar(datos, db),
    guardar: (db) => eventos.crearPropuesta(datos, usuario.id, db),
  });
}

// RF-07: el autor corrige su propuesta mientras sigue pendiente, con las mismas reglas del alta.
function editar(id, datos, usuario) {
  return modificarPendiente({
    tabla: 'eventos',
    id,
    usuarioId: usuario.id,
    validar: (db) => validarLugar(datos, db),
    modificar: (db) => eventos.editarPendiente(id, usuario.id, datos, db),
  });
}

// RF-07, RF-08: pendiente → cancelado. Es final: después no se edita ni se reabre.
function cancelar(id, usuario) {
  return modificarPendiente({
    tabla: 'eventos',
    id,
    usuarioId: usuario.id,
    modificar: (db) => eventos.cancelarPendiente(id, usuario.id, db),
  });
}

// ---------- Administración (RF-08, RF-12, RF-13, RF-15) ----------

// Formato de las listas paginadas de la API: { datos, pagina, por_pagina, total }.
async function listarParaAdmin(filtros) {
  const { datos, total } = await eventos.listarParaAdmin(filtros);
  return { datos, pagina: filtros.pagina, por_pagina: filtros.por_pagina, total };
}

async function obtenerParaAdmin(id) {
  const evento = await eventos.buscarParaAdmin(id);
  if (!evento) throw errores.noEncontrado();
  return evento;
}

// RF-13: el admin crea un evento ya aprobado, sin límite diario (no es una propuesta).
function crearComoAdmin(datos, admin) {
  return enTransaccion(async (db) => {
    await exigirAdminActivo(admin.id, db);
    await validarLugar(datos, db);
    const id = await eventos.crearAprobado(datos, admin.id, db);
    return eventos.buscarParaAdmin(id, db);
  });
}

// Transiciones del admin (diagrama de estados de un evento): cada una dice de qué estado puede
// partir. Responden el evento actualizado, como el detalle.
const moderarEvento = (id, admin, desde, verbo, aplicar) =>
  moderar({
    tabla: 'eventos',
    nombre: 'El evento',
    id,
    admin,
    desde,
    verbo,
    aplicar,
    devolver: (db) => eventos.buscarParaAdmin(id, db),
  });

// RF-13: editar un pendiente o un aprobado (ej. un cambio de horario); sigue en su estado.
function editarComoAdmin(id, datos, admin) {
  return moderarEvento(id, admin, ['pendiente', 'aprobado'], 'editar', async (db) => {
    await validarLugar(datos, db);
    await eventos.editarComoAdmin(id, datos, db);
  });
}

// RF-08: pendiente → aprobado. Aparece en la agenda hasta que se archiva (RF-12).
function aprobar(id, admin) {
  return moderarEvento(id, admin, ['pendiente'], 'aprobar', (db) => eventos.aprobar(id, admin.id, db));
}

// RF-08: pendiente → rechazado, con motivo obligatorio (lo valida el esquema).
function rechazar(id, motivo, admin) {
  return moderarEvento(id, admin, ['pendiente'], 'rechazar', (db) => eventos.rechazar(id, admin.id, motivo, db));
}

// RF-13: aprobado → retirado (ej. suspendido), aunque ya esté archivado.
function retirar(id, admin) {
  return moderarEvento(id, admin, ['aprobado'], 'retirar', (db) => eventos.retirar(id, admin.id, db));
}

module.exports = {
  listarVigentes,
  obtenerVigente,
  proponer,
  editar,
  cancelar,
  listarParaAdmin,
  obtenerParaAdmin,
  crearComoAdmin,
  editarComoAdmin,
  aprobar,
  rechazar,
  retirar,
};
