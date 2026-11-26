// Datos de demostración (#97): reportes y eventos de ejemplo para probar el panel de
// administración y para la presentación del TFI. Todo dice "[Ejemplo]" para que nadie
// lo tome como una alerta o un evento real. Se cargan con `npm run seed-demo`.
const lugaresSeed = require('./lugares');

// El usuario de ejemplo. El dominio .invalid está reservado (RFC 2606): nunca recibe correo,
// así nadie puede registrar y verificar esta dirección antes que el script.
const USUARIO_DEMO = Object.freeze({
  nombre: 'Usuario de demostración',
  email: 'demo@tucumaps.invalid',
});

const MOTIVO_RECHAZO_DEMO = '[Ejemplo] No se pudo verificar lo que describe el reporte.';

// minutos: hace cuánto se envió (o se aprobó, si está aprobado). Las alertas aprobadas se ven
// 24 hs desde su aprobación (RF-11), así que todas quedan dentro de esa ventana.
const reportes = [
  {
    estado: 'aprobado', minutos: 30, tipo: 'robo_asalto', barrio: 'Barrio Sur',
    direccion: 'Avenida Roca al 400', lat: -26.838900, lng: -65.207400,
    descripcion: '[Ejemplo] Vecinos cuentan que a la salida de la escuela le quitaron el celular a un chico. Tengan cuidado en la parada del colectivo.',
  },
  {
    estado: 'aprobado', minutos: 10, tipo: 'accidente_transito', barrio: 'Barrio Norte',
    direccion: 'Avenida Mate de Luna y Avenida Mitre', lat: -26.823500, lng: -65.215900,
    descripcion: '[Ejemplo] Colectivo detenido por un choque leve. Se recomienda tomar otra calle.',
  },
  {
    estado: 'aprobado', minutos: 50, tipo: 'disturbio', barrio: 'Centro',
    direccion: '24 de Septiembre y 25 de Mayo', lat: -26.830900, lng: -65.205100,
    descripcion: '[Ejemplo] Pelea entre varias personas en la esquina de la plaza. Ya llegó la policía.',
  },
  {
    estado: 'aprobado', minutos: 100, tipo: 'riesgo_comunitario', barrio: 'Parque 9 de Julio',
    direccion: 'Avenida Soldati, cerca del lago', lat: -26.829800, lng: -65.189400,
    descripcion: '[Ejemplo] Zona del paseo sin luz de noche y con varios arrebatos esta semana. Mejor ir acompañado.',
  },
  {
    estado: 'pendiente', minutos: 20, tipo: 'robo_asalto', barrio: 'Ciudadela',
    direccion: 'Avenida Alem al 1000', lat: -26.845600, lng: -65.214200,
    descripcion: '[Ejemplo] Le robaron la moto a un vecino que la dejó estacionada en la vereda.',
  },
  {
    estado: 'rechazado', minutos: 180, tipo: 'robo_asalto', barrio: 'Villa 9 de Julio',
    direccion: 'Avenida Independencia al 2000', lat: -26.802600, lng: -65.214700,
    descripcion: '[Ejemplo] Dicen que hubo un robo, pero no sé bien dónde ni cuándo.',
  },
];

// Datos de la sede tomados del seed de lugares, para que coincidan con el mapa.
function sede(nombre) {
  const lugar = lugaresSeed.find((l) => l.nombre === nombre);
  if (!lugar) throw new Error(`El lugar "${nombre}" no está en el seed`);
  return {
    sede: lugar.nombre, lugar_nombre: lugar.nombre, direccion: lugar.direccion,
    barrio: lugar.barrio, lat: lugar.lat, lng: lugar.lng,
  };
}

// dia: cuántos días después de hoy empieza; hora y duracion (horas) en la hora de Tucumán.
const eventos = [
  {
    estado: 'aprobado', dia: 1, hora: 18, duracion: 2, categoria: 'cultural', modalidad: 'gratuita',
    nombre: '[Ejemplo] Visita guiada nocturna a la Casa Histórica',
    descripcion: '[Ejemplo] Recorrido por las salas de la Casa Histórica contando cómo se vivió el 9 de julio de 1816.',
    etiquetas: ['ejemplo', 'historia'], ...sede('Casa Histórica de la Independencia'),
  },
  {
    estado: 'aprobado', dia: 2, hora: 20, duracion: 2, categoria: 'teatro', modalidad: 'con_entrada',
    nombre: '[Ejemplo] Obra de teatro de la comedia provincial',
    descripcion: '[Ejemplo] Función de una obra de la comedia provincial. Entradas en la boletería del teatro.',
    etiquetas: ['ejemplo', 'teatro'], ...sede('Teatro San Martín'),
  },
  {
    estado: 'aprobado', dia: 3, hora: 10, duracion: 6, categoria: 'feria', modalidad: 'gratuita',
    nombre: '[Ejemplo] Feria de artesanos en el parque',
    descripcion: '[Ejemplo] Puestos de artesanías, plantas y comidas regionales junto al lago.',
    etiquetas: ['ejemplo', 'feria'], ...sede('Parque 9 de Julio'),
  },
  {
    estado: 'aprobado', dia: 5, hora: 19, duracion: null, categoria: 'musica', modalidad: 'a_la_gorra',
    nombre: '[Ejemplo] Peña folclórica en la plaza',
    descripcion: '[Ejemplo] Música en vivo y baile para toda la familia. Los músicos pasan la gorra.',
    etiquetas: ['ejemplo', 'folclore'], ...sede('Plaza Independencia'),
  },
  {
    estado: 'aprobado', dia: 8, hora: 11, duracion: 2, categoria: 'cultural', modalidad: 'gratuita',
    nombre: '[Ejemplo] Muestra de arte tucumano en el museo',
    descripcion: '[Ejemplo] Visita comentada a una muestra de pintores tucumanos. Entrada libre.',
    etiquetas: ['ejemplo', 'arte'], ...sede('Museo Casa Padilla'),
  },
  {
    estado: 'aprobado', dia: 10, hora: 9, duracion: 4, categoria: 'deporte', modalidad: 'gratuita',
    nombre: '[Ejemplo] Bicicleteada por el Campo de las Carreras',
    descripcion: '[Ejemplo] Paseo en bici para toda la familia. Traer casco y agua.',
    etiquetas: ['ejemplo', 'bici'], ...sede('Plaza Belgrano (Campo de las Carreras)'),
  },
  {
    estado: 'pendiente', dia: 4, hora: 21, duracion: 3, categoria: 'musica', modalidad: 'con_entrada',
    nombre: '[Ejemplo] Recital de bandas locales',
    descripcion: '[Ejemplo] Tres bandas tucumanas tocan en un centro cultural del centro.',
    lugar_nombre: 'Centro cultural de ejemplo', direccion: 'San Martín al 1000', barrio: 'Centro',
    lat: -26.828900, lng: -65.211300, etiquetas: ['ejemplo', 'rock'],
  },
  {
    estado: 'pendiente', dia: 6, hora: 12, duracion: 4, categoria: 'gastronomia', modalidad: 'gratuita',
    nombre: '[Ejemplo] Festival de la empanada tucumana',
    descripcion: '[Ejemplo] Degustación y concurso de empanadas con cocineros de distintos barrios.',
    lugar_nombre: 'Plaza de ejemplo', direccion: 'Avenida Mate de Luna al 2500', barrio: 'Barrio Norte',
    lat: -26.824800, lng: -65.226100, etiquetas: ['ejemplo', 'comida'],
  },
  {
    estado: 'pendiente', dia: 7, hora: 8, duracion: 3, categoria: 'deporte', modalidad: 'gratuita',
    nombre: '[Ejemplo] Corrida solidaria de 5 km',
    descripcion: '[Ejemplo] Carrera recreativa por los caminos del parque. Se pide un alimento no perecedero.',
    etiquetas: ['ejemplo', 'running'], ...sede('Parque 9 de Julio'),
  },
  {
    estado: 'pendiente', dia: 9, hora: 17, duracion: 2, categoria: 'otro', modalidad: 'gratuita',
    nombre: '[Ejemplo] Taller de fotografía urbana',
    descripcion: '[Ejemplo] Salida para aprender a sacar fotos de la arquitectura del centro con el celular.',
    etiquetas: ['ejemplo', 'fotografía'], ...sede('Plaza Independencia'),
  },
];

module.exports = { USUARIO_DEMO, MOTIVO_RECHAZO_DEMO, reportes, eventos };
