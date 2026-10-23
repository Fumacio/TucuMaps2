// Datos para las pruebas, con la forma exacta de GET /api/lugares/:id (docs/API TucuMaps.md).
// Salen de backend/seeds/lugares.js (un lugar por categoría, con el contenido histórico
// recortado al primer párrafo). Los id son inventados: en la base real pueden ser otros.

export const lugaresEjemplo = [
  {
    id: 1,
    nombre: 'Casa Histórica de la Independencia',
    categoria: 'historico',
    descripcion:
      'Casa donde el Congreso de Tucumán declaró la Independencia el 9 de julio de 1816. Hoy es museo y Monumento Histórico Nacional.',
    direccion: 'Congreso 151',
    localidad: 'San Miguel de Tucumán',
    barrio: 'Centro',
    horarios:
      'Martes a viernes: 9:00 a 13:00 hs y de 16:00 a 20:00 hs.\n\nSábados, domingos y feriados: 9:00 a 20:00 hs.\n\nLunes: Cerrado por mantenimiento.',
    precio_entrada: 'Gratuita',
    imagen_url:
      'https://commons.wikimedia.org/wiki/Special:FilePath/Tucuman-CasaIndependencia2.jpg?width=1024',
    lat: -26.833132,
    lng: -65.203841,
    contenido_historico:
      'La Casa de Tucumán, oficialmente denominada Casa Histórica de la Independencia, es una vivienda colonial ubicada en el centro de San Miguel de Tucumán. Su inmensa relevancia radica en que fue el escenario donde el Congreso de Tucumán proclamó la independencia de Argentina el 9 de julio de 1816, convirtiéndola en el edificio histórico más emblemático del país. Por este motivo, fue declarada Monumento Histórico Nacional en el año 1941.',
    fuente:
      'Texto propio basado en Wikipedia (https://es.wikipedia.org/wiki/Casa_de_Tucumán). Foto: Fulviusbsas, Wikimedia Commons, CC BY-SA 3.0.',
  },
  {
    id: 2,
    nombre: 'Catedral de San Miguel de Tucumán',
    categoria: 'religioso',
    descripcion: 'Catedral del siglo XIX ubicada frente a la Plaza Independencia.',
    direccion: '24 de Septiembre y Congreso',
    localidad: 'San Miguel de Tucumán',
    barrio: 'Centro',
    horarios:
      'Lunes a sábado: Abierta de 9:00 a 13:00 y de 17:00 a 21:30.\n\nDomingos: Permanece cerrada al público en horario general de visita, abriendo únicamente para las celebraciones litúrgicas y misas.',
    precio_entrada: 'Gratuita',
    imagen_url:
      'https://commons.wikimedia.org/wiki/Special:FilePath/Cathedral_tucuman2.JPG?width=1024',
    lat: -26.831202,
    lng: -65.203357,
    contenido_historico:
      'La Catedral de San Miguel de Tucumán es el templo principal y la iglesia matriz de la ciudad. Sus orígenes se remontan a la fundación urbana en el siglo XVI. En la actualidad, además de ser la cabecera de la provincia eclesiástica, funciona como sede del obispado desde el año 1897 y de la arquidiócesis tucumana desde 1957.',
    fuente:
      'Texto propio basado en Wikipedia (https://es.wikipedia.org/wiki/Catedral_de_Nuestra_Señora_de_la_Encarnación_(San_Miguel_de_Tucumán)). Foto: jlazarte, Wikimedia Commons, public domain.',
  },
  {
    id: 3,
    nombre: 'Museo Casa Padilla',
    categoria: 'cultural_museo',
    descripcion:
      'Casona del siglo XIX junto a la Casa de Gobierno, con mobiliario y arte de época.',
    direccion: '25 de Mayo 36',
    localidad: 'San Miguel de Tucumán',
    barrio: 'Centro',
    horarios:
      'Domingo y lunes: Cerrado\n\nMartes a viernes: 9:00 a 12:30 hs, 15:00 a 19:00 hs.\n\nSábado: 10:00 a 19:00 hs',
    precio_entrada: 'Gratuita',
    imagen_url:
      'https://commons.wikimedia.org/wiki/Special:FilePath/Casa_Padilla_-_Tucum%C3%A1n_-_panoramio.jpg?width=1024',
    lat: -26.830406,
    lng: -65.2047,
    contenido_historico:
      'Ubicado en el corazón de San Miguel de Tucumán, sobre la calle 25 de Mayo, junto a la Casa de Gobierno y frente a la emblemática Plaza Independencia, se encuentra el Museo Casa Padilla. Este notable edificio, que ostenta el título de Monumento Histórico Nacional desde el año 2001, resguarda una rica historia y un valioso patrimonio cultural.',
    fuente:
      'Texto propio basado en Wikipedia (https://es.wikipedia.org/wiki/Casa_Padilla). Foto: bullit, Wikimedia Commons, CC-BY-3.0.',
  },
  {
    id: 4,
    nombre: 'Villa Nougués',
    categoria: 'natural_paisaje',
    descripcion:
      'Villa veraniega de comienzos del siglo XX en lo alto del cerro San Javier, rodeada de selva de montaña.',
    direccion: 'Se accede por la Ruta Provincial 338',
    localidad: 'Villa Nougués',
    barrio: null,
    horarios: 'Abierto las 24hs.',
    precio_entrada: 'Gratuita',
    imagen_url: 'https://commons.wikimedia.org/wiki/Special:FilePath/Villa_Nougues.jpg?width=1024',
    lat: -26.849914,
    lng: -65.380426,
    contenido_historico:
      'Villa Nougués es una pintoresca localidad situada en el departamento de Lules, provincia de Tucumán, a unos 1350 metros sobre el nivel del mar. Conectada con la zona de San Javier a través de un camino montañoso, se ubica a 45 kilómetros de la capital provincial y se destaca por ofrecer un entorno natural privilegiado que mantiene un agradable clima mesotérmico durante todo el año.',
    fuente:
      'Texto propio basado en Wikipedia (https://es.wikipedia.org/wiki/Villa_Nougués). Foto: Pamrobles, Wikimedia Commons, CC-BY-SA-4.0.',
  },
  {
    id: 5,
    nombre: 'Parque 9 de Julio',
    categoria: 'recreativo',
    descripcion:
      'Gran parque urbano de comienzos del siglo XX, con lago, paseos y espacios verdes.',
    direccion: 'Avenida Soldati',
    localidad: 'San Miguel de Tucumán',
    barrio: 'Parque 9 de Julio',
    horarios: 'Abierto las 24hs.',
    precio_entrada: 'Gratuita',
    imagen_url:
      'https://commons.wikimedia.org/wiki/Special:FilePath/Tucuman_Parque_9_de_Julio_aerea.JPG?width=1024',
    lat: -26.82704,
    lng: -65.18609,
    contenido_historico:
      'El Parque 9 de Julio, situado en el sector este de San Miguel de Tucumán, es el pulmón verde más extenso del norte argentino. Su nombre rinde un justo homenaje a la Declaración de la Independencia Nacional, proclamada en esa misma ciudad en 1816.',
    fuente:
      'Texto propio basado en Wikipedia (https://es.wikipedia.org/wiki/Parque_9_de_Julio). Foto: José Lazarte, Wikimedia Commons, public domain.',
  },
]
