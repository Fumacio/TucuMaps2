// RF-10: la misma caja de Tucumán que valida la API.
// El punto en OpenStreetMap, para que el administrador lo mire antes de decidir.
export function enlaceOsm({ lat, lng }) {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`
}

export function dentroDeTucuman({ lat, lng }) {
  return lat >= -28 && lat <= -26 && lng >= -66.5 && lng <= -64.5
}
