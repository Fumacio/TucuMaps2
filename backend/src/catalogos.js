// Catálogos de valores (SRS 3.1, RF-10). Única fuente en el backend: los esquemas
// zod y GET /api/catalogos usan estas listas. Deben coincidir con los CHECK de la base;
// agregar un valor requiere una migración (lo verifica tests/catalogos.test.js).

const catalogos = {
  tipos_reporte: [
    { valor: 'robo_hurto', etiqueta: 'Robo o hurto' },
    { valor: 'arrebato_motochorro', etiqueta: 'Arrebato / motochorro' },
    { valor: 'zona_sin_iluminacion', etiqueta: 'Zona sin iluminación' },
    { valor: 'zona_peligrosa', etiqueta: 'Zona peligrosa' },
    { valor: 'accidente_transito', etiqueta: 'Accidente de tránsito' },
    { valor: 'otro', etiqueta: 'Otro' },
  ],
  categorias_lugar: [
    { valor: 'historico', etiqueta: 'Histórico' },
    { valor: 'cultural_museo', etiqueta: 'Cultural / museo' },
    { valor: 'natural_paisaje', etiqueta: 'Natural / paisaje' },
    { valor: 'religioso', etiqueta: 'Religioso' },
    { valor: 'recreativo', etiqueta: 'Recreativo' },
  ],
  categorias_evento: [
    { valor: 'musica', etiqueta: 'Música' },
    { valor: 'teatro', etiqueta: 'Teatro' },
    { valor: 'feria', etiqueta: 'Feria' },
    { valor: 'gastronomia', etiqueta: 'Gastronomía' },
    { valor: 'deporte', etiqueta: 'Deporte' },
    { valor: 'cultural', etiqueta: 'Cultural' },
    { valor: 'otro', etiqueta: 'Otro' },
  ],
  modalidades_evento: [
    { valor: 'gratuita', etiqueta: 'Gratuita' },
    { valor: 'con_entrada', etiqueta: 'Con entrada' },
    { valor: 'a_la_gorra', etiqueta: 'A la gorra' },
  ],
};

// Solo los valores, para armar z.enum(...) en los esquemas.
const valores = (nombre) => catalogos[nombre].map((c) => c.valor);

module.exports = { catalogos, valores };
