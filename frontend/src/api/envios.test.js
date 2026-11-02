import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from './cliente.js'
import { obtenerMisEnvios } from './envios.js'

vi.mock('./cliente.js', () => ({ api: vi.fn() }))

beforeEach(() => {
  vi.mocked(api).mockReset()
  vi.mocked(api).mockResolvedValue({ datos: [], pagina: 1, por_pagina: 20, total: 0 })
})

describe('mis envíos (RF-07, RF-08)', () => {
  it('sin filtro pide la primera página de todo', async () => {
    await obtenerMisEnvios()
    expect(api).toHaveBeenCalledWith('/mis-envios?pagina=1&por_pagina=20')
  })

  it('con tipo y página los manda como parámetros', async () => {
    await obtenerMisEnvios({ tipo: 'evento', pagina: 3 })
    expect(api).toHaveBeenCalledWith('/mis-envios?pagina=3&por_pagina=20&tipo=evento')
  })
})
