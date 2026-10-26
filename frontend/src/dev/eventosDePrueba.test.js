import { afterEach, describe, expect, it } from 'vitest'
import { CATEGORIAS_EVENTO } from '../components/iconoEvento.js'
import { sumarEventosDePrueba } from './eventosDePrueba.js'

const REALES = [{ id: 9, nombre: 'Peña en el Parque', lat: -26.83, lng: -65.19 }]

function abrirCon(busqueda) {
  window.history.replaceState(null, '', `/${busqueda}`)
}

afterEach(() => {
  abrirCon('')
  sessionStorage.clear()
})

describe('sumarEventosDePrueba', () => {
  it('sin ?eventos= deja los eventos como están', () => {
    expect(sumarEventosDePrueba(REALES)).toBe(REALES)
  })

  it('con ?eventos=14 suma 14 eventos futuros de todas las categorías, ordenados por inicio', () => {
    abrirCon('?eventos=14')
    const inventados = sumarEventosDePrueba(REALES).filter((e) => e.id < 0)

    expect(inventados).toHaveLength(14)
    expect(new Set(inventados.map((e) => e.categoria))).toEqual(new Set(Object.keys(CATEGORIAS_EVENTO)))
    const inicios = inventados.map((e) => Date.parse(e.inicio))
    expect(inicios[0]).toBeGreaterThan(Date.now())
    expect(inicios).toEqual([...inicios].sort((a, b) => a - b))
  })

  it('respeta el filtro de categoría', () => {
    abrirCon('?eventos=14')
    const inventados = sumarEventosDePrueba([], { categoria: 'teatro' })

    expect(inventados).toHaveLength(2)
    expect(inventados.every((e) => e.categoria === 'teatro')).toBe(true)
  })

  it('ignora valores que no son un número entero positivo', () => {
    abrirCon('?eventos=hola')
    expect(sumarEventosDePrueba(REALES)).toBe(REALES)
  })
})
