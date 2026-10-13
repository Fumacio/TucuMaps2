// Los 20 lugares de la carga inicial (docs/Seed lugares TucuMaps.md, RF-02).
//
// Coordenadas: las marcadas con `verificado: true` se compararon con OpenStreetMap el
// 13/10/2026, salvo Catedral, San Francisco, La Merced y Cristo Bendicente, que Nacho
// confirmó en Google Maps ese mismo día. Las demás son las aproximadas del documento y
// hay que confirmarlas en el mapa (clic derecho > copiar coordenadas).
//
// contenido_historico, fuente, horarios e imagen_url quedan en null hasta que Lourdes
// prepare los textos y las fotos (ver el issue de contenido de los 20 lugares). Cuando
// estén, se completan acá y se corre `npm run seed -- --actualizar`.

const CAPITAL = 'San Miguel de Tucumán';

const lugares = [
  // ---------- San Miguel de Tucumán, centro histórico ----------
  {
    nombre: 'Casa Histórica de la Independencia',
    categoria: 'historico',
    descripcion: 'Casa donde el Congreso de Tucumán declaró la Independencia el 9 de julio de 1816. Hoy es museo y Monumento Histórico Nacional.',
    direccion: 'Congreso 151',
    localidad: CAPITAL,
    barrio: 'Centro',
    lat: -26.83301, lng: -65.20432, verificado: true,
  },
  {
    nombre: 'Plaza Independencia',
    categoria: 'historico',
    descripcion: 'Plaza fundacional de la ciudad, rodeada de edificios históricos. Tiene la estatua de la Libertad de Lola Mora.',
    direccion: '24 de Septiembre y San Martín',
    localidad: CAPITAL,
    barrio: 'Centro',
    lat: -26.83049, lng: -65.20386, verificado: true,
  },
  {
    nombre: 'Casa de Gobierno',
    categoria: 'historico',
    descripcion: 'Edificio de comienzos del siglo XX frente a la Plaza Independencia, construido para el Centenario.',
    direccion: '25 de Mayo y San Martín',
    localidad: CAPITAL,
    barrio: 'Centro',
    lat: -26.82999, lng: -65.20508, verificado: true,
  },
  {
    nombre: 'Catedral de San Miguel de Tucumán',
    categoria: 'religioso',
    descripcion: 'Catedral del siglo XIX ubicada frente a la Plaza Independencia.',
    direccion: '24 de Septiembre y Congreso',
    localidad: CAPITAL,
    barrio: 'Centro',
    lat: -26.831202, lng: -65.203357, verificado: true,
  },
  {
    nombre: 'Iglesia y Convento de San Francisco',
    categoria: 'religioso',
    descripcion: 'Uno de los templos más antiguos de la ciudad, frente a la Plaza Independencia.',
    direccion: '25 de Mayo 110',
    localidad: CAPITAL,
    barrio: 'Centro',
    lat: -26.829490, lng: -65.204456, verificado: true,
  },
  {
    nombre: 'Basílica de Nuestra Señora de la Merced',
    categoria: 'religioso',
    descripcion: 'Belgrano nombró a la Virgen de la Merced Generala del Ejército después de la Batalla de Tucumán de 1812.',
    direccion: '24 de Septiembre y Las Heras',
    localidad: CAPITAL,
    barrio: 'Centro',
    lat: -26.831337, lng: -65.201116, verificado: true,
  },
  {
    nombre: 'Museo Casa Padilla',
    categoria: 'cultural_museo',
    descripcion: 'Casona del siglo XIX junto a la Casa de Gobierno, con mobiliario y arte de época.',
    direccion: '25 de Mayo 36',
    localidad: CAPITAL,
    barrio: 'Centro',
    lat: -26.83043, lng: -65.20461, verificado: true,
  },
  {
    nombre: 'Museo Histórico Provincial Presidente Nicolás Avellaneda',
    categoria: 'cultural_museo',
    descripcion: 'Casa de la familia del presidente tucumano Nicolás Avellaneda, dedicada a la historia de la provincia.',
    direccion: 'Congreso 56',
    localidad: CAPITAL,
    barrio: 'Centro',
    lat: -26.83225, lng: -65.20332, verificado: true,
  },
  {
    nombre: 'Museo Folklórico Provincial General Manuel Belgrano',
    categoria: 'cultural_museo',
    descripcion: 'Casona colonial con instrumentos, textiles y tradiciones del Noroeste argentino.',
    direccion: '24 de Septiembre 565',
    localidad: CAPITAL,
    barrio: 'Centro',
    lat: -26.83073, lng: -65.20567, verificado: true,
  },
  {
    nombre: 'Teatro San Martín',
    categoria: 'cultural_museo',
    descripcion: 'Principal teatro de la provincia, inaugurado a comienzos del siglo XX.',
    direccion: 'Avenida Sarmiento 601',
    localidad: CAPITAL,
    barrio: 'Barrio Norte',
    lat: -26.81781, lng: -65.20335, verificado: true,
  },
  {
    nombre: 'Plaza Belgrano (Campo de las Carreras)',
    categoria: 'historico',
    descripcion: 'Escenario de la Batalla de Tucumán del 24 de septiembre de 1812.',
    direccion: 'Bernabé Aráoz y Avenida Roca',
    localidad: CAPITAL,
    barrio: 'Ciudadela',
    lat: -26.83734, lng: -65.21656, verificado: true,
  },
  {
    nombre: 'Parque 9 de Julio',
    categoria: 'recreativo',
    descripcion: 'Gran parque urbano de comienzos del siglo XX, con lago, paseos y espacios verdes.',
    direccion: 'Avenida Soldati',
    localidad: CAPITAL,
    barrio: 'Parque 9 de Julio',
    lat: -26.82704, lng: -65.18609, verificado: true,
  },
  {
    nombre: 'Museo Casa del Obispo Colombres',
    categoria: 'cultural_museo',
    descripcion: 'Museo dentro del Parque 9 de Julio que recuerda al pionero de la industria azucarera tucumana.',
    direccion: 'Parque 9 de Julio',
    localidad: CAPITAL,
    barrio: 'Parque 9 de Julio',
    lat: -26.82660, lng: -65.19028, verificado: true,
  },

  // ---------- Gran Tucumán e interior ----------
  {
    nombre: 'Cristo Bendicente',
    categoria: 'religioso',
    descripcion: 'Monumento en la cima del cerro San Javier, con vista panorámica a la ciudad.',
    direccion: 'Cerro San Javier',
    localidad: 'San Javier (Yerba Buena)',
    lat: -26.796875, lng: -65.360289, verificado: true,
  },
  {
    nombre: 'Ruinas de San José de Lules',
    categoria: 'historico',
    descripcion: 'Restos de una misión jesuítica de los siglos XVII y XVIII.',
    direccion: null,
    localidad: 'Lules',
    lat: -26.9268, lng: -65.3466, verificado: false,
  },
  {
    nombre: 'Ruinas de Ibatín',
    categoria: 'historico',
    descripcion: 'Primer emplazamiento de San Miguel de Tucumán, fundado en 1565 antes del traslado a su lugar actual.',
    direccion: null,
    localidad: 'Monteros',
    lat: -27.1700, lng: -65.5800, verificado: false,
  },
  {
    nombre: 'Parque de los Menhires',
    categoria: 'historico',
    descripcion: 'Piedras talladas por la cultura Tafí hace unos 2000 años.',
    direccion: null,
    localidad: 'El Mollar (Tafí del Valle)',
    lat: -26.94019, lng: -65.71081, verificado: true,
  },
  {
    nombre: 'Capilla y Museo Jesuítico La Banda',
    categoria: 'historico',
    descripcion: 'Estancia jesuítica del siglo XVIII con capilla y museo.',
    direccion: 'Ruta Provincial 325',
    localidad: 'Tafí del Valle',
    lat: -26.85966, lng: -65.71722, verificado: true,
  },
  {
    nombre: 'Ciudad Sagrada de Quilmes',
    categoria: 'historico',
    descripcion: 'Uno de los mayores asentamientos prehispánicos del país, del pueblo Quilmes.',
    direccion: 'Acceso a Ruinas de Quilmes',
    localidad: 'Valles Calchaquíes',
    lat: -26.46617, lng: -66.04023, verificado: true,
  },
  {
    nombre: 'Museo de la Pachamama',
    categoria: 'cultural_museo',
    descripcion: 'Museo sobre la cultura y la cosmovisión de los Valles Calchaquíes.',
    direccion: 'Ruta Provincial 357',
    localidad: 'Amaicha del Valle',
    lat: -26.58821, lng: -65.92042, verificado: true,
  },
];

module.exports = lugares;
