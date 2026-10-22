const { z } = require('zod');
const { vacioEsSinFiltro, textoObligatorio } = require('./comunes');

// Estados y veredictos de la base (tipos estado_reporte, estado_revision y veredicto_ia).
const ESTADOS_REPORTE = ['pendiente', 'aprobado', 'rechazado', 'resuelto', 'cancelado', 'retirado'];
const ESTADOS_EVENTO = ['pendiente', 'aprobado', 'rechazado', 'cancelado', 'retirado'];
const VEREDICTOS_IA = ['probable_real', 'dudoso', 'probable_broma_o_spam'];

// Filtro opcional de la query con valores cerrados: vacío equivale a no filtrar.
const enumOpcional = (valores, mensaje) =>
  z.preprocess(vacioEsSinFiltro, z.enum(valores, { error: mensaje }).optional());

// RF-20: los campos ia_* quedan vacíos hasta la Fase 6, pero el filtro ya existe.
const iaVeredicto = enumOpcional(VEREDICTOS_IA, 'El veredicto de IA no es válido');

// RF-08: el rechazo de un reporte o una propuesta siempre lleva motivo, que ve el autor.
const rechazo = z.object({
  motivo: textoObligatorio('El motivo', 5, 300, 'El motivo del rechazo es obligatorio'),
});

module.exports = { ESTADOS_REPORTE, ESTADOS_EVENTO, enumOpcional, iaVeredicto, rechazo };
