const env = require('../config/env');
const { errores } = require('../errores');
const eventos = require('../models/eventos');
const lugares = require('../models/lugares');
const { conLimiteDiario, modificarPendiente } = require('./envios');

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

module.exports = { listarVigentes, obtenerVigente, proponer, editar, cancelar };
