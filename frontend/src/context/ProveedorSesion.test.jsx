import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cerrarSesion, obtenerSesion } from '../api/auth.js'
import ProveedorSesion from './ProveedorSesion.jsx'
import { useSesion } from './sesion.js'

vi.mock('../api/auth.js', () => ({ obtenerSesion: vi.fn(), cerrarSesion: vi.fn() }))

const ANA = { id: 12, nombre: 'Ana Pérez', email: 'ana@mail.com', rol: 'ciudadano', email_verificado: true }

// Muestra lo que dice el contexto, como lo haría cualquier pantalla.
function Espia() {
  const { usuario, cargando, salir } = useSesion()
  const [error, setError] = useState(null)
  if (cargando) return <p>cargando</p>
  return (
    <>
      <p>{usuario ? `conectada: ${usuario.nombre}` : 'sin sesión'}</p>
      {error && <p>error: {error.codigo}</p>}
      <button onClick={() => salir().catch(setError)}>salir</button>
    </>
  )
}

function mostrar() {
  return render(
    <ProveedorSesion>
      <Espia />
    </ProveedorSesion>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('ProveedorSesion (RF-01)', () => {
  it('al abrir la app pregunta la sesión y la comparte', async () => {
    vi.mocked(obtenerSesion).mockResolvedValue(ANA)
    mostrar()

    expect(screen.getByText('cargando')).toBeInTheDocument()
    expect(await screen.findByText('conectada: Ana Pérez')).toBeInTheDocument()
  })

  it('sin sesión queda en null', async () => {
    vi.mocked(obtenerSesion).mockResolvedValue(null)
    mostrar()

    expect(await screen.findByText('sin sesión')).toBeInTheDocument()
  })

  it('si el servidor no responde, sigue como sin sesión (el mapa se usa igual)', async () => {
    vi.mocked(obtenerSesion).mockRejectedValue({ codigo: 'SIN_CONEXION' })
    mostrar()

    expect(await screen.findByText('sin sesión')).toBeInTheDocument()
  })

  it('salir cierra la sesión; si el servidor ya no la tenía (401), también', async () => {
    vi.mocked(obtenerSesion).mockResolvedValue(ANA)
    vi.mocked(cerrarSesion).mockRejectedValue({ codigo: 'NO_AUTENTICADO' })
    mostrar()

    fireEvent.click(await screen.findByRole('button', { name: 'salir' }))

    expect(await screen.findByText('sin sesión')).toBeInTheDocument()
    expect(cerrarSesion).toHaveBeenCalled()
  })

  it('sin conexión no muestra la sesión cerrada (la cookie sigue viva) y pasa el error', async () => {
    vi.mocked(obtenerSesion).mockResolvedValue(ANA)
    vi.mocked(cerrarSesion).mockRejectedValue({ codigo: 'SIN_CONEXION' })
    mostrar()

    fireEvent.click(await screen.findByRole('button', { name: 'salir' }))

    expect(await screen.findByText('error: SIN_CONEXION')).toBeInTheDocument()
    expect(screen.getByText('conectada: Ana Pérez')).toBeInTheDocument()
  })
})
