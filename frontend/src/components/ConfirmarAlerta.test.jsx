import { fireEvent, screen } from '@testing-library/react'
import { useState } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { obtenerSesion } from '../api/auth.js'
import { confirmarAlerta } from '../api/reportes.js'
import { ANA, mostrarConSesion } from '../test/conSesion.jsx'
import ConfirmarAlerta from './ConfirmarAlerta.jsx'

vi.mock('../api/auth.js', () => ({ obtenerSesion: vi.fn() }))
vi.mock('../api/reportes.js', () => ({ confirmarAlerta: vi.fn() }))

const ALERTA = { id: 31, tipo: 'robo_asalto', confirmaciones: 4 }

// Como en MarcadorAlerta: el que guarda si ya se confirmó es el de afuera.
function ConMarcador({ onConfirmada }) {
  const [confirmada, setConfirmada] = useState(false)
  return (
    <ConfirmarAlerta
      alerta={ALERTA}
      confirmada={confirmada}
      onConfirmada={(total) => {
        onConfirmada(total)
        setConfirmada(true)
      }}
    />
  )
}

function mostrar(onConfirmada = vi.fn()) {
  mostrarConSesion('/alerta', <ConMarcador onConfirmada={onConfirmada} />)
  return onConfirmada
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(obtenerSesion).mockResolvedValue(ANA)
})

describe('ConfirmarAlerta (RF-14)', () => {
  it('confirma, pasa el total nuevo y agradece', async () => {
    vi.mocked(confirmarAlerta).mockResolvedValue({ confirmaciones: 5 })
    const onConfirmada = mostrar()

    fireEvent.click(await screen.findByRole('button', { name: 'Confirmar' }))

    expect(await screen.findByRole('status')).toHaveTextContent('¡Gracias por confirmarla!')
    expect(confirmarAlerta).toHaveBeenCalledWith(31)
    expect(onConfirmada).toHaveBeenCalledWith(5)
  })

  it('una alerta propia (403) o ya confirmada (409) muestra el mensaje de la API', async () => {
    vi.mocked(confirmarAlerta)
      .mockRejectedValueOnce({ codigo: 'SIN_PERMISO', mensaje: 'No podés confirmar tu propio reporte.' })
      .mockRejectedValueOnce({ codigo: 'YA_CONFIRMADO', mensaje: 'Ya confirmaste esta alerta.' })
    const onConfirmada = mostrar()

    fireEvent.click(await screen.findByRole('button', { name: 'Confirmar' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('No podés confirmar tu propio reporte.')

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))
    expect(await screen.findByText('Ya confirmaste esta alerta.')).toBeInTheDocument()
    expect(onConfirmada).not.toHaveBeenCalled()
  })

  it('si la sesión se cerró en otro dispositivo (401), ofrece iniciarla de nuevo', async () => {
    vi.mocked(confirmarAlerta).mockRejectedValue({ codigo: 'NO_AUTENTICADO', mensaje: 'Tenés que iniciar sesión.' })
    mostrar()

    fireEvent.click(await screen.findByRole('button', { name: 'Confirmar' }))

    expect(await screen.findByRole('link', { name: 'Iniciá sesión para confirmarla' })).toBeInTheDocument()
  })

  it('sin sesión ofrece iniciarla', async () => {
    vi.mocked(obtenerSesion).mockResolvedValue(null)
    mostrar()

    expect(await screen.findByRole('link', { name: 'Iniciá sesión para confirmarla' })).toHaveAttribute(
      'href',
      '/ingresar',
    )
    expect(screen.queryByRole('button', { name: 'Confirmar' })).toBeNull()
  })

  it('sin email verificado explica que hay que verificarlo', async () => {
    vi.mocked(obtenerSesion).mockResolvedValue({ ...ANA, email_verificado: false })
    mostrar()

    expect(await screen.findByText('Verificá tu email para poder confirmarla.')).toBeInTheDocument()
  })

  it('el administrador no ve el botón', async () => {
    vi.mocked(obtenerSesion).mockResolvedValue({ ...ANA, rol: 'admin' })
    const { container } = mostrarConSesion('/alerta', <ConMarcador onConfirmada={vi.fn()} />)

    // Mientras carga la sesión todavía no se sabe quién es: se espera a que se vaya el enlace.
    await vi.waitFor(() => expect(container).toBeEmptyDOMElement())
  })
})
