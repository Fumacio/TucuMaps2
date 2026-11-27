import { describe, expect, it } from 'vitest'
import { enlaceAlMapa, leerPunto } from './ubicacion.js'

describe('enlaceAlMapa y leerPunto', () => {
  it('el enlace abre el punto en el mapa de TucuMaps, no en otro sitio', () => {
    expect(enlaceAlMapa({ lat: -26.8235, lng: -65.2301 })).toBe('/?lat=-26.8235&lng=-65.2301')
    expect(enlaceAlMapa({ lat: -26.8235, lng: -65.2301 }, 'seguridad')).toBe(
      '/?lat=-26.8235&lng=-65.2301&capa=seguridad',
    )
  })

  it('lee un punto válido de Tucumán', () => {
    expect(leerPunto('-26.8235', '-65.2301')).toEqual({ lat: -26.8235, lng: -65.2301 })
  })

  it('descarta puntos incompletos, que no son números o fuera de Tucumán', () => {
    expect(leerPunto(null, '-65.2')).toBeNull()
    expect(leerPunto('-26.8', '')).toBeNull()
    expect(leerPunto('abc', '-65.2')).toBeNull()
    expect(leerPunto('Infinity', '-65.2')).toBeNull()
    expect(leerPunto('-34.6', '-58.4')).toBeNull() // Buenos Aires
  })
})
