// La API manda fechas en UTC; se muestran siempre en hora de Tucumán, sin importar dónde esté
// configurado el celular.
const ZONA = 'America/Argentina/Tucuman'

const DIA = new Intl.DateTimeFormat('es-AR', {
  timeZone: ZONA,
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})
const DIA_CORTO = new Intl.DateTimeFormat('es-AR', {
  timeZone: ZONA,
  weekday: 'short',
  day: 'numeric',
  month: 'short',
})
const HORA = new Intl.DateTimeFormat('es-AR', {
  timeZone: ZONA,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})
const ISO_DIA = new Intl.DateTimeFormat('en-CA', { timeZone: ZONA }) // da AAAA-MM-DD

// Intl escribe 'sábado, 7 de noviembre': sin esa coma se lee mejor junto a la hora.
function dia(fecha) {
  return DIA.format(fecha).replace(',', '')
}

function mayuscula(texto) {
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

// "2026-11-07": el día en Tucumán, en el formato que usan los filtros de la API.
export function diaEnTucuman(fechaIso) {
  return ISO_DIA.format(new Date(fechaIso))
}

// "Sábado 7 de noviembre, 20:00 a 23:30 hs"; si termina otro día, también dice cuál.
export function textoFechaEvento(inicio, fin) {
  const desde = new Date(inicio)
  const comienzo = `${mayuscula(dia(desde))}, ${HORA.format(desde)}`
  if (!fin) return `${comienzo} hs`

  const hasta = new Date(fin)
  // Terminar a las 00:00 es terminar ese mismo día: se mira el minuto anterior.
  const ultimoMinuto = new Date(hasta.getTime() - 60 * 1000)
  if (diaEnTucuman(inicio) === diaEnTucuman(ultimoMinuto)) return `${comienzo} a ${HORA.format(hasta)} hs`
  return `${comienzo} hs al ${dia(hasta)}, ${HORA.format(hasta)} hs`
}

// "Sáb 7 nov · 20:00", para las tarjetas de la agenda.
export function textoFechaCorta(inicio) {
  const fecha = new Date(inicio)
  return `${mayuscula(DIA_CORTO.format(fecha).replaceAll('.', '').replace(',', ''))} · ${HORA.format(fecha)}`
}

// Tucumán no tiene horario de verano: siempre UTC−3.
const ZONA_TUCUMAN = '-03:00'
const TRES_HORAS_MS = 3 * 60 * 60 * 1000

// "2026-11-07T20:00" (de un <input type="datetime-local">) → "2026-11-07T20:00:00-03:00",
// con la zona que exige la API. Vacío queda vacío.
export function fechaHoraConZona(valorLocal) {
  if (!valorLocal) return ''
  return `${valorLocal.slice(0, 16)}:00${ZONA_TUCUMAN}`
}

// La hora actual en Tucumán, en el formato de <input type="datetime-local"> (para su `min`).
export function ahoraEnTucuman(ahora = Date.now()) {
  return new Date(ahora - TRES_HORAS_MS).toISOString().slice(0, 16)
}

// Dentro de un año, en el mismo formato (el `max` del inicio de un evento).
export function enUnAnioEnTucuman() {
  return ahoraEnTucuman(Date.now() + 365 * 24 * 60 * 60 * 1000)
}
