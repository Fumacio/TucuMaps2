const { z } = require('zod');
const { valores } = require('../catalogos');
const { lat, lng, textoOpcional, textoObligatorio } = require('./comunes');

// POST /api/reportes (RF-07, RF-10). El mismo esquema sirve después para editarlo (#44).
const reporte = z.object({
  tipo: z.enum(valores('tipos_reporte'), { error: 'El tipo de alerta no es válido' }),
  descripcion: textoObligatorio('La descripción', 10, 500, 'La descripción es obligatoria'),
  direccion: textoOpcional('La dirección', 200),
  barrio: textoOpcional('El barrio', 80),
  lat,
  lng,
});

module.exports = { reporte };
