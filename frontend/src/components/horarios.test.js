import { describe, expect, it } from 'vitest'
import { separarHorarios } from './horarios.js'

describe('separarHorarios', () => {
  it('saca los renglones vacíos y separa los días del horario', () => {
    const texto =
      'Martes a viernes: 9:00 a 13:00 hs.\n\nSábados, domingos y feriados: 9:00 a 20:00 hs.\n\nLunes: Cerrado.'

    expect(separarHorarios(texto)).toEqual([
      { dias: 'Martes a viernes', detalle: '9:00 a 13:00 hs.' },
      { dias: 'Sábados, domingos y feriados', detalle: '9:00 a 20:00 hs.' },
      { dias: 'Lunes', detalle: 'Cerrado.' },
    ])
  })

  it('no corta en la mitad de una hora', () => {
    const texto = 'Lunes a domingo de 8:00 a 23:00. Horario de boletería: Martes a sábado de 17:00 a 21:00.'

    expect(separarHorarios(texto)).toEqual([{ dias: null, detalle: texto }])
  })

  it('un renglón sin dos puntos queda como está', () => {
    expect(separarHorarios('Abierto las 24hs.')).toEqual([
      { dias: null, detalle: 'Abierto las 24hs.' },
    ])
  })
})
