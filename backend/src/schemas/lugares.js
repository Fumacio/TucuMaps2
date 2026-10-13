const { z } = require('zod');
const { valores } = require('../catalogos');

// GET /api/lugares?categoria= (RF-02, RF-10). "?categoria=" vacío equivale a sin filtro.
const filtros = z.object({
  categoria: z.preprocess(
    (v) => (v === '' ? undefined : v),
    z.enum(valores('categorias_lugar'), { error: 'La categoría no es válida' }).optional(),
  ),
});

module.exports = { filtros };
