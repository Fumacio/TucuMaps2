import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { obtenerSesion, registrarse } from '../api/auth.js'
import ProveedorSesion from '../context/ProveedorSesion.jsx'
import Registro from './Registro.jsx'

vi.mock('../api/auth.js', () => ({ obtenerSesion: vi.fn(), registrarse: vi.fn(), cerrarSesion: vi.fn() }))

const ANA = { id: 12, nombre: 'Ana Pérez', email: 'ana@mail.com', rol: 'ciudadano', email_verificado: false }

function mostrar() {
  return render(
    <MemoryRouter initialEntries={['/registro']}>
      <ProveedorSesion>
        <Routes>
          <Route path="/registro" element={<Registro />} />
          <Route path="/" element={<p>pantalla del mapa</p>} />
        </Routes>
      </ProveedorSesion>
    </MemoryRouter>,
  )
}

function completar({ nombre = 'Ana Pérez', email = 'ana@mail.com', password = 'clave1234', acepta = true } = {}) {
  fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: nombre } })
  fireEvent.change(screen.getByLabelText('Correo'), { target: { value: email } })
  fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: password } })
  if (acepta) fireEvent.click(screen.getByRole('checkbox'))
  fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(obtenerSesion).mockResolvedValue(null)
})

describe('Registro (RF-01, RF-04)', () => {
  it('crea la cuenta, queda con la sesión iniciada y va al mapa', async () => {
    vi.mocked(registrarse).mockResolvedValue(ANA)
    mostrar()

    completar({ nombre: '  Ana Pérez ', email: ' ana@mail.com ' })

    expect(await screen.findByText('pantalla del mapa')).toBeInTheDocument()
    expect(registrarse).toHaveBeenCalledWith({
      nombre: 'Ana Pérez',
      email: 'ana@mail.com',
      password: 'clave1234',
      aceptaTerminos: true,
    })
  })

  it('avisa antes de enviar si la contraseña no cumple la política', async () => {
    mostrar()

    completar({ password: 'corta1' })

    expect(screen.getByLabelText('Contraseña')).toHaveAccessibleDescription(
      /La contraseña debe tener al menos 8 caracteres/,
    )
    expect(registrarse).not.toHaveBeenCalled()
  })

  it('sin aceptar los términos no envía y lo dice junto a la casilla', async () => {
    mostrar()

    completar({ acepta: false })

    expect(screen.getByRole('checkbox')).toHaveAccessibleDescription('Tenés que aceptar los términos de uso')
    expect(registrarse).not.toHaveBeenCalled()
  })

  it('un email que ya tiene cuenta (409) se marca debajo del correo', async () => {
    vi.mocked(registrarse).mockRejectedValue({
      codigo: 'EMAIL_EN_USO',
      mensaje: 'Ya hay una cuenta con ese email.',
    })
    mostrar()

    completar()

    expect(await screen.findByText('Ya hay una cuenta con ese email.')).toBeInTheDocument()
    expect(screen.getByLabelText('Correo')).toHaveAccessibleDescription('Ya hay una cuenta con ese email.')
  })

  it('los errores de cada campo de la API (detalles) van debajo de su campo', async () => {
    vi.mocked(registrarse).mockRejectedValue({
      codigo: 'DATOS_INVALIDOS',
      mensaje: 'Revisá los datos.',
      detalles: [{ campo: 'nombre', mensaje: 'El nombre debe tener entre 2 y 80 caracteres' }],
    })
    mostrar()

    completar({ nombre: 'A' })

    expect(await screen.findByText('El nombre debe tener entre 2 y 80 caracteres')).toBeInTheDocument()
  })

  it('otros errores (por ejemplo, demasiados registros desde la misma red) arriba del formulario', async () => {
    vi.mocked(registrarse).mockRejectedValue({
      codigo: 'DEMASIADOS_INTENTOS',
      mensaje: 'Demasiados intentos. Probá de nuevo más tarde.',
    })
    mostrar()

    completar()

    expect(await screen.findByRole('alert')).toHaveTextContent('Demasiados intentos')
  })

  it('la casilla enlaza a los Términos y la Privacidad, y hay un enlace para iniciar sesión', () => {
    mostrar()

    expect(screen.getByRole('link', { name: 'Términos y Condiciones' })).toHaveAttribute('href', '/terminos')
    expect(screen.getByRole('link', { name: 'Política de Privacidad' })).toHaveAttribute('href', '/privacidad')
    expect(screen.getByRole('link', { name: 'Iniciar sesión' })).toHaveAttribute('href', '/ingresar')
  })
})
