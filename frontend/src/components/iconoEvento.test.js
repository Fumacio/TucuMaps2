import { describe, expect, it } from 'vitest'
import { CATEGORIAS_EVENTO, MODALIDADES_EVENTO, crearIconoEvento } from './iconoEvento.js'

describe('crearIconoEvento', () => {
  it('usa el pin amarillo del diseño', () => {
    const imagen = crearIconoEvento().options.html

    expect(imagen.src).toContain('evento')
    expect(imagen.className).toBe('marcador-evento')
  })

  it('la punta del pin, abajo al centro, marca la coordenada', () => {
    const { iconSize, iconAnchor } = crearIconoEvento().options

    expect(iconAnchor[0]).toBe(iconSize[0] / 2)
    expect(iconAnchor[1]).toBe(iconSize[1] - 1)
  })
})

describe('catálogos de eventos (SRS 3.1)', () => {
  it('tiene las 7 categorías y las 3 modalidades', () => {
    expect(Object.keys(CATEGORIAS_EVENTO)).toHaveLength(7)
    expect(Object.keys(MODALIDADES_EVENTO)).toEqual(['gratuita', 'con_entrada', 'a_la_gorra'])
  })
})
