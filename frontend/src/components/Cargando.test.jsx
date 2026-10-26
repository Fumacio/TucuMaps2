import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { escucharDemora, hayDemora } from '../api/cliente.js'
import Cargando from './Cargando.jsx'
import MensajeError from './MensajeError.jsx'

// Un cliente falso que deja prender y apagar la demora desde la prueba.
vi.mock('../api/cliente.js', async (importOriginal) => {
  let demora = false
  const oyentes = new Set()
  return {
    ...(await importOriginal()),
    hayDemora: vi.fn(() => demora),
    escucharDemora: vi.fn((oyente) => {
      oyentes.add(oyente)
      return () => oyentes.delete(oyente)
    }),
    simularDemora(valor) {
      demora = valor
      oyentes.forEach((oyente) => oyente())
    },
  }
})

describe('Cargando (RF-06)', () => {
  it('muestra el texto y, si el servidor tarda, explica que se está despertando', async () => {
    const { simularDemora } = await import('../api/cliente.js')
    render(<Cargando texto="Cargando eventos…" />)

    expect(screen.getByRole('status')).toHaveTextContent('Cargando eventos…')
    expect(screen.queryByText(/se está despertando/)).toBeNull()

    act(() => simularDemora(true))
    expect(screen.getByRole('status')).toHaveTextContent(
      'El servidor se está despertando, puede tardar hasta un minuto.',
    )

    act(() => simularDemora(false))
    expect(screen.queryByText(/se está despertando/)).toBeNull()
    expect(escucharDemora).toHaveBeenCalled()
    expect(hayDemora).toHaveBeenCalled()
  })
})

describe('MensajeError (RF-06)', () => {
  it('muestra el mensaje y el botón Reintentar', () => {
    const onReintentar = vi.fn()
    render(
      <MensajeError
        error={{ codigo: 'SIN_CONEXION', mensaje: 'No pudimos conectarnos.' }}
        onReintentar={onReintentar}
      />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('No pudimos conectarnos.')
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(onReintentar).toHaveBeenCalledTimes(1)
  })

  it('sin Reintentar si el error se repetiría igual (por ejemplo, algo que no existe)', () => {
    render(
      <MensajeError error={{ codigo: 'NO_ENCONTRADO', mensaje: 'No encontramos ese lugar.' }} onReintentar={() => {}} />,
    )

    expect(screen.queryByRole('button', { name: 'Reintentar' })).toBeNull()
  })
})
