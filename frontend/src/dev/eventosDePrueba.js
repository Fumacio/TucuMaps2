// Solo en desarrollo: http://localhost:5173/?eventos=20 suma eventos inventados a los reales.
import { diaEnTucuman } from '../components/fechas.js'
import { CATEGORIAS_EVENTO, MODALIDADES_EVENTO } from '../components/iconoEvento.js'
import { cantidadDePrueba, generadorRepetible, puntoAlAzar } from './lugaresDePrueba.js'

const CATEGORIAS = Object.keys(CATEGORIAS_EVENTO)
const MODALIDADES = Object.keys(MODALIDADES_EVENTO)
const HORA_MS = 60 * 60 * 1000

// filtros: los mismos de la agenda. A los reales ya los filtró la API; acá se filtran los
// inventados de forma aproximada (por el día de inicio).
export function sumarEventosDePrueba(eventos, filtros = {}) {
  if (!import.meta.env.DEV) return eventos

  const cantidad = cantidadDePrueba('eventos')
  if (cantidad === 0) return eventos

  const azar = generadorRepetible(28)
  const ahora = Date.now()
  const inventados = Array.from({ length: cantidad }, (_, i) => {
    const inicio = new Date(ahora + (i * 7 + 2) * HORA_MS) // uno cada 7 horas
    return {
      id: -(i + 1),
      nombre: `Evento de prueba ${i + 1}`,
      categoria: CATEGORIAS[i % CATEGORIAS.length],
      modalidad: MODALIDADES[i % MODALIDADES.length],
      descripcion: `Descripción del evento de prueba ${i + 1}.`,
      lugar_nombre: `Lugar de prueba ${i + 1}`,
      direccion: `Calle de prueba ${200 + i}`,
      barrio: 'Barrio de prueba',
      ...puntoAlAzar(azar),
      inicio: inicio.toISOString(),
      fin: i % 2 === 0 ? new Date(inicio.getTime() + 3 * HORA_MS).toISOString() : null,
      flyer_url: null,
      etiquetas: [],
      lugar_id: null,
    }
  })
  const { categoria, desde, hasta } = filtros
  const filtrados = inventados.filter((evento) => {
    const dia = diaEnTucuman(evento.inicio)
    return (
      (!categoria || evento.categoria === categoria) &&
      (!desde || dia >= desde) &&
      (!hasta || dia <= hasta)
    )
  })
  return [...eventos, ...filtrados].sort((a, b) => Date.parse(a.inicio) - Date.parse(b.inicio))
}
