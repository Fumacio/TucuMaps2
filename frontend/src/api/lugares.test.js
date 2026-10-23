import { describe, expect, it } from 'vitest'
import { USAR_DATOS_EJEMPLO, obtenerLugar, obtenerLugares } from './lugares.js'

// Estas pruebas cubren los datos de ejemplo; cuando se use la API real, las cubre cliente.test.js.
describe.runIf(USAR_DATOS_EJEMPLO)('lugares con datos de ejemplo', () => {
  it('la lista trae los lugares sin contenido histórico ni fuente, como la API', async () => {
    const lugares = await obtenerLugares()

    expect(lugares.length).toBeGreaterThan(0)
    for (const lugar of lugares) {
      expect(lugar).toHaveProperty('lat')
      expect(lugar).toHaveProperty('categoria')
      expect(lugar).not.toHaveProperty('contenido_historico')
      expect(lugar).not.toHaveProperty('fuente')
    }
  })

  it('el detalle trae el contenido histórico y la fuente', async () => {
    const lugar = await obtenerLugar(1)

    expect(lugar.nombre).toBe('Casa Histórica de la Independencia')
    expect(lugar.contenido_historico).toBeTruthy()
    expect(lugar.fuente).toBeTruthy()
  })

  it('un id que no existe responde NO_ENCONTRADO, como la API', async () => {
    await expect(obtenerLugar(999)).rejects.toMatchObject({ codigo: 'NO_ENCONTRADO' })
  })
})
