import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { obtenerLugares } from '../api/lugares.js'
import { obtenerAlertas } from '../api/reportes.js'
import Mapa from './Mapa.jsx'

vi.mock('../api/lugares.js', () => ({ obtenerLugares: vi.fn() }))
vi.mock('../api/reportes.js', () => ({ obtenerAlertas: vi.fn() }))

const ERROR_SERVIDOR = {
  codigo: 'ERROR_SERVIDOR',
  mensaje: 'El servidor no está respondiendo. Intentá de nuevo en unos minutos.',
}

describe('Mapa', () => {
  it('si no hay lugares, lo avisa en lugar de mostrar un mapa vacío sin explicación', async () => {
    vi.mocked(obtenerLugares).mockResolvedValue([])
    render(<Mapa onSeleccionarLugar={() => {}} />)

    expect(await screen.findByRole('status')).toHaveTextContent('Todavía no hay lugares')
  })

  it('si la API falla, muestra el mensaje de error (RF-06)', async () => {
    vi.mocked(obtenerLugares).mockRejectedValue(ERROR_SERVIDOR)
    render(<Mapa onSeleccionarLugar={() => {}} />)

    expect(await screen.findByRole('alert')).toHaveTextContent('El servidor no está respondiendo')
  })

  it('en Seguridad sin alertas activas, lo avisa', async () => {
    vi.mocked(obtenerLugares).mockResolvedValue([])
    vi.mocked(obtenerAlertas).mockResolvedValue([])
    render(<Mapa capa="seguridad" onSeleccionarLugar={() => {}} />)

    expect(await screen.findByRole('status')).toHaveTextContent('No hay alertas activas')
  })

  it('en Seguridad, si fallan las alertas, muestra el error (RF-06)', async () => {
    vi.mocked(obtenerLugares).mockResolvedValue([])
    vi.mocked(obtenerAlertas).mockRejectedValue(ERROR_SERVIDOR)
    render(<Mapa capa="seguridad" onSeleccionarLugar={() => {}} />)

    expect(await screen.findByRole('alert')).toHaveTextContent('El servidor no está respondiendo')
    expect(screen.queryByText('No hay alertas activas en este momento.')).toBeNull()
  })
})
