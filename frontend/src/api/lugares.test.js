import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from './cliente.js'
import { obtenerLugar, obtenerLugares } from './lugares.js'

// Reemplaza el cliente para ver qué ruta se pide y qué devuelve, sin salir a internet.
vi.mock('./cliente.js', () => ({ api: vi.fn() }))

beforeEach(() => {
  vi.mocked(api).mockReset()
})

describe('lugares (RF-02)', () => {
  it('obtenerLugares pide GET /api/lugares y devuelve la lista', async () => {
    vi.mocked(api).mockResolvedValue([{ id: 1, nombre: 'Plaza Independencia' }])

    expect(await obtenerLugares()).toEqual([{ id: 1, nombre: 'Plaza Independencia' }])
    expect(api).toHaveBeenCalledWith('/lugares')
  })

  it('obtenerLugar pide GET /api/lugares/:id y devuelve el detalle', async () => {
    vi.mocked(api).mockResolvedValue({ id: 7, nombre: 'Teatro San Martín' })

    expect(await obtenerLugar(7)).toEqual({ id: 7, nombre: 'Teatro San Martín' })
    expect(api).toHaveBeenCalledWith('/lugares/7')
  })

  it('un id raro no puede cambiar la ruta que se pide', async () => {
    vi.mocked(api).mockResolvedValue({})

    await obtenerLugar('1/../usuarios')
    expect(api).toHaveBeenCalledWith('/lugares/1%2F..%2Fusuarios')
  })

  it('si la API responde un error, lo pasa tal cual a la pantalla', async () => {
    const error = { codigo: 'NO_ENCONTRADO', mensaje: 'No encontramos ese lugar.' }
    vi.mocked(api).mockRejectedValue(error)

    await expect(obtenerLugar(999)).rejects.toEqual(error)
  })
})
