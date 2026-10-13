const { z } = require('zod');
const { valores } = require('../catalogos');

// GET /api/lugares?categoria= (RF-02, RF-10)
const filtros = z.object({
  categoria: z.enum(valores('categorias_lugar'), { error: 'La categoría no es válida' }).optional(),
});

module.exports = { filtros };
