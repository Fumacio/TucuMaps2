const { z } = require('zod');

// Parámetro :id de las rutas: solo dígitos, sin ceros adelante ni formatos como "0x10" o
// "1e2" (así cada recurso tiene una sola URL). Se limita al rango seguro de JavaScript
// para que un número gigante no llegue a PostgreSQL (BIGINT) y termine en un error 500.
const id = z.object({
  id: z
    .string()
    .regex(/^[1-9]\d{0,15}$/, 'El id no es válido')
    .transform(Number)
    .pipe(z.number().max(Number.MAX_SAFE_INTEGER, 'El id no es válido')),
});

module.exports = { id };
