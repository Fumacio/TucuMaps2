import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ElegirUbicacion from './ElegirUbicacion.jsx'
import { dentroDeTucuman } from './ubicacion.js'

function conGps(responder) {
  vi.stubGlobal('navigator', { ...navigator, geolocation: { getCurrentPosition: responder } })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('ElegirUbicacion (RF-10)', () => {
  it('dentroDeTucuman usa la misma caja que la API', () => {
    expect(dentroDeTucuman({ lat: -26.83, lng: -65.2 })).toBe(true)
    expect(dentroDeTucuman({ lat: -34.6, lng: -58.4 })).toBe(false) // Buenos Aires
  })

  it('"Usar mi ubicación" marca el punto del celular', () => {
    conGps((exito) => exito({ coords: { latitude: -26.8301234567, longitude: -65.2151234567 } }))
    const onCambiar = vi.fn()
    render(<ElegirUbicacion valor={null} onCambiar={onCambiar} />)

    fireEvent.click(screen.getByRole('button', { name: 'Usar mi ubicación' }))

    expect(onCambiar).toHaveBeenCalledWith({ lat: -26.830123, lng: -65.215123 })
  })

  it('si la ubicación está fuera de Tucumán, no la marca y lo explica', () => {
    conGps((exito) => exito({ coords: { latitude: -34.6, longitude: -58.4 } }))
    const onCambiar = vi.fn()
    render(<ElegirUbicacion valor={null} onCambiar={onCambiar} />)

    fireEvent.click(screen.getByRole('button', { name: 'Usar mi ubicación' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Tu ubicación está fuera de Tucumán')
    expect(onCambiar).not.toHaveBeenCalled()
  })

  it('si no da permiso, pide tocar el mapa', () => {
    conGps((_, fallo) => fallo({ code: 1 }))
    render(<ElegirUbicacion valor={null} onCambiar={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: 'Usar mi ubicación' }))

    expect(screen.getByRole('alert')).toHaveTextContent('No pudimos obtener tu ubicación')
  })

  it('dice si ya hay un punto marcado y muestra el error que le pasan', () => {
    const { rerender } = render(
      <ElegirUbicacion valor={null} onCambiar={vi.fn()} error="Marcá en el mapa dónde pasó" />,
    )
    expect(screen.getByRole('status')).toHaveTextContent('Todavía no marcaste la ubicación.')
    expect(screen.getByRole('alert')).toHaveTextContent('Marcá en el mapa dónde pasó')

    rerender(<ElegirUbicacion valor={{ lat: -26.83, lng: -65.2 }} onCambiar={vi.fn()} />)
    expect(screen.getByRole('status')).toHaveTextContent('Ubicación marcada.')
  })
})
