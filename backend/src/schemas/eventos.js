const { z } = require('zod');
const { valores } = require('../catalogos');
const {
  vacioEsSinFiltro,
  fecha,
  idTexto,
  lat,
  lng,
  texto,
  opcional,
  textoObligatorio,
  urlHttp,
} = require('./comunes');

// GET /api/eventos?categoria=&desde=&hasta=&lugar_id= (RF-02, RF-10). Un parámetro vacío equivale a sin filtro.
const filtros = z
  .object({
    categoria: z.preprocess(
      vacioEsSinFiltro,
      z.enum(valores('categorias_evento'), { error: 'La categoría no es válida' }).optional(),
    ),
    desde: fecha(false),
    hasta: fecha(true),
    // Los próximos eventos de la ficha de un lugar.
    lugar_id: z.preprocess(vacioEsSinFiltro, idTexto('El lugar no es válido').optional()),
  })
  .refine((f) => !f.desde || !f.hasta || f.desde <= f.hasta, {
    path: ['hasta'],
    message: '"hasta" no puede ser anterior a "desde"',
  });

// Fecha y hora de un evento: ISO 8601 con zona, para que no haya dudas de la hora local.
const fechaHora = (etiqueta) =>
  z.iso
    .datetime({ offset: true, error: `${etiqueta}: usá una fecha y hora como 2026-11-07T20:00:00-03:00` })
    .transform((v) => new Date(v));

// Etiquetas libres para buscar (ej. "folclore"): hasta 5 distintas. Las repetidas (sin
// distinguir mayúsculas) se juntan antes de contar. null o ausente es una lista vacía.
const etiquetas = z.preprocess(
  (v) => v ?? [],
  z
    .array(texto('Cada etiqueta', 30).min(2, 'Cada etiqueta debe tener al menos 2 caracteres'), {
      error: 'Las etiquetas deben ser una lista de textos',
    })
    .transform((lista) => lista.filter((e, i) => lista.findIndex((o) => o.toLowerCase() === e.toLowerCase()) === i))
    .pipe(z.array(z.string()).max(5, 'Podés poner hasta 5 etiquetas')),
);

// Para que un evento no quede en el mapa por años: empieza dentro del próximo año y dura
// hasta 31 días (la vista lo muestra hasta 24 hs después de su fin, RF-12).
const DIA_MS = 24 * 60 * 60 * 1000;
const MAX_ANTICIPACION_MS = 366 * DIA_MS;
const MAX_DURACION_MS = 31 * DIA_MS;

// POST /api/eventos (RF-07, RF-10). El mismo cuerpo lo usa después el panel (#47).
// El lugar se describe con texto (lugar_nombre, direccion, barrio); lugar_id es opcional y,
// si viene, el servicio comprueba que sea uno de los lugares activos del mapa.
const evento = z
  .object({
    nombre: textoObligatorio('El nombre', 3, 150, 'El nombre es obligatorio'),
    categoria: z.enum(valores('categorias_evento'), { error: 'La categoría no es válida' }),
    modalidad: z.enum(valores('modalidades_evento'), { error: 'La modalidad no es válida' }),
    descripcion: textoObligatorio('La descripción', 10, 2000, 'La descripción es obligatoria'),
    lugar_nombre: textoObligatorio('El nombre del lugar', 3, 150, 'El nombre del lugar es obligatorio'),
    direccion: textoObligatorio('La dirección', 3, 200, 'La dirección es obligatoria'),
    barrio: textoObligatorio('El barrio', 2, 80, 'El barrio es obligatorio'),
    lugar_id: opcional(
      z
        .number({ error: 'El lugar no es válido' })
        .int('El lugar no es válido')
        .positive('El lugar no es válido')
        .max(Number.MAX_SAFE_INTEGER, 'El lugar no es válido'),
    ),
    lat,
    lng,
    inicio: fechaHora('El inicio'),
    fin: opcional(fechaHora('El fin')),
    flyer_url: opcional(urlHttp('La URL del flyer')),
    etiquetas,
  })
  .refine((e) => e.inicio > new Date(), { path: ['inicio'], message: 'El evento tiene que empezar en el futuro' })
  .refine((e) => e.inicio - Date.now() <= MAX_ANTICIPACION_MS, {
    path: ['inicio'],
    message: 'El evento tiene que empezar dentro del próximo año',
  })
  .refine((e) => !e.fin || e.fin > e.inicio, { path: ['fin'], message: 'El fin tiene que ser posterior al inicio' })
  .refine((e) => !e.fin || e.fin - e.inicio <= MAX_DURACION_MS, {
    path: ['fin'],
    message: 'El evento puede durar hasta 31 días',
  });

module.exports = { filtros, evento };
