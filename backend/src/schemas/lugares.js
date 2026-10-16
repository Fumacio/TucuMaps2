const { z } = require('zod');
const { valores } = require('../catalogos');
const { vacioEsSinFiltro, lat, lng, urlImagen, textoOpcional } = require('./comunes');

// GET /api/lugares?categoria= (RF-02, RF-10). "?categoria=" vacío equivale a sin filtro.
const filtros = z.object({
  categoria: z.preprocess(
    vacioEsSinFiltro,
    z.enum(valores('categorias_lugar'), { error: 'La categoría no es válida' }).optional(),
  ),
});

// RF-13: alta (POST) y edición (PUT) de un lugar desde el panel. El PUT reemplaza el lugar
// entero: un campo opcional que no se manda queda vacío. `activo` se cambia aparte.
const lugar = z.object({
  nombre: z
    .string({ error: 'El nombre es obligatorio' })
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(150, 'El nombre puede tener hasta 150 caracteres'),
  categoria: z.enum(valores('categorias_lugar'), { error: 'La categoría no es válida' }),
  descripcion: textoOpcional('La descripción', 2000),
  contenido_historico: textoOpcional('El contenido histórico', 20000),
  fuente: textoOpcional('La fuente', 300),
  direccion: textoOpcional('La dirección', 200),
  localidad: z.preprocess(
    (v) => (v == null || (typeof v === 'string' && v.trim() === '') ? undefined : v),
    z
      .string({ error: 'La localidad debe ser un texto' })
      .trim()
      .max(80, 'La localidad puede tener hasta 80 caracteres')
      .default('San Miguel de Tucumán'),
  ),
  barrio: textoOpcional('El barrio', 80),
  horarios: textoOpcional('Los horarios', 200),
  imagen_url: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? null : v),
    urlImagen.nullish().transform((v) => v ?? null),
  ),
  lat,
  lng,
});

// PATCH /api/admin/lugares/:id/activo
const cambioActivo = z.object({
  activo: z.boolean({ error: '"activo" debe ser true o false' }),
});

module.exports = { filtros, lugar, cambioActivo };
