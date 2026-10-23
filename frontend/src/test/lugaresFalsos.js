// Reemplazo de src/api/lugares.js para las pruebas: responde con lugaresEjemplo como lo haría
// la API, sin backend. Se usa con vi.mock('…/api/lugares.js', () => import('…/test/lugaresFalsos.js')).
import { lugaresEjemplo } from './lugaresEjemplo.js'

export function obtenerLugares() {
  // La lista de la API no trae el contenido histórico ni la fuente: solo el detalle.
  const lista = lugaresEjemplo.map((lugar) => {
    const copia = { ...lugar }
    delete copia.contenido_historico
    delete copia.fuente
    return copia
  })
  return Promise.resolve(lista)
}

export function obtenerLugar(id) {
  const lugar = lugaresEjemplo.find((l) => l.id === Number(id))
  if (!lugar) {
    return Promise.reject({ codigo: 'NO_ENCONTRADO', mensaje: 'No encontramos ese lugar.' })
  }
  return Promise.resolve(lugar)
}
