// Solo en desarrollo: http://localhost:5173/?alertas=20 suma alertas inventadas a las reales.
import { TIPOS_ALERTA } from '../components/iconoAlerta.js'
import { generadorRepetible } from './lugaresDePrueba.js'

const TIPOS = Object.keys(TIPOS_ALERTA)
const MAXIMO = 5000
const ZONA = { latNorte: -26.7, latSur: -26.9, lngOeste: -65.4, lngEste: -65.15 }

export function sumarAlertasDePrueba(alertas) {
  if (!import.meta.env.DEV) return alertas

  const cantidad = Number(new URLSearchParams(window.location.search).get('alertas'))
  if (!Number.isInteger(cantidad) || cantidad <= 0) return alertas

  const azar = generadorRepetible(27)
  const inventadas = Array.from({ length: Math.min(cantidad, MAXIMO) }, (_, i) => ({
    id: -(i + 1),
    tipo: TIPOS[i % TIPOS.length],
    descripcion: `Alerta de prueba ${i + 1}`,
    direccion: `Calle de prueba ${100 + i}`,
    barrio: 'Barrio de prueba',
    lat: ZONA.latSur + azar() * (ZONA.latNorte - ZONA.latSur),
    lng: ZONA.lngOeste + azar() * (ZONA.lngEste - ZONA.lngOeste),
    aprobado_en: new Date().toISOString(),
    confirmaciones: Math.floor(azar() * 10),
  }))
  return [...alertas, ...inventadas]
}
