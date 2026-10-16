const { z } = require('zod');
const { valores } = require('../catalogos');
const {
  vacioEsSinFiltro,
  lat,
  lng,
  texto,
  opcional,
  textoOpcional,
  urlImagen,
} = require('./comunes');

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
    .pipe(texto('El nombre', 150).min(2, 'El nombre debe tener al menos 2 caracteres')),
  categoria: z.enum(valores('categorias_lugar'), { error: 'La categoría no es válida' }),
  descripcion: textoOpcional('La descripción', 2000),
  contenido_historico: textoOpcional('El contenido histórico', 20000),
  fuente: textoOpcional('La fuente', 300),
  direccion: textoOpcional('La dirección', 200),
  localidad: opcional(texto('La localidad', 80)).transform((v) => v ?? 'San Miguel de Tucumán'),
  barrio: textoOpcional('El barrio', 80),
  horarios: textoOpcional('Los horarios', 200),
  imagen_url: opcional(urlImagen),
  lat,
  lng,
});

// PATCH /api/admin/lugares/:id/activo
const cambioActivo = z.object({
  activo: z.boolean({ error: '"activo" debe ser true o false' }),
});

module.exports = { filtros, lugar, cambioActivo };
