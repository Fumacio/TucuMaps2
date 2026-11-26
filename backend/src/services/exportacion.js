// RF-26: exportación del panel a una planilla de Excel (.xlsx), con una hoja por tipo de dato.
// La arma el servidor con exceljs y el navegador solo la descarga.
const ExcelJS = require('exceljs');
const lugaresModel = require('../models/lugares');
const reportesModel = require('../models/reportes');
const eventosModel = require('../models/eventos');
const { catalogos } = require('../catalogos');
const { HOJAS } = require('../schemas/exportacion');

// Etiquetas en español de los catálogos (SRS 3.1) y de los estados (diagramas del Modelo de datos).
const etiquetas = (nombre) => Object.fromEntries(catalogos[nombre].map((c) => [c.valor, c.etiqueta]));
const TIPOS_REPORTE = etiquetas('tipos_reporte');
const CATEGORIAS_LUGAR = etiquetas('categorias_lugar');
const CATEGORIAS_EVENTO = etiquetas('categorias_evento');
const MODALIDADES = etiquetas('modalidades_evento');
const ESTADOS = {
  pendiente: 'Pendiente',
  aprobado: 'Aprobado',
  rechazado: 'Rechazado',
  resuelto: 'Resuelto',
  cancelado: 'Cancelado',
  retirado: 'Retirado',
};

// Excel no guarda zona horaria: las fechas se escriben en hora de Tucumán (UTC-3 fijo, sin
// horario de verano desde 2009, igual que los filtros de schemas/comunes.js).
const DESFASE_TUCUMAN = -3 * 60 * 60 * 1000;
const aHoraTucuman = (valor) => (valor ? new Date(new Date(valor).getTime() + DESFASE_TUCUMAN) : null);
const diaTucuman = (fecha) => aHoraTucuman(fecha).toISOString().slice(0, 10);

const siNo = (v) => (v ? 'Sí' : 'No');

// Un reporte rechazado o cancelado nunca se publicó: su descripción no sale del sistema (puede
// ser justo la que se rechazó por nombrar a un tercero, y la planilla escapa a la retención de
// RF-24). Quedan su tipo, ubicación, fechas y el motivo que escribió el admin.
const NO_PUBLICADOS = ['rechazado', 'cancelado'];
const descripcionPublicable = (f) => (NO_PUBLICADOS.includes(f.estado) ? '(no se exporta: no se publicó)' : f.descripcion);
const nombreDe = (persona) => persona?.nombre ?? null;

const FORMATO_FECHA = 'dd/mm/yyyy hh:mm';
const FORMATO_COORD = '0.000000';
const COLOR_ENCABEZADO = 'FF009C51'; // --verde del frontend

// Columnas de cada hoja: título, ancho y cómo sacar el valor de la fila. `fecha` y `coord`
// aplican el formato de celda. El autor de un reporte o una propuesta no se exporta: la
// planilla sale del sistema y puede circular (RNF-07); los moderadores sí, porque son admins.
const COLUMNAS = {
  lugares: [
    { titulo: 'ID', ancho: 6, valor: (l) => l.id },
    { titulo: 'Nombre', ancho: 38, valor: (l) => l.nombre },
    { titulo: 'Categoría', ancho: 18, valor: (l) => CATEGORIAS_LUGAR[l.categoria] ?? l.categoria },
    { titulo: 'Activo en el mapa', ancho: 10, valor: (l) => siNo(l.activo) },
    { titulo: 'Localidad', ancho: 22, valor: (l) => l.localidad },
    { titulo: 'Barrio', ancho: 20, valor: (l) => l.barrio },
    { titulo: 'Dirección', ancho: 30, valor: (l) => l.direccion },
    { titulo: 'Latitud', ancho: 12, valor: (l) => l.lat, coord: true },
    { titulo: 'Longitud', ancho: 12, valor: (l) => l.lng, coord: true },
    { titulo: 'Horarios', ancho: 30, valor: (l) => l.horarios },
    { titulo: 'Precio de entrada', ancho: 18, valor: (l) => l.precio_entrada },
    { titulo: 'Descripción', ancho: 60, valor: (l) => l.descripcion },
    { titulo: 'Contenido histórico', ancho: 60, valor: (l) => l.contenido_historico },
    { titulo: 'Fuente', ancho: 30, valor: (l) => l.fuente },
    { titulo: 'Imagen (URL)', ancho: 40, valor: (l) => l.imagen_url },
    { titulo: 'Creado', ancho: 17, valor: (l) => l.creado_en, fecha: true },
    { titulo: 'Actualizado', ancho: 17, valor: (l) => l.actualizado_en, fecha: true },
  ],
  reportes: [
    { titulo: 'ID', ancho: 6, valor: (r) => r.id },
    { titulo: 'Tipo', ancho: 32, valor: (r) => TIPOS_REPORTE[r.tipo] ?? r.tipo },
    { titulo: 'Estado', ancho: 12, valor: (r) => ESTADOS[r.estado] ?? r.estado },
    { titulo: 'Visible en el mapa', ancho: 10, valor: (r) => siNo(r.activa) },
    { titulo: 'Descripción', ancho: 60, valor: descripcionPublicable },
    { titulo: 'Dirección', ancho: 30, valor: (r) => r.direccion },
    { titulo: 'Barrio', ancho: 20, valor: (r) => r.barrio },
    { titulo: 'Latitud', ancho: 12, valor: (r) => r.lat, coord: true },
    { titulo: 'Longitud', ancho: 12, valor: (r) => r.lng, coord: true },
    { titulo: 'Confirmaciones', ancho: 10, valor: (r) => r.confirmaciones },
    { titulo: 'Enviado', ancho: 17, valor: (r) => r.creado_en, fecha: true },
    { titulo: 'Revisado por', ancho: 20, valor: (r) => nombreDe(r.revisado_por) },
    { titulo: 'Revisado el', ancho: 17, valor: (r) => r.revisado_en, fecha: true },
    { titulo: 'Aprobado el', ancho: 17, valor: (r) => r.aprobado_en, fecha: true },
    { titulo: 'Motivo de rechazo', ancho: 40, valor: (r) => r.motivo_rechazo },
    { titulo: 'Resuelto el', ancho: 17, valor: (r) => r.resuelto_en, fecha: true },
    { titulo: 'Retirado por', ancho: 20, valor: (r) => nombreDe(r.retirado_por) },
    { titulo: 'Retirado el', ancho: 17, valor: (r) => r.retirado_en, fecha: true },
  ],
  eventos: [
    { titulo: 'ID', ancho: 6, valor: (e) => e.id },
    { titulo: 'Nombre', ancho: 36, valor: (e) => e.nombre },
    { titulo: 'Categoría', ancho: 14, valor: (e) => CATEGORIAS_EVENTO[e.categoria] ?? e.categoria },
    { titulo: 'Modalidad', ancho: 14, valor: (e) => MODALIDADES[e.modalidad] ?? e.modalidad },
    { titulo: 'Estado', ancho: 12, valor: (e) => ESTADOS[e.estado] ?? e.estado },
    { titulo: 'En la agenda', ancho: 10, valor: (e) => siNo(e.vigente) },
    { titulo: 'Archivado', ancho: 10, valor: (e) => siNo(e.archivado) },
    { titulo: 'Inicio', ancho: 17, valor: (e) => e.inicio, fecha: true },
    { titulo: 'Fin', ancho: 17, valor: (e) => e.fin, fecha: true },
    { titulo: 'Lugar', ancho: 30, valor: (e) => e.lugar_nombre },
    { titulo: 'Dirección', ancho: 30, valor: (e) => e.direccion },
    { titulo: 'Barrio', ancho: 20, valor: (e) => e.barrio },
    { titulo: 'Latitud', ancho: 12, valor: (e) => e.lat, coord: true },
    { titulo: 'Longitud', ancho: 12, valor: (e) => e.lng, coord: true },
    { titulo: 'Etiquetas', ancho: 24, valor: (e) => (e.etiquetas?.length ? e.etiquetas.join(', ') : null) },
    { titulo: 'Descripción', ancho: 60, valor: descripcionPublicable },
    { titulo: 'Flyer (URL)', ancho: 40, valor: (e) => e.flyer_url },
    { titulo: 'Cargado', ancho: 17, valor: (e) => e.creado_en, fecha: true },
    { titulo: 'Revisado por', ancho: 20, valor: (e) => nombreDe(e.revisado_por) },
    { titulo: 'Revisado el', ancho: 17, valor: (e) => e.revisado_en, fecha: true },
    { titulo: 'Motivo de rechazo', ancho: 40, valor: (e) => e.motivo_rechazo },
    { titulo: 'Retirado por', ancho: 20, valor: (e) => nombreDe(e.retirado_por) },
    { titulo: 'Retirado el', ancho: 17, valor: (e) => e.retirado_en, fecha: true },
  ],
};

const NOMBRES_HOJA = { lugares: 'Lugares', reportes: 'Reportes de seguridad', eventos: 'Eventos' };

// Encabezado verde con letra blanca, fila fija al bajar y filtros en cada columna.
function agregarHoja(libro, clave, filas) {
  const columnas = COLUMNAS[clave];
  const hoja = libro.addWorksheet(NOMBRES_HOJA[clave], {
    views: [{ state: 'frozen', ySplit: 1 }],
    // Al imprimir: apaisada y con todas las columnas en el ancho de la hoja.
    pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  });
  hoja.columns = columnas.map((c) => ({
    header: c.titulo,
    width: c.ancho,
    style: c.fecha ? { numFmt: FORMATO_FECHA } : c.coord ? { numFmt: FORMATO_COORD } : {},
  }));
  const encabezado = hoja.getRow(1);
  encabezado.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  encabezado.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_ENCABEZADO } };
  encabezado.alignment = { vertical: 'middle', wrapText: true };
  encabezado.height = 30;
  // Los textos van siempre como texto (nunca como fórmula): una descripción que empieza con
  // "=" se ve tal cual en Excel y no se ejecuta.
  // Alto fijo: un texto largo con saltos de línea no estira la fila (se lee entero en la celda).
  for (const fila of filas) {
    const nueva = hoja.addRow(columnas.map((c) => (c.fecha ? aHoraTucuman(c.valor(fila)) : c.valor(fila) ?? null)));
    nueva.height = 18;
  }
  hoja.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columnas.length } };
}

// Cuántas filas hay de cada estado, en el orden del diagrama de estados.
function porEstado(filas) {
  return Object.keys(ESTADOS)
    .map((estado) => [ESTADOS[estado], filas.filter((f) => f.estado === estado).length])
    .filter(([, cantidad]) => cantidad > 0);
}

// Primera hoja: qué se exportó, cuándo, quién y con qué período, más los totales.
function agregarResumen(libro, { generado, admin, desde, hasta, datos }) {
  const hoja = libro.addWorksheet('Resumen');
  hoja.columns = [{ width: 34 }, { width: 40 }];
  hoja.addRow(['TucuMaps: exportación de datos']).font = { bold: true, size: 14 };
  hoja.addRow([]);
  hoja.addRow(['Generado el', aHoraTucuman(generado)]).getCell(2).numFmt = FORMATO_FECHA;
  hoja.addRow(['Generado por', admin.nombre]);
  let periodo = 'Todo el historial';
  if (desde && hasta) periodo = `Del ${diaTucuman(desde)} al ${diaTucuman(hasta)}`;
  else if (desde) periodo = `Desde el ${diaTucuman(desde)}`;
  else if (hasta) periodo = `Hasta el ${diaTucuman(hasta)}`;
  hoja.addRow(['Período', periodo]);
  hoja.addRow(['', 'Reportes por fecha de envío, eventos por fecha de inicio. Los lugares van siempre todos.']);
  hoja.addRow(['Hora', 'Hora de Tucumán (UTC-3)']);

  const seccion = (titulo, total, detalle) => {
    hoja.addRow([]);
    hoja.addRow([titulo, total]).font = { bold: true };
    for (const fila of detalle) hoja.addRow([`   ${fila[0]}`, fila[1]]);
  };
  if (datos.lugares) {
    const activos = datos.lugares.filter((l) => l.activo).length;
    seccion('Lugares', datos.lugares.length, [['Activos en el mapa', activos], ['Ocultos', datos.lugares.length - activos]]);
  }
  if (datos.reportes) seccion('Reportes de seguridad', datos.reportes.length, porEstado(datos.reportes));
  if (datos.eventos) seccion('Eventos', datos.eventos.length, porEstado(datos.eventos));
  hoja.getColumn(2).alignment = { horizontal: 'left', wrapText: true };
}

// Arma el libro con las hojas pedidas (por defecto todas) y devuelve el archivo y su nombre.
async function generarExcel({ hojas, desde, hasta }, admin, generado = new Date()) {
  const pedidas = HOJAS.filter((h) => hojas.includes(h));
  const [lugares, reportes, eventos] = await Promise.all([
    pedidas.includes('lugares') ? lugaresModel.listarParaExportar() : null,
    pedidas.includes('reportes') ? reportesModel.listarParaExportar({ desde, hasta }) : null,
    pedidas.includes('eventos') ? eventosModel.listarParaExportar({ desde, hasta }) : null,
  ]);
  const datos = { lugares, reportes, eventos };

  const libro = new ExcelJS.Workbook();
  libro.creator = 'TucuMaps';
  agregarResumen(libro, { generado, admin, desde, hasta, datos });
  for (const clave of pedidas) agregarHoja(libro, clave, datos[clave]);

  const archivo = Buffer.from(await libro.xlsx.writeBuffer());
  return { archivo, nombre: `TucuMaps-exportacion-${diaTucuman(generado)}.xlsx` };
}

module.exports = { generarExcel };
