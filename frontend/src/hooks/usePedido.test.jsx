import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { usePedido } from './usePedido.js'

describe('usePedido (RF-06)', () => {
  it('arranca cargando y después da los datos', async () => {
    const pedir = vi.fn().mockResolvedValue([1, 2])
    const { result } = renderHook(() => usePedido(pedir))

    expect(result.current.cargando).toBe(true)
    await waitFor(() => expect(result.current.datos).toEqual([1, 2]))
    expect(result.current.cargando).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('si falla da el error, y reintentar vuelve a pedir', async () => {
    const error = { codigo: 'SIN_CONEXION', mensaje: 'Sin conexión' }
    const pedir = vi.fn().mockRejectedValueOnce(error).mockResolvedValue(['ok'])
    const { result } = renderHook(() => usePedido(pedir))

    await waitFor(() => expect(result.current.error).toEqual(error))

    act(() => result.current.reintentar())
    expect(result.current.cargando).toBe(true)
    expect(result.current.error).toBeNull()
    await waitFor(() => expect(result.current.datos).toEqual(['ok']))
    expect(pedir).toHaveBeenCalledTimes(2)
  })

  it('con pedir en null no pide nada ni dice que carga', () => {
    const { result } = renderHook(() => usePedido(null))

    expect(result.current).toMatchObject({ datos: null, error: null, cargando: false })
  })

  it('si cambia el pedido, no muestra la respuesta del anterior', async () => {
    const lento = () => new Promise(() => {}) // nunca responde
    const rapido = vi.fn().mockResolvedValue('primero')
    const { result, rerender } = renderHook(({ pedir }) => usePedido(pedir), {
      initialProps: { pedir: rapido },
    })
    await waitFor(() => expect(result.current.datos).toBe('primero'))

    rerender({ pedir: lento })

    expect(result.current.datos).toBeNull()
    expect(result.current.cargando).toBe(true)
  })
})
