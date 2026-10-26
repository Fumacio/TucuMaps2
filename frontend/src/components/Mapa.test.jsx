import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { obtenerEventos } from '../api/eventos.js'
import { obtenerLugares } from '../api/lugares.js'
import { obtenerAlertas } from '../api/reportes.js'
import { alertasEjemplo } from '../test/alertasEjemplo.js'
import { simularPantalla } from '../test/pantalla.js'
import Mapa from './Mapa.jsx'

vi.mock('../api/eventos.js', () => ({ obtenerEventos: vi.fn() }))
vi.mock('../api/lugares.js', () => ({ obtenerLugares: vi.fn() }))
vi.mock('../api/reportes.js', () => ({ obtenerAlertas: vi.fn() }))

beforeEach(() => {
  vi.clearAllMocks() // las llamadas se cuentan de cero en cada prueba
  vi.mocked(obtenerEventos).mockResolvedValue([])
})

const ERROR_SERVIDOR = {
  codigo: 'ERROR_SERVIDOR',
  mensaje: 'El servidor no está respondiendo. Intentá de nuevo en unos minutos.',
}

describe('Mapa', () => {
  it('si no hay lugares, lo avisa en lugar de mostrar un mapa vacío sin explicación', async () => {
    vi.mocked(obtenerLugares).mockResolvedValue([])
    render(<Mapa onSeleccionarLugar={() => {}} />)

    expect(await screen.findByText('Todavía no hay lugares para mostrar.')).toHaveAttribute('role', 'status')
  })

  it('si la API falla, muestra el mensaje de error (RF-06)', async () => {
    vi.mocked(obtenerLugares).mockRejectedValue(ERROR_SERVIDOR)
    render(<Mapa onSeleccionarLugar={() => {}} />)

    expect(await screen.findByRole('alert')).toHaveTextContent('El servidor no está respondiendo')
  })

  it('si fallan los eventos, muestra el error aunque los lugares hayan llegado (RF-06)', async () => {
    vi.mocked(obtenerLugares).mockResolvedValue([{ id: 1, nombre: 'Plaza', lat: -26.83, lng: -65.2 }])
    vi.mocked(obtenerEventos).mockRejectedValue(ERROR_SERVIDOR)
    render(<Mapa onSeleccionarLugar={() => {}} />)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No pudimos cargar los eventos. El servidor no está respondiendo',
    )
  })

  it('en Seguridad sin alertas activas, lo avisa', async () => {
    vi.mocked(obtenerLugares).mockResolvedValue([])
    vi.mocked(obtenerAlertas).mockResolvedValue([])
    render(<Mapa capa="seguridad" onSeleccionarLugar={() => {}} />)

    expect(await screen.findByText('No hay alertas activas en este momento.')).toHaveAttribute('role', 'status')
  })

  it('en Seguridad, si fallan las alertas, muestra el error (RF-06)', async () => {
    vi.mocked(obtenerLugares).mockResolvedValue([])
    vi.mocked(obtenerAlertas).mockRejectedValue(ERROR_SERVIDOR)
    render(<Mapa capa="seguridad" onSeleccionarLugar={() => {}} />)

    expect(await screen.findByRole('alert')).toHaveTextContent('El servidor no está respondiendo')
    expect(screen.queryByText('No hay alertas activas en este momento.')).toBeNull()
  })

  it('al volver a Seguridad, si falla la recarga, no quedan alertas viejas en el mapa (RF-11)', async () => {
    const restaurarPantalla = simularPantalla()
    vi.mocked(obtenerLugares).mockResolvedValue([])
    vi.mocked(obtenerAlertas).mockResolvedValue(alertasEjemplo)
    const { rerender } = render(<Mapa capa="seguridad" onSeleccionarLugar={() => {}} />)
    expect(await screen.findByTitle('Robos, asaltos y entraderas')).toBeInTheDocument()

    rerender(<Mapa capa="turismo" onSeleccionarLugar={() => {}} />)
    vi.mocked(obtenerAlertas).mockRejectedValue(ERROR_SERVIDOR)
    rerender(<Mapa capa="seguridad" onSeleccionarLugar={() => {}} />)

    expect(await screen.findByRole('alert')).toHaveTextContent('El servidor no está respondiendo')
    expect(document.querySelectorAll('.marcador-alerta')).toHaveLength(0)
    restaurarPantalla()
  })

  it('mientras llegan los datos muestra el indicador de carga (RF-06)', async () => {
    vi.mocked(obtenerLugares).mockReturnValue(new Promise(() => {})) // nunca responde
    render(<Mapa onSeleccionarLugar={() => {}} />)

    expect(screen.getByRole('status')).toHaveTextContent('Cargando lugares y eventos…')
  })

  it('Reintentar vuelve a pedir los lugares y, si llegan, saca el error (RF-06)', async () => {
    vi.mocked(obtenerLugares).mockRejectedValueOnce(ERROR_SERVIDOR).mockResolvedValue([])
    render(<Mapa onSeleccionarLugar={() => {}} />)

    fireEvent.click(await screen.findByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByText('Todavía no hay lugares para mostrar.')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).toBeNull()
    expect(obtenerLugares).toHaveBeenCalledTimes(2)
  })

  it('si solo fallaron los eventos, Reintentar no vuelve a pedir los lugares (RF-06)', async () => {
    vi.mocked(obtenerLugares).mockResolvedValue([])
    vi.mocked(obtenerEventos).mockRejectedValueOnce(ERROR_SERVIDOR).mockResolvedValue([])
    render(<Mapa onSeleccionarLugar={() => {}} />)

    fireEvent.click(await screen.findByRole('button', { name: 'Reintentar' }))

    await waitFor(() => expect(obtenerEventos).toHaveBeenCalledTimes(2))
    expect(screen.queryByRole('alert')).toBeNull()
    expect(obtenerLugares).toHaveBeenCalledTimes(1)
  })

  it('en Seguridad, Reintentar vuelve a pedir las alertas (RF-06)', async () => {
    vi.mocked(obtenerLugares).mockResolvedValue([])
    vi.mocked(obtenerAlertas).mockRejectedValueOnce(ERROR_SERVIDOR).mockResolvedValue([])
    render(<Mapa capa="seguridad" onSeleccionarLugar={() => {}} />)

    fireEvent.click(await screen.findByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByText('No hay alertas activas en este momento.')).toBeInTheDocument()
  })
})
