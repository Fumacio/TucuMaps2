import { StrictMode } from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { obtenerSesion, reenviarVerificacion, verificarEmail } from '../api/auth.js'
import AvisoVerificacion from '../components/AvisoVerificacion.jsx'
import { ANA, mostrarConSesion } from '../test/conSesion.jsx'
import VerificarEmail from './VerificarEmail.jsx'

vi.mock('../api/auth.js', () => ({
  obtenerSesion: vi.fn(),
  verificarEmail: vi.fn(),
  reenviarVerificacion: vi.fn(),
  cerrarSesion: vi.fn(),
}))

const SIN_VERIFICAR = { ...ANA, email_verificado: false }
const TOKEN = 'a'.repeat(64)

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(obtenerSesion).mockResolvedValue(null)
})

describe('VerificarEmail (RF-03)', () => {
  it('confirma el token una sola vez, aunque React arranque la pantalla dos veces', async () => {
    vi.mocked(verificarEmail).mockResolvedValue({ ok: true })
    mostrarConSesion(
      `/verificar-email?token=${TOKEN}`,
      <StrictMode>
        <VerificarEmail />
      </StrictMode>,
    )

    expect(await screen.findByText(/Tu email quedó verificado/)).toBeInTheDocument()
    expect(verificarEmail).toHaveBeenCalledTimes(1)
    expect(verificarEmail).toHaveBeenCalledWith(TOKEN)
  })

  it('al verificar vuelve a preguntar la sesión, así desaparece el aviso', async () => {
    vi.mocked(obtenerSesion).mockResolvedValueOnce(SIN_VERIFICAR).mockResolvedValue(ANA)
    vi.mocked(verificarEmail).mockResolvedValue({ ok: true })
    mostrarConSesion(`/verificar-email?token=${TOKEN}`, <VerificarEmail />)

    await screen.findByText(/Tu email quedó verificado/)
    expect(obtenerSesion).toHaveBeenCalledTimes(2)
  })

  it('enlace vencido: lo dice y, con la sesión abierta, ofrece reenviar', async () => {
    vi.mocked(obtenerSesion).mockResolvedValue(SIN_VERIFICAR)
    vi.mocked(verificarEmail).mockRejectedValue({
      codigo: 'TOKEN_INVALIDO',
      mensaje: 'El enlace no es válido o ya venció. Pedí uno nuevo.',
    })
    mostrarConSesion(`/verificar-email?token=${TOKEN}`, <VerificarEmail />)

    expect(await screen.findByRole('alert')).toHaveTextContent('El enlace no es válido o ya venció')
    expect(await screen.findByRole('button', { name: 'Reenviar el correo' })).toBeInTheDocument()
  })

  it('un token mal copiado (DATOS_INVALIDOS en "token") se explica como enlace inválido', async () => {
    vi.mocked(verificarEmail).mockRejectedValue({
      codigo: 'DATOS_INVALIDOS',
      mensaje: 'Revisá los datos ingresados.',
      detalles: [{ campo: 'token', mensaje: 'El token no es válido' }],
    })
    mostrarConSesion('/verificar-email?token=abc', <VerificarEmail />)

    expect(await screen.findByRole('alert')).toHaveTextContent('El enlace no es válido o ya venció')
  })

  it('sin token en el enlace no llama a la API', () => {
    mostrarConSesion('/verificar-email', <VerificarEmail />)

    expect(screen.getByRole('alert')).toHaveTextContent('El enlace está incompleto')
    expect(verificarEmail).not.toHaveBeenCalled()
  })
})

describe('AvisoVerificacion (RF-03)', () => {
  it('un usuario sin email verificado ve el aviso con el botón para reenviar', async () => {
    vi.mocked(obtenerSesion).mockResolvedValue(SIN_VERIFICAR)
    vi.mocked(reenviarVerificacion).mockResolvedValue({ ok: true })
    mostrarConSesion('/', <AvisoVerificacion />)

    const aviso = await screen.findByRole('region', { name: 'Verificación del email' })
    expect(aviso).toHaveTextContent('Verificá tu email: te mandamos un enlace a ana@mail.com.')

    fireEvent.click(screen.getByRole('button', { name: 'Reenviar el correo' }))
    expect(await screen.findByText(/Te mandamos otro enlace/)).toBeInTheDocument()
  })

  it('si se pasó del límite de reenvíos (429), muestra el mensaje de la API', async () => {
    vi.mocked(obtenerSesion).mockResolvedValue(SIN_VERIFICAR)
    vi.mocked(reenviarVerificacion).mockRejectedValue({
      codigo: 'DEMASIADOS_INTENTOS',
      mensaje: 'Ya pediste 3 enlaces en la última hora. Probá más tarde.',
    })
    mostrarConSesion('/', <AvisoVerificacion />)

    fireEvent.click(await screen.findByRole('button', { name: 'Reenviar el correo' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Ya pediste 3 enlaces')
  })

  it('con el email verificado, o sin sesión, no hay aviso', async () => {
    vi.mocked(obtenerSesion).mockResolvedValue(ANA)
    mostrarConSesion('/', <AvisoVerificacion />)
    await Promise.resolve()

    expect(screen.queryByRole('region', { name: 'Verificación del email' })).toBeNull()
  })
})
