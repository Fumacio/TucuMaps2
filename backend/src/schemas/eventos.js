const { z } = require('zod');
const { valores } = require('../catalogos');
const {
  vacioEsSinFiltro,
  idTexto,
  lat,
  lng,
  texto,
  opcional,
  textoObligatorio,
} = require('./comunes');

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

// URL del flyer: solo http o https, como las imágenes de los lugares.
const urlFlyer = texto('La URL del flyer', 500).pipe(
  z.url({ protocol: /^https?$/, error: 'La URL del flyer debe empezar con http:// o https://' }),
);

// Etiquetas libres para buscar (ej. "folclore"): hasta 5, sin repetidas.
const etiquetas = z
  .array(texto('Cada etiqueta', 30).min(2, 'Cada etiqueta debe tener al menos 2 caracteres'), {
    error: 'Las etiquetas deben ser una lista de textos',
  })
  .max(5, 'Podés poner hasta 5 etiquetas')
  .transform((lista) => [...new Set(lista)]);

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
    flyer_url: opcional(urlFlyer),
    etiquetas: etiquetas.default([]),
  })
  .refine((e) => e.inicio > new Date(), { path: ['inicio'], message: 'El evento tiene que empezar en el futuro' })
  .refine((e) => !e.fin || e.fin > e.inicio, { path: ['fin'], message: 'El fin tiene que ser posterior al inicio' });

module.exports = { filtros, evento };
