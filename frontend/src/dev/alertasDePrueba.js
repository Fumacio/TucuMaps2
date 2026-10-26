// Solo en desarrollo: http://localhost:5173/?alertas=20 suma alertas inventadas a las reales.
import { TIPOS_ALERTA } from '../components/iconoAlerta.js'
import { cantidadDePrueba, generadorRepetible, puntoAlAzar } from './lugaresDePrueba.js'

const TIPOS = Object.keys(TIPOS_ALERTA)

export function sumarAlertasDePrueba(alertas) {
  if (!import.meta.env.DEV) return alertas

  const cantidad = cantidadDePrueba('alertas')
  if (cantidad === 0) return alertas

  const azar = generadorRepetible(27)
  const inventadas = Array.from({ length: cantidad }, (_, i) => ({
    id: -(i + 1),
    tipo: TIPOS[i % TIPOS.length],
    descripcion: `Alerta de prueba ${i + 1}`,
    direccion: `Calle de prueba ${100 + i}`,
    barrio: 'Barrio de prueba',
    ...puntoAlAzar(azar),
    aprobado_en: new Date().toISOString(),
    confirmaciones: Math.floor(azar() * 10),
  }))
  return [...alertas, ...inventadas]
}
