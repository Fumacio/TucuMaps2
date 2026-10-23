import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from './cliente.js'
import { obtenerLugar, obtenerLugares } from './lugares.js'

// Reemplaza el cliente para ver qué ruta se pide, sin salir a internet.
vi.mock('./cliente.js', () => ({ api: vi.fn().mockResolvedValue([]) }))

beforeEach(() => {
  vi.mocked(api).mockClear()
})

describe('lugares (RF-02)', () => {
  it('obtenerLugares pide GET /api/lugares', async () => {
    await obtenerLugares()
    expect(api).toHaveBeenCalledWith('/lugares')
  })

  it('obtenerLugar pide GET /api/lugares/:id', async () => {
    await obtenerLugar(7)
    expect(api).toHaveBeenCalledWith('/lugares/7')
  })
})
