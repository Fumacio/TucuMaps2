import { describe, expect, it } from 'vitest'
import { diaEnTucuman, textoFechaCorta, textoFechaEvento } from './fechas.js'

describe('textoFechaEvento', () => {
  it('muestra la hora de Tucumán (UTC-3), no la UTC', () => {
    expect(textoFechaEvento('2026-11-07T23:00:00.000Z', null)).toBe('Sábado 7 de noviembre, 20:00 hs')
  })

  it('con fin el mismo día', () => {
    expect(textoFechaEvento('2026-11-07T20:00:00.000Z', '2026-11-08T01:30:00.000Z')).toBe(
      'Sábado 7 de noviembre, 17:00 a 22:30 hs',
    )
  })

  it('si termina justo a la medianoche, sigue siendo un solo día', () => {
    expect(textoFechaEvento('2026-11-07T23:00:00.000Z', '2026-11-08T03:00:00.000Z')).toBe(
      'Sábado 7 de noviembre, 20:00 a 00:00 hs',
    )
  })

  it('con fin otro día, dice cuál', () => {
    expect(textoFechaEvento('2026-11-07T23:00:00.000Z', '2026-11-08T05:30:00.000Z')).toBe(
      'Sábado 7 de noviembre, 20:00 hs al domingo 8 de noviembre, 02:30 hs',
    )
  })
})

describe('textoFechaCorta', () => {
  it('día abreviado y hora', () => {
    expect(textoFechaCorta('2026-11-07T23:00:00.000Z')).toBe('Sáb 7 nov · 20:00')
  })
})

describe('diaEnTucuman', () => {
  it('a la madrugada en UTC todavía es el día anterior en Tucumán', () => {
    expect(diaEnTucuman('2026-11-08T02:00:00.000Z')).toBe('2026-11-07')
  })
})
