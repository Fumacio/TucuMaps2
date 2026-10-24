import { afterEach, describe, expect, it } from 'vitest'
import { sumarLugaresDePrueba } from './lugaresDePrueba.js'

const REALES = [{ id: 1, nombre: 'Plaza Independencia', lat: -26.83, lng: -65.2 }]

function abrirCon(busqueda) {
  window.history.replaceState(null, '', `/${busqueda}`)
}

afterEach(() => abrirCon(''))

describe('sumarLugaresDePrueba (RNF-04)', () => {
  it('sin ?marcadores= deja los lugares como están', () => {
    expect(sumarLugaresDePrueba(REALES)).toBe(REALES)
  })

  it('con ?marcadores=500 suma 500 lugares inventados dentro del Gran San Miguel', () => {
    abrirCon('?marcadores=500')
    const todos = sumarLugaresDePrueba(REALES)

    expect(todos).toHaveLength(501)
    for (const lugar of todos.slice(1)) {
      expect(lugar.id).toBeLessThan(0)
      expect(lugar.lat).toBeGreaterThanOrEqual(-26.9)
      expect(lugar.lat).toBeLessThanOrEqual(-26.7)
      expect(lugar.lng).toBeGreaterThanOrEqual(-65.4)
      expect(lugar.lng).toBeLessThanOrEqual(-65.15)
    }
  })

  it('ignora valores que no son un número entero positivo', () => {
    abrirCon('?marcadores=hola')
    expect(sumarLugaresDePrueba(REALES)).toBe(REALES)
  })
})
