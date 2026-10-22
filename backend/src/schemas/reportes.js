const { z } = require('zod');
const { valores } = require('../catalogos');
const { fecha, paginacion, lat, lng, textoOpcional, textoObligatorio } = require('./comunes');
const { ESTADOS_REPORTE, enumOpcional, iaVeredicto } = require('./moderacion');

// POST /api/reportes (RF-07, RF-10). El mismo esquema sirve después para editarlo (#44).
const reporte = z.object({
  tipo: z.enum(valores('tipos_reporte'), { error: 'El tipo de alerta no es válido' }),
  descripcion: textoObligatorio('La descripción', 10, 500, 'La descripción es obligatoria'),
  direccion: textoOpcional('La dirección', 200),
  barrio: textoOpcional('El barrio', 80),
  lat,
  lng,
});

// GET /api/admin/reportes?estado=&tipo=&ia_veredicto=&desde=&hasta= (RF-15), paginado.
// desde y hasta filtran por la fecha de envío (creado_en), con las mismas reglas que la agenda.
const filtrosAdmin = z
  .object({
    ...paginacion.shape,
    estado: enumOpcional(ESTADOS_REPORTE, 'El estado no es válido'),
    tipo: enumOpcional(valores('tipos_reporte'), 'El tipo de alerta no es válido'),
    ia_veredicto: iaVeredicto,
    desde: fecha(false),
    hasta: fecha(true),
  })
  .refine((f) => !f.desde || !f.hasta || f.desde <= f.hasta, {
    path: ['hasta'],
    message: '"hasta" no puede ser anterior a "desde"',
  });

module.exports = { reporte, filtrosAdmin };
