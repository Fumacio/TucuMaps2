import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { obtenerEventos } from '../api/eventos.js'
import { obtenerLugares } from '../api/lugares.js'
import Mapa from './Mapa.jsx'

vi.mock('../api/eventos.js', () => ({ obtenerEventos: vi.fn() }))
vi.mock('../api/lugares.js', () => ({ obtenerLugares: vi.fn() }))
vi.mock('../api/reportes.js', () => ({ obtenerAlertas: vi.fn() }))

// Simula el GPS del celular: `responder(exito, fallo)` decide qué contesta. Se cambia solo
// navigator.geolocation; el resto de navigator queda como está.
function conGps(responder) {
  const getCurrentPosition = vi.fn(responder)
  Object.defineProperty(navigator, 'geolocation', { value: { getCurrentPosition }, configurable: true })
  return getCurrentPosition
}

function mostrar() {
  return render(<Mapa onSeleccionarLugar={() => {}} />, { wrapper: MemoryRouter })
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(obtenerLugares).mockResolvedValue([])
  vi.mocked(obtenerEventos).mockResolvedValue([])
})

afterEach(() => {
  delete navigator.geolocation // vuelve a como era (jsdom no tiene GPS)
})

describe('Mapa: Mi ubicación (RF-02)', () => {
  it('no pide la ubicación al abrir el mapa, solo al tocar el botón', async () => {
    const getCurrentPosition = conGps(() => {})
    mostrar()

    const boton = await screen.findByRole('button', { name: 'Mi ubicación' })
    expect(getCurrentPosition).not.toHaveBeenCalled()

    fireEvent.click(boton)
    expect(getCurrentPosition).toHaveBeenCalledTimes(1)
    expect(boton).toBeDisabled() // esperando al GPS
  })

  it('si la encuentra, muestra el punto azul donde está la persona', async () => {
    conGps((exito) => exito({ coords: { latitude: -26.83, longitude: -65.2, accuracy: 30 } }))
    const { container } = mostrar()

    fireEvent.click(await screen.findByRole('button', { name: 'Mi ubicación' }))

    await waitFor(() => expect(container.querySelector('.mi-ubicacion')).not.toBeNull())
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('si no da permiso, el mapa sigue y aparece un aviso que se puede cerrar', async () => {
    conGps((_, fallo) => fallo({ code: 1 }))
    const { container } = mostrar()

    fireEvent.click(await screen.findByRole('button', { name: 'Mi ubicación' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('No diste permiso para usar tu ubicación')
    expect(container.querySelector('.mi-ubicacion')).toBeNull()
    expect(screen.getByRole('button', { name: 'Mi ubicación' })).toBeEnabled()

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar aviso' }))
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('si no hay señal a tiempo, lo dice sin hablar del permiso, y no queda el punto anterior', async () => {
    let respuesta = (exito) => exito({ coords: { latitude: -26.83, longitude: -65.2, accuracy: 30 } })
    conGps((exito, fallo) => respuesta(exito, fallo))
    const { container } = mostrar()

    fireEvent.click(await screen.findByRole('button', { name: 'Mi ubicación' }))
    await waitFor(() => expect(container.querySelector('.mi-ubicacion')).not.toBeNull())

    respuesta = (_, fallo) => fallo({ code: 3 }) // TIMEOUT
    fireEvent.click(screen.getByRole('button', { name: 'Mi ubicación' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos obtener tu ubicación. Probá de nuevo')
    expect(container.querySelector('.mi-ubicacion')).toBeNull()
  })

  it('si está fuera de Tucumán, no la marca y lo avisa', async () => {
    conGps((exito) => exito({ coords: { latitude: -34.6, longitude: -58.4, accuracy: 30 } })) // Buenos Aires
    const { container } = mostrar()

    fireEvent.click(await screen.findByRole('button', { name: 'Mi ubicación' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Estás fuera de Tucumán.')
    expect(container.querySelector('.mi-ubicacion')).toBeNull()
  })

  it('sin GPS en el navegador, el botón no aparece', async () => {
    const { container } = mostrar() // jsdom no tiene navigator.geolocation

    await waitFor(() => expect(container.querySelector('.leaflet-control-zoom')).not.toBeNull())
    expect(screen.queryByRole('button', { name: 'Mi ubicación' })).toBeNull()
  })
})
