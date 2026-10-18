// Catálogos de valores (SRS 3.1, RF-10). Única fuente en el backend: GET /api/catalogos
// los devuelve y los esquemas zod de los próximos endpoints los toman con valores().
// Deben coincidir con los CHECK de la base; agregar un valor requiere una migración
// (lo verifica tests/catalogos.test.js).

const congelar = (lista) => Object.freeze(lista.map((item) => Object.freeze(item)));

const catalogos = Object.freeze({
  tipos_reporte: congelar([
    // Los cuatro con ícono en el mapa (decisión de Nacho, 18/10/2026).
    { valor: 'riesgo_comunitario', etiqueta: 'Defensa civil y riesgos comunitarios' },
    { valor: 'robo_asalto', etiqueta: 'Robos, asaltos y entraderas' },
    { valor: 'disturbio', etiqueta: 'Disturbios en la calle y marchas' },
    { valor: 'accidente_transito', etiqueta: 'Accidentes de tránsito' },
  ]),
  categorias_lugar: congelar([
    { valor: 'historico', etiqueta: 'Histórico' },
    { valor: 'cultural_museo', etiqueta: 'Cultural / museo' },
    { valor: 'natural_paisaje', etiqueta: 'Natural / paisaje' },
    { valor: 'religioso', etiqueta: 'Religioso' },
    { valor: 'recreativo', etiqueta: 'Recreativo' },
  ]),
  categorias_evento: congelar([
    { valor: 'musica', etiqueta: 'Música' },
    { valor: 'teatro', etiqueta: 'Teatro' },
    { valor: 'feria', etiqueta: 'Feria' },
    { valor: 'gastronomia', etiqueta: 'Gastronomía' },
    { valor: 'deporte', etiqueta: 'Deporte' },
    { valor: 'cultural', etiqueta: 'Cultural' },
    { valor: 'otro', etiqueta: 'Otro' },
  ]),
  modalidades_evento: congelar([
    { valor: 'gratuita', etiqueta: 'Gratuita' },
    { valor: 'con_entrada', etiqueta: 'Con entrada' },
    { valor: 'a_la_gorra', etiqueta: 'A la gorra' },
  ]),
});

// Solo los valores, para armar z.enum(...) en los esquemas.
function valores(nombre) {
  const lista = catalogos[nombre];
  if (!lista) throw new Error(`No existe el catálogo "${nombre}"`);
  return lista.map((c) => c.valor);
}

module.exports = { catalogos, valores };
