import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { obtenerSesion } from '../api/auth.js'
import ProveedorSesion from '../context/ProveedorSesion.jsx'
import { ANA } from '../test/conSesion.jsx'
import BarraSuperior from './BarraSuperior.jsx'

vi.mock('../api/auth.js', () => ({ obtenerSesion: vi.fn() }))

function mostrar(usuario) {
  vi.mocked(obtenerSesion).mockResolvedValue(usuario)
  return render(
    <MemoryRouter>
      <ProveedorSesion>
        <BarraSuperior />
      </ProveedorSesion>
    </MemoryRouter>,
  )
}

describe('BarraSuperior (Pantallas, 1)', () => {
  it('con sesión, "Enviar reporte" y "Proponer evento" en lugar de "Iniciar sesión" (#62)', async () => {
    mostrar(ANA)

    expect(await screen.findByRole('link', { name: 'Enviar reporte' })).toHaveAttribute('href', '/reportar')
    expect(screen.getByRole('link', { name: 'Proponer evento' })).toHaveAttribute('href', '/proponer-evento')
    expect(screen.queryByRole('link', { name: 'Iniciar sesión' })).toBeNull()
  })

  it('el administrador no ve los botones de envío: ve su saludo', async () => {
    mostrar({ ...ANA, rol: 'admin' })

    expect(await screen.findByRole('link', { name: 'Hola, Ana' })).toHaveAttribute('href', '/cuenta')
    expect(screen.queryByRole('link', { name: 'Enviar reporte' })).toBeNull()
  })
})
