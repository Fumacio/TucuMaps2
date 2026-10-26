import L from 'leaflet'
import imagenEvento from '../assets/evento.png'

// Catálogos del SRS 3.1 (mismas etiquetas que GET /api/catalogos).
export const CATEGORIAS_EVENTO = {
  musica: 'Música',
  teatro: 'Teatro',
  feria: 'Feria',
  gastronomia: 'Gastronomía',
  deporte: 'Deporte',
  cultural: 'Cultural',
  otro: 'Otro',
}

export const MODALIDADES_EVENTO = {
  gratuita: 'Gratuita',
  con_entrada: 'Con entrada',
  a_la_gorra: 'A la gorra',
}

const ANCHO = 42 // igual que .marcador-evento en index.css
const ALTO = 64

export function crearIconoEvento() {
  const imagen = document.createElement('img')
  imagen.className = 'marcador-evento'
  imagen.src = imagenEvento
  imagen.alt = ''

  return L.divIcon({
    html: imagen,
    className: 'marcador-evento-icono',
    iconSize: [ANCHO, ALTO],
    iconAnchor: [ANCHO / 2, ALTO - 1], // la punta del pin marca la coordenada
  })
}
