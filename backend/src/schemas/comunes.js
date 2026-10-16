const { z } = require('zod');

// En los filtros de la query, un parámetro vacío (?categoria=) equivale a no mandarlo.
const vacioEsSinFiltro = (v) => (v === '' ? undefined : v);

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

// Número entero positivo en la query (?pagina=2): mismas reglas que el :id, con un máximo.
const enteroQuery = (nombre, porDefecto, max) =>
  z.preprocess(
    vacioEsSinFiltro,
    z
      .string({ error: `"${nombre}" debe ser un número entero positivo` })
      .regex(/^[1-9]\d{0,5}$/, `"${nombre}" debe ser un número entero positivo`)
      .transform(Number)
      .pipe(z.number().max(max, `"${nombre}" puede ser como máximo ${max}`))
      .default(porDefecto),
  );

// Listas paginadas del panel: ?pagina=1&por_pagina=20, con un máximo de 100 por página.
const paginacion = z.object({
  pagina: enteroQuery('pagina', 1, 100000),
  por_pagina: enteroQuery('por_pagina', 20, 100),
});

// RF-10: caja rectangular aproximada de la provincia de Tucumán (igual que los CHECK de la base).
const coordenada = (nombre, min, max) =>
  z
    .number({ error: `"${nombre}" debe ser un número` })
    .min(min, 'La ubicación debe estar dentro de Tucumán')
    .max(max, 'La ubicación debe estar dentro de Tucumán');
const lat = coordenada('lat', -28, -26);
const lng = coordenada('lng', -66.5, -64.5);

// URL de una imagen: solo http o https (sin subida de archivos en el MVP).
const urlImagen = z
  .string({ error: 'La URL de la imagen debe ser un texto' })
  .trim()
  .max(500, 'La URL de la imagen puede tener hasta 500 caracteres')
  .pipe(z.url({ protocol: /^https?$/, error: 'La URL de la imagen debe empezar con http:// o https://' }));

// Texto opcional de un formulario: se recortan los espacios y vacío o ausente queda en null.
const textoOpcional = (etiqueta, max) =>
  z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? null : v),
    z
      .string({ error: `${etiqueta} debe ser un texto` })
      .trim()
      .max(max, `${etiqueta} puede tener hasta ${max} caracteres`)
      .nullish()
      .transform((v) => v ?? null),
  );

module.exports = { id, vacioEsSinFiltro, paginacion, lat, lng, urlImagen, textoOpcional };
