// RF-10: la misma caja de Tucumán que valida la API.
export function dentroDeTucuman({ lat, lng }) {
  return lat >= -28 && lat <= -26 && lng >= -66.5 && lng <= -64.5
}
