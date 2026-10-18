// Separa el texto de horarios de la API en renglones, sin los renglones vacíos, y en cada uno
// distingue los días ("Martes a viernes") del horario ("9:00 a 13:00 hs").
//
// Solo cuenta como días lo que está antes de ": " y no tiene números, para no cortar
// en la mitad de una hora como "8:00". Si un renglón no tiene días, `dias` queda en null.
const RENGLON_CON_DIAS = /^([^\d:]+):\s+(.*)$/

export function separarHorarios(texto) {
  return texto
    .split('\n')
    .map((renglon) => renglon.trim())
    .filter(Boolean)
    .map((renglon) => {
      const partes = renglon.match(RENGLON_CON_DIAS)
      return partes ? { dias: partes[1], detalle: partes[2] } : { dias: null, detalle: renglon }
    })
}
