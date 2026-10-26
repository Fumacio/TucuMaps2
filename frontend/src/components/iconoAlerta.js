import L from 'leaflet'
import iconoRoboAsalto from '../assets/alertas/robo_asalto.png'
import iconoUrgencia from '../assets/alertas/urgencia.png'

// Tipos del SRS 3.1. Los de urgencia comparten el triángulo hasta tener sus íconos propios.
export const TIPOS_ALERTA = {
  riesgo_comunitario: {
    etiqueta: 'Defensa civil y riesgos comunitarios',
    grupo: 'urgencia',
    imagen: iconoUrgencia,
  },
  accidente_transito: { etiqueta: 'Accidentes de tránsito', grupo: 'urgencia', imagen: iconoUrgencia },
  disturbio: { etiqueta: 'Disturbios en la calle y marchas', grupo: 'urgencia', imagen: iconoUrgencia },
  robo_asalto: { etiqueta: 'Robos, asaltos y entraderas', grupo: 'crimen', imagen: iconoRoboAsalto },
}

const TIPO_DESCONOCIDO = { etiqueta: 'Alerta', grupo: 'urgencia', imagen: iconoUrgencia }

const MEDIDA = 40 // igual que .marcador-alerta en index.css

export function datosTipoAlerta(tipo) {
  return TIPOS_ALERTA[tipo] ?? TIPO_DESCONOCIDO
}

export function textoConfirmaciones(cantidad) {
  if (!cantidad) return 'Nadie la confirmó todavía'
  return `Confirmada por ${cantidad} ${cantidad === 1 ? 'vecino' : 'vecinos'}`
}

export function crearIconoAlerta(alerta) {
  const tipo = datosTipoAlerta(alerta.tipo)

  const imagen = document.createElement('img')
  imagen.className = `marcador-alerta marcador-alerta--${tipo.grupo}`
  imagen.src = tipo.imagen
  imagen.alt = ''
  imagen.dataset.tipo = alerta.tipo

  return L.divIcon({
    html: imagen,
    className: 'marcador-alerta-icono',
    iconSize: [MEDIDA, MEDIDA],
    iconAnchor: [MEDIDA / 2, MEDIDA / 2],
  })
}
