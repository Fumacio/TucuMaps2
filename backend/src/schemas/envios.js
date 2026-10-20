const { z } = require('zod');
const { paginacion, vacioEsSinFiltro } = require('./comunes');

// GET /api/mis-envios?tipo=reporte|evento&pagina=&por_pagina= (RF-07, RF-08).
const filtrosMisEnvios = paginacion.extend({
  tipo: z.preprocess(
    vacioEsSinFiltro,
    z.enum(['reporte', 'evento'], { error: 'El tipo debe ser "reporte" o "evento"' }).optional(),
  ),
});

module.exports = { filtrosMisEnvios };
