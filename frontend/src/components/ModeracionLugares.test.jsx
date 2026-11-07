import { fireEvent, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cambiarActivoLugar, obtenerLugaresAdmin } from '../api/admin.js'
import { obtenerSesion } from '../api/auth.js'
import Admin from '../pages/Admin.jsx'
import { ANA, mostrarConSesion } from '../test/conSesion.jsx'

vi.mock('../api/auth.js', () => ({ obtenerSesion: vi.fn() }))
vi.mock('../api/admin.js', () => ({
  POR_PAGINA: 20,
  obtenerResumenAdmin: vi.fn(() => Promise.resolve({})),
  obtenerLugaresAdmin: vi.fn(),
  cambiarActivoLugar: vi.fn(),
}))

const CASA = {
  id: 2,
  nombre: 'Casa Histórica',
  categoria: 'historico',
  direccion: 'Congreso 151',
  localidad: 'San Miguel de Tucumán',
  barrio: null,
  precio_entrada: 'Gratuita',
  imagen_url: null,
  activo: true,
}

function lista(lugares) {
  return { datos: lugares, pagina: 1, por_pagina: 20, total: lugares.length }
}

async function abrirLugares(lugares = [CASA]) {
  vi.mocked(obtenerLugaresAdmin).mockResolvedValue(lista(lugares))
  mostrarConSesion('/admin?pestana=lugares', <Admin />)
  return screen.findByRole('article')
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(obtenerSesion).mockResolvedValue({ ...ANA, rol: 'admin' })
})

describe('Admin: lugares (RF-13)', () => {
  it('muestra cada lugar con su precio y si se ve en el mapa, y ofrece crear y editar', async () => {
    const tarjeta = await abrirLugares()

    expect(tarjeta).toHaveTextContent('Casa Histórica')
    expect(tarjeta).toHaveTextContent('Histórico')
    expect(tarjeta).toHaveTextContent('Congreso 151, San Miguel de Tucumán')
    expect(tarjeta).toHaveTextContent('Entrada: Gratuita')
    expect(tarjeta).toHaveTextContent('Se ve en el mapa')
    expect(within(tarjeta).getByRole('link', { name: 'Editar' })).toHaveAttribute('href', '/admin/lugar')
    expect(screen.getByRole('link', { name: 'Crear lugar' })).toHaveAttribute('href', '/admin/lugar')
  })

  it('ocultar pide confirmación, avisa y vuelve a pedir la lista', async () => {
    vi.mocked(cambiarActivoLugar).mockResolvedValue({ ...CASA, activo: false })
    const tarjeta = await abrirLugares()

    fireEvent.click(within(tarjeta).getByRole('button', { name: 'Ocultar del mapa' }))
    expect(tarjeta).toHaveTextContent('No se borra')
    expect(cambiarActivoLugar).not.toHaveBeenCalled()

    vi.mocked(obtenerLugaresAdmin).mockResolvedValue(lista([{ ...CASA, activo: false }]))
    fireEvent.click(within(tarjeta).getByRole('button', { name: 'Sí, ocultar' }))

    expect(await screen.findByRole('status')).toHaveTextContent('Casa Histórica se ocultó del mapa.')
    expect(cambiarActivoLugar).toHaveBeenCalledWith(2, false)
    expect(await screen.findByText('Oculto')).toBeInTheDocument()
  })

  it('un lugar oculto se vuelve a mostrar sin confirmación', async () => {
    vi.mocked(cambiarActivoLugar).mockResolvedValue(CASA)
    const tarjeta = await abrirLugares([{ ...CASA, activo: false }])

    fireEvent.click(within(tarjeta).getByRole('button', { name: 'Volver a mostrar' }))

    expect(await screen.findByRole('status')).toHaveTextContent('Casa Histórica se volvió a mostrar en el mapa.')
    expect(cambiarActivoLugar).toHaveBeenCalledWith(2, true)
  })
})
