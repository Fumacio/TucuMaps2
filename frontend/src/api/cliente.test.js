import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api, sePuedeReintentar } from './cliente.js'

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

  it('si el servidor responde un error con cuerpo null, lanza un mensaje en español', async () => {
    simularRespuesta(500, null)

    await expect(api('/lugares')).rejects.toMatchObject({ codigo: 'ERROR_SERVIDOR' })
  })

  it('si no hay conexión, lanza un error con mensaje en español (RF-06)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    await expect(api('/lugares')).rejects.toMatchObject({ codigo: 'SIN_CONEXION' })
  })
})

describe('aviso de demora (RF-06, RNF-05)', () => {
  // Cada prueba usa un cliente recién cargado: si una falla a mitad de camino, el contador de
  // pedidos demorados no queda trabado para las siguientes.
  let cliente
  beforeEach(async () => {
    vi.resetModules()
    cliente = await import('./cliente.js')
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // Un fetch que no responde hasta que la prueba lo dice, como Render "despertando".
  function simularServidorDormido() {
    let responder
    const respuesta = new Promise((resolver) => {
      responder = () =>
        resolver({ ok: true, status: 200, json: () => Promise.resolve([]) })
    })
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(respuesta))
    return () => responder()
  }

  it('avisa si un pedido pasa el umbral sin respuesta, y deja de avisar cuando llega', async () => {
    vi.useFakeTimers()
    const responder = simularServidorDormido()
    const oyente = vi.fn()
    const dejarDeEscuchar = cliente.escucharDemora(oyente)

    const pedido = cliente.api('/lugares')
    vi.advanceTimersByTime(cliente.UMBRAL_DEMORA_MS - 1)
    expect(cliente.hayDemora()).toBe(false)

    vi.advanceTimersByTime(1)
    expect(cliente.hayDemora()).toBe(true)
    expect(oyente).toHaveBeenCalledTimes(1)

    responder()
    await pedido
    expect(cliente.hayDemora()).toBe(false)
    expect(oyente).toHaveBeenCalledTimes(2)
    dejarDeEscuchar()
  })

  it('un pedido rápido no avisa nada', async () => {
    vi.useFakeTimers()
    simularRespuesta(200, [])
    const oyente = vi.fn()
    const dejarDeEscuchar = cliente.escucharDemora(oyente)

    await cliente.api('/lugares')
    vi.advanceTimersByTime(cliente.UMBRAL_DEMORA_MS * 2)

    expect(oyente).not.toHaveBeenCalled()
    expect(cliente.hayDemora()).toBe(false)
    dejarDeEscuchar()
  })

  it('si el pedido demorado falla, también deja de avisar', async () => {
    vi.useFakeTimers()
    let fallar
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise((_, rechazar) => (fallar = rechazar))))

    const pedido = cliente.api('/lugares').catch(() => {})
    vi.advanceTimersByTime(cliente.UMBRAL_DEMORA_MS)
    expect(cliente.hayDemora()).toBe(true)

    fallar(new TypeError('Failed to fetch'))
    await pedido
    expect(cliente.hayDemora()).toBe(false)
  })
})

describe('sePuedeReintentar (RF-06)', () => {
  it('sí ante falta de conexión o fallas del servidor', () => {
    for (const codigo of ['SIN_CONEXION', 'ERROR_SERVIDOR', 'ERROR_INTERNO', 'DEMASIADOS_INTENTOS']) {
      expect(sePuedeReintentar({ codigo })).toBe(true)
    }
  })

  it('no ante errores que se repetirían igual', () => {
    expect(sePuedeReintentar({ codigo: 'NO_ENCONTRADO' })).toBe(false)
    expect(sePuedeReintentar({ codigo: 'DATOS_INVALIDOS' })).toBe(false)
    expect(sePuedeReintentar(null)).toBe(false)
  })
})
