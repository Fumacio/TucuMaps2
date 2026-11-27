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

// El punto en el mapa de TucuMaps, para que el administrador lo mire antes de decidir.
// Con capa 'seguridad' el mapa abre en esa capa (los reportes se miran junto a las alertas).
export function enlaceAlMapa({ lat, lng }, capa) {
  const busqueda = new URLSearchParams({ lat: String(lat), lng: String(lng) })
  if (capa === 'seguridad') busqueda.set('capa', 'seguridad')
  return `/?${busqueda}`
}

// Lee ?lat=&lng= de la dirección. Solo vale un punto con números y dentro de Tucumán; si no, null.
export function leerPunto(textoLat, textoLng) {
  if (!textoLat || !textoLng) return null
  const punto = { lat: Number(textoLat), lng: Number(textoLng) }
  if (!Number.isFinite(punto.lat) || !Number.isFinite(punto.lng) || !dentroDeTucuman(punto)) return null
  return punto
}
