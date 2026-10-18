// Lugares del mapa (RF-02): GET /api/lugares y GET /api/lugares/:id.
import { api } from './cliente.js'
import { lugaresEjemplo } from './lugaresEjemplo.js'

// true mientras no haya backend en local (falta backend/.env). Con el backend andando,
// pasarlo a false y las pantallas reciben los 20 lugares reales sin cambiar nada más.
export const USAR_DATOS_EJEMPLO = true

export function obtenerLugares() {
  if (USAR_DATOS_EJEMPLO) {
    // La lista de la API no trae el contenido histórico ni la fuente: solo el detalle.
    const lista = lugaresEjemplo.map((lugar) => {
      const copia = { ...lugar }
      delete copia.contenido_historico
      delete copia.fuente
      return copia
    })
    return Promise.resolve(lista)
  }
  return api('/lugares')
}

export function obtenerLugar(id) {
  if (USAR_DATOS_EJEMPLO) {
    const lugar = lugaresEjemplo.find((l) => l.id === Number(id))
    if (!lugar) {
      return Promise.reject({ codigo: 'NO_ENCONTRADO', mensaje: 'No encontramos ese lugar.' })
    }
    return Promise.resolve(lugar)
  }
  return api(`/lugares/${id}`)
}
