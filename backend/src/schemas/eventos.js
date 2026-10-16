const { z } = require('zod');
const { valores } = require('../catalogos');
const { vacioEsSinFiltro } = require('./comunes');

// Un día suelto (2026-11-07) se toma en hora de Tucumán (UTC-3 fijo, sin horario de verano desde 2009).
const ZONA_TUCUMAN = '-03:00';

// Fecha de un filtro: un día o una fecha y hora con zona (ISO 8601). Con un día, `desde`
// arranca a las 00:00 y `hasta` incluye el día entero.
const fecha = (finDelDia) =>
  z.preprocess(
    vacioEsSinFiltro,
    z
      .union([z.iso.date(), z.iso.datetime({ offset: true })], {
        error: 'Usá una fecha como 2026-11-07 o 2026-11-07T20:00:00-03:00',
      })
      .transform((v) => {
        if (v.length > 10) return new Date(v);
        return new Date(`${v}T${finDelDia ? '23:59:59.999' : '00:00:00'}${ZONA_TUCUMAN}`);
      })
      .optional(),
  );

// GET /api/eventos?categoria=&desde=&hasta= (RF-02, RF-10). Un parámetro vacío equivale a sin filtro.
const filtros = z
  .object({
    categoria: z.preprocess(
      vacioEsSinFiltro,
      z.enum(valores('categorias_evento'), { error: 'La categoría no es válida' }).optional(),
    ),
    desde: fecha(false),
    hasta: fecha(true),
  })
  .refine((f) => !f.desde || !f.hasta || f.desde <= f.hasta, {
    path: ['hasta'],
    message: '"hasta" no puede ser anterior a "desde"',
  });

module.exports = { filtros };
