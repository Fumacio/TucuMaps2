import { afterEach, describe, expect, it } from 'vitest'
import { TIPOS_ALERTA } from '../components/iconoAlerta.js'
import { sumarAlertasDePrueba } from './alertasDePrueba.js'

const REALES = [{ id: 31, tipo: 'robo_asalto', lat: -26.82, lng: -65.23 }]

function abrirCon(busqueda) {
  window.history.replaceState(null, '', `/${busqueda}`)
}

afterEach(() => {
  abrirCon('')
  sessionStorage.clear()
})

describe('sumarAlertasDePrueba', () => {
  it('sin ?alertas= deja las alertas como están', () => {
    expect(sumarAlertasDePrueba(REALES)).toBe(REALES)
  })

  it('con ?alertas=20 suma 20 alertas de los cuatro tipos dentro del Gran San Miguel', () => {
    abrirCon('?alertas=20')
    const inventadas = sumarAlertasDePrueba(REALES).slice(1)

    expect(inventadas).toHaveLength(20)
    expect(new Set(inventadas.map((a) => a.tipo))).toEqual(new Set(Object.keys(TIPOS_ALERTA)))
    for (const alerta of inventadas) {
      expect(alerta.id).toBeLessThan(0)
      expect(alerta.lat).toBeGreaterThanOrEqual(-26.9)
      expect(alerta.lat).toBeLessThanOrEqual(-26.7)
      expect(alerta.lng).toBeGreaterThanOrEqual(-65.4)
      expect(alerta.lng).toBeLessThanOrEqual(-65.15)
    }
  })

  it('ignora valores que no son un número entero positivo', () => {
    abrirCon('?alertas=hola')
    expect(sumarAlertasDePrueba(REALES)).toBe(REALES)
  })
})
