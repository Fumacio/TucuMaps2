import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cerrarSesion, obtenerSesion } from '../api/auth.js'
import ProveedorSesion from './ProveedorSesion.jsx'
import { useSesion } from './sesion.js'

vi.mock('../api/auth.js', () => ({ obtenerSesion: vi.fn(), cerrarSesion: vi.fn() }))

const ANA = { id: 12, nombre: 'Ana Pérez', email: 'ana@mail.com', rol: 'ciudadano', email_verificado: true }

// Muestra lo que dice el contexto, como lo haría cualquier pantalla.
function Espia() {
  const { usuario, cargando, salir } = useSesion()
  if (cargando) return <p>cargando</p>
  return (
    <>
      <p>{usuario ? `conectada: ${usuario.nombre}` : 'sin sesión'}</p>
      <button onClick={salir}>salir</button>
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

  it('salir cierra la sesión en el servidor y en la pantalla, aunque el pedido falle', async () => {
    vi.mocked(obtenerSesion).mockResolvedValue(ANA)
    vi.mocked(cerrarSesion).mockRejectedValue({ codigo: 'NO_AUTENTICADO' })
    mostrar()

    fireEvent.click(await screen.findByRole('button', { name: 'salir' }))

    expect(await screen.findByText('sin sesión')).toBeInTheDocument()
    expect(cerrarSesion).toHaveBeenCalled()
  })
})
