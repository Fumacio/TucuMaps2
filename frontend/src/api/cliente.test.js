import { afterEach, describe, expect, it, vi } from 'vitest'
import { api } from './cliente.js'

// Reemplaza fetch por uno falso que responde lo que le pasemos, sin salir a internet.
function simularRespuesta(status, cuerpo) {
  const fetchFalso = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(cuerpo),
  })
  vi.stubGlobal('fetch', fetchFalso)
  return fetchFalso
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('api()', () => {
  it('en un GET manda la cookie y no manda X-Requested-With', async () => {
    const fetchFalso = simularRespuesta(200, [{ id: 1 }])

    const datos = await api('/lugares')

    expect(datos).toEqual([{ id: 1 }])
    const [url, opciones] = fetchFalso.mock.calls[0]
    expect(url).toBe('/api/lugares')
    expect(opciones.credentials).toBe('include')
    expect(opciones.headers['X-Requested-With']).toBeUndefined()
  })

  it('en un POST manda X-Requested-With: TucuMaps y el cuerpo en JSON', async () => {
    const fetchFalso = simularRespuesta(201, { ok: true })

    await api('/reportes', { metodo: 'POST', cuerpo: { tipo: 'robo' } })

    const [, opciones] = fetchFalso.mock.calls[0]
    expect(opciones.method).toBe('POST')
    expect(opciones.headers['X-Requested-With']).toBe('TucuMaps')
    expect(opciones.body).toBe('{"tipo":"robo"}')
  })

  it('si la API responde un error, lanza { codigo, mensaje } tal como viene', async () => {
    const error = { codigo: 'NO_ENCONTRADO', mensaje: 'No encontramos ese lugar.' }
    simularRespuesta(404, { error })

    await expect(api('/lugares/999')).rejects.toEqual(error)
  })

  it('si no hay conexión, lanza un error con mensaje en español (RF-06)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    await expect(api('/lugares')).rejects.toMatchObject({ codigo: 'SIN_CONEXION' })
  })
})
