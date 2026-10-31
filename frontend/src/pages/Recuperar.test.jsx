import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { obtenerSesion, pedirRecuperacion, restablecerPassword } from '../api/auth.js'
import { mostrarConSesion } from '../test/conSesion.jsx'
import Recuperar from './Recuperar.jsx'
import Restablecer from './Restablecer.jsx'

vi.mock('../api/auth.js', () => ({
  obtenerSesion: vi.fn(),
  pedirRecuperacion: vi.fn(),
  restablecerPassword: vi.fn(),
  cerrarSesion: vi.fn(),
}))

const TOKEN = 'b'.repeat(64)

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(obtenerSesion).mockResolvedValue(null)
})

describe('Recuperar (RF-03)', () => {
  it('pide el enlace y responde sin revelar si la cuenta existe', async () => {
    vi.mocked(pedirRecuperacion).mockResolvedValue({ ok: true })
    mostrarConSesion('/recuperar', <Recuperar />)

    fireEvent.change(screen.getByLabelText('Correo'), { target: { value: ' ana@mail.com ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enviar el enlace' }))

    expect(await screen.findByRole('status')).toHaveTextContent('Si hay una cuenta con ana@mail.com')
    expect(pedirRecuperacion).toHaveBeenCalledWith('ana@mail.com')
  })

  it('el límite de pedidos (429) se muestra arriba del formulario', async () => {
    vi.mocked(pedirRecuperacion).mockRejectedValue({
      codigo: 'DEMASIADOS_INTENTOS',
      mensaje: 'Demasiados pedidos. Probá en una hora.',
    })
    mostrarConSesion('/recuperar', <Recuperar />)

    fireEvent.change(screen.getByLabelText('Correo'), { target: { value: 'ana@mail.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enviar el enlace' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Demasiados pedidos')
  })
})

describe('Restablecer (RF-03)', () => {
  function elegir(password) {
    fireEvent.change(screen.getByLabelText('Contraseña nueva'), { target: { value: password } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar la contraseña' }))
  }

  it('guarda la contraseña nueva con el token del enlace', async () => {
    vi.mocked(restablecerPassword).mockResolvedValue({ ok: true })
    mostrarConSesion(`/restablecer?token=${TOKEN}`, <Restablecer />)

    elegir('nueva12345')

    expect(await screen.findByRole('status')).toHaveTextContent('Tu contraseña cambió')
    expect(restablecerPassword).toHaveBeenCalledWith({ token: TOKEN, password: 'nueva12345' })
    expect(screen.getByRole('link', { name: 'Iniciar sesión' })).toHaveAttribute('href', '/ingresar')
  })

  it('avisa antes de enviar si la contraseña no cumple la política', () => {
    mostrarConSesion(`/restablecer?token=${TOKEN}`, <Restablecer />)

    elegir('sinnumeros')

    expect(screen.getByLabelText('Contraseña nueva')).toHaveAccessibleDescription(
      /al menos una letra y un número$/,
    )
    expect(restablecerPassword).not.toHaveBeenCalled()
  })

  it('enlace vencido: lo dice y ofrece pedir otro', async () => {
    vi.mocked(restablecerPassword).mockRejectedValue({
      codigo: 'TOKEN_INVALIDO',
      mensaje: 'El enlace no es válido o ya venció. Pedí uno nuevo.',
    })
    mostrarConSesion(`/restablecer?token=${TOKEN}`, <Restablecer />)

    elegir('nueva12345')

    expect(await screen.findByRole('alert')).toHaveTextContent('ya venció')
    expect(screen.getByRole('link', { name: 'Pedí un enlace nuevo' })).toHaveAttribute('href', '/recuperar')
  })

  it('sin token no muestra el formulario', () => {
    mostrarConSesion('/restablecer', <Restablecer />)

    expect(screen.getByRole('alert')).toHaveTextContent('El enlace está incompleto')
    expect(screen.queryByLabelText('Contraseña nueva')).toBeNull()
  })
})
