// RF-10: la caja rectangular aproximada de Tucumán, la misma que valida la API.
export const CAJA_TUCUMAN = [
  [-28, -66.5], // sudoeste
  [-26, -64.5], // noreste
]

// Las opciones de un mapa para que no se pueda arrastrar afuera de esa caja, ni un poco.
export const LIMITES_TUCUMAN = { maxBounds: CAJA_TUCUMAN, maxBoundsViscosity: 1 }

export function dentroDeTucuman({ lat, lng }) {
  const [[latSur, lngOeste], [latNorte, lngEste]] = CAJA_TUCUMAN
  return lat >= latSur && lat <= latNorte && lng >= lngOeste && lng <= lngEste
}

// El punto en OpenStreetMap, para que el administrador lo mire antes de decidir.
export function enlaceOsm({ lat, lng }) {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`
}
