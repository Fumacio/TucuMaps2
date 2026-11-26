const { z } = require('zod');
const { fecha, vacioEsSinFiltro } = require('./comunes');

// Hojas que se pueden pedir, en el orden en que salen en el libro.
const HOJAS = ['lugares', 'reportes', 'eventos'];

// GET /api/admin/exportacion?hojas=lugares,reportes,eventos&desde=&hasta= (RF-26).
// `hojas` es una lista separada por comas; vacía o ausente exporta las tres. desde y hasta
// tienen las mismas reglas que los filtros del panel.
const hojas = z.preprocess(
  vacioEsSinFiltro,
  z
    .string({ error: '"hojas" debe ser una lista separada por comas' })
    .max(100, '"hojas" es demasiado largo')
    .transform((v) => [...new Set(v.split(',').map((h) => h.trim()).filter(Boolean))])
    .pipe(
      z
        .array(z.string())
        .min(1, `Elegí al menos una hoja: ${HOJAS.join(', ')}`)
        .refine((lista) => lista.every((h) => HOJAS.includes(h)), `Las hojas válidas son: ${HOJAS.join(', ')}`),
    )
    .default(HOJAS),
);

const filtros = z
  .object({ hojas, desde: fecha(false), hasta: fecha(true) })
  .refine((f) => !f.desde || !f.hasta || f.desde <= f.hasta, {
    path: ['hasta'],
    message: '"hasta" no puede ser anterior a "desde"',
  });

module.exports = { HOJAS, filtros };
