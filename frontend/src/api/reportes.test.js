import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from './cliente.js'
import { obtenerAlertas } from './reportes.js'

// Reemplaza el cliente para ver qué ruta se pide y qué devuelve, sin salir a internet.
vi.mock('./cliente.js', () => ({ api: vi.fn() }))

beforeEach(() => {
  vi.mocked(api).mockReset()
})

describe('alertas (RF-02, RF-11)', () => {
  it('obtenerAlertas pide GET /api/reportes y devuelve la lista', async () => {
    const alertas = [{ id: 31, tipo: 'robo_asalto', confirmaciones: 4 }]
    vi.mocked(api).mockResolvedValue(alertas)

    expect(await obtenerAlertas()).toEqual(alertas)
    expect(api).toHaveBeenCalledWith('/reportes')
  })

  it('si la API responde un error, lo pasa tal cual a la pantalla', async () => {
    const error = { codigo: 'ERROR_SERVIDOR', mensaje: 'El servidor no está respondiendo.' }
    vi.mocked(api).mockRejectedValue(error)

    await expect(obtenerAlertas()).rejects.toEqual(error)
  })
})
