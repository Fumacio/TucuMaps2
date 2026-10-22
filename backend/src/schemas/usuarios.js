const { z } = require('zod');
const { vacioEsSinFiltro, paginacion, texto } = require('./comunes');

// GET /api/admin/usuarios?bloqueado=true|false&q= (RF-16), paginado. q busca en nombre o email.
const filtrosAdmin = z.object({
  ...paginacion.shape,
  bloqueado: z.preprocess(
    vacioEsSinFiltro,
    z
      .enum(['true', 'false'], { error: '"bloqueado" debe ser true o false' })
      .transform((v) => v === 'true')
      .optional(),
  ),
  q: z.preprocess(vacioEsSinFiltro, texto('La búsqueda', 100).optional()),
});

module.exports = { filtrosAdmin };
