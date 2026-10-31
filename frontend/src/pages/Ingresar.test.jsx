import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { iniciarSesion, obtenerSesion } from '../api/auth.js'
import ProveedorSesion from '../context/ProveedorSesion.jsx'
import Ingresar from './Ingresar.jsx'

vi.mock('../api/auth.js', () => ({ obtenerSesion: vi.fn(), iniciarSesion: vi.fn(), cerrarSesion: vi.fn() }))

const ANA = { id: 12, nombre: 'Ana Pérez', email: 'ana@mail.com', rol: 'ciudadano', email_verificado: true }

function mostrar(estado) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/ingresar', state: estado }]}>
      <ProveedorSesion>
        <Routes>
          <Route path="/ingresar" element={<Ingresar />} />
          <Route path="/" element={<p>pantalla del mapa</p>} />
          <Route path="/agenda" element={<p>pantalla de la agenda</p>} />
        </Routes>
      </ProveedorSesion>
    </MemoryRouter>,
  )
}

function completar(email, password) {
  fireEvent.change(screen.getByLabelText('Correo'), { target: { value: email } })
  fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: password } })
  fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(obtenerSesion).mockResolvedValue(null)
})

describe('Ingresar (RF-01)', () => {
  it('con los datos correctos entra y vuelve a la pantalla de donde vino', async () => {
    vi.mocked(iniciarSesion).mockResolvedValue(ANA)
    mostrar({ desde: '/agenda' })

    completar(' ana@mail.com ', 'clave1234')

    expect(await screen.findByText('pantalla de la agenda')).toBeInTheDocument()
    expect(iniciarSesion).toHaveBeenCalledWith({ email: 'ana@mail.com', password: 'clave1234' })
  })

  it('contraseña incorrecta: muestra el mensaje de la API y no sale de la pantalla', async () => {
    vi.mocked(iniciarSesion).mockRejectedValue({
      codigo: 'CREDENCIALES_INVALIDAS',
      mensaje: 'El email o la contraseña no son correctos.',
    })
    mostrar()

    completar('ana@mail.com', 'mal1234567')

    expect(await screen.findByRole('alert')).toHaveTextContent('El email o la contraseña no son correctos.')
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeEnabled()
  })

  it('tras 5 intentos fallidos muestra el mensaje de espera de la API (429)', async () => {
    vi.mocked(iniciarSesion).mockRejectedValue({
      codigo: 'DEMASIADOS_INTENTOS',
      mensaje: 'Demasiados intentos. Probá de nuevo en 15 minutos.',
    })
    mostrar()

    completar('ana@mail.com', 'mal1234567')

    expect(await screen.findByRole('alert')).toHaveTextContent('Probá de nuevo en 15 minutos')
  })

  it('los errores de cada campo (detalles) van debajo de su campo', async () => {
    vi.mocked(iniciarSesion).mockRejectedValue({
      codigo: 'DATOS_INVALIDOS',
      mensaje: 'Revisá los datos.',
      detalles: [{ campo: 'email', mensaje: 'El email no es válido' }],
    })
    mostrar()

    completar('ana', 'clave1234')

    expect(await screen.findByText('El email no es válido')).toBeInTheDocument()
    expect(screen.getByLabelText('Correo')).toHaveAccessibleDescription('El email no es válido')
  })

  it('tiene los enlaces del diseño: recuperar contraseña y crear cuenta', async () => {
    mostrar()

    expect(screen.getByRole('link', { name: 'Recuperar contraseña' })).toHaveAttribute('href', '/recuperar')
    expect(screen.getByRole('link', { name: 'Crear cuenta' })).toHaveAttribute('href', '/registro')
  })

  it('si ya hay sesión, no muestra el login', async () => {
    vi.mocked(obtenerSesion).mockResolvedValue(ANA)
    mostrar()

    expect(await screen.findByText('pantalla del mapa')).toBeInTheDocument()
  })
})
