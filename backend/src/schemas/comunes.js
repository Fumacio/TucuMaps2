const { z } = require('zod');

// Parámetro :id de las rutas. Se limita al rango seguro de JavaScript para que un número
// gigante no llegue a PostgreSQL (BIGINT) y termine en un error 500.
const id = z.object({
  id: z.coerce
    .number({ error: 'El id no es válido' })
    .int('El id no es válido')
    .positive('El id no es válido')
    .max(Number.MAX_SAFE_INTEGER, 'El id no es válido'),
});

module.exports = { id };
