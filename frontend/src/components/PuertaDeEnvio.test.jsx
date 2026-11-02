import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { obtenerSesion, reenviarVerificacion } from '../api/auth.js'
import { ANA, mostrarConSesion } from '../test/conSesion.jsx'
import PuertaDeEnvio from './PuertaDeEnvio.jsx'

vi.mock('../api/auth.js', () => ({ obtenerSesion: vi.fn(), reenviarVerificacion: vi.fn() }))

function mostrar() {
  return mostrarConSesion(
    '/reportar',
    <PuertaDeEnvio titulo="Enviar reporte" accion="enviar un reporte">
      <p>el formulario</p>
    </PuertaDeEnvio>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('PuertaDeEnvio (RF-07)', () => {
  it('con el email verificado muestra el formulario', async () => {
    vi.mocked(obtenerSesion).mockResolvedValue(ANA)
    mostrar()

    expect(await screen.findByText('el formulario')).toBeInTheDocument()
  })

  it('sin sesión avisa que hay que iniciarla, con Iniciar sesión y Volver al mapa', async () => {
    vi.mocked(obtenerSesion).mockResolvedValue(null)
    mostrar()

    expect(await screen.findByText('Para enviar un reporte tenés que iniciar sesión.')).toBeInTheDocument()
    expect(screen.queryByText('el formulario')).toBeNull()
    expect(screen.getByRole('link', { name: 'Volver al mapa' })).toHaveAttribute('href', '/')

    fireEvent.click(screen.getByRole('link', { name: 'Iniciar sesión' }))
    expect(await screen.findByText('pantalla del login')).toBeInTheDocument()
  })

  it('sin email verificado explica cómo verificarlo y deja reenviar el correo (RF-03)', async () => {
    vi.mocked(obtenerSesion).mockResolvedValue({ ...ANA, email_verificado: false })
    vi.mocked(reenviarVerificacion).mockResolvedValue({ ok: true })
    mostrar()

    expect(await screen.findByText(/tenés que verificar tu email/)).toHaveTextContent('ana@mail.com')
    expect(screen.queryByText('el formulario')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Reenviar el correo' }))
    expect(await screen.findByRole('status')).toHaveTextContent('Te mandamos otro enlace')
  })

  it('a un administrador le explica que no envía, que modera', async () => {
    vi.mocked(obtenerSesion).mockResolvedValue({ ...ANA, rol: 'admin' })
    mostrar()

    expect(await screen.findByText(/Los administradores no envían reportes/)).toBeInTheDocument()
    expect(screen.queryByText('el formulario')).toBeNull()
  })
})
