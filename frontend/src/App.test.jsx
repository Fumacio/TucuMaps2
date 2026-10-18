import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App.jsx'
import { obtenerLugares } from './api/lugares.js'

describe('App', () => {
  it('muestra el mapa con la atribución de OpenStreetMap (RF-02)', () => {
    render(<App />)
    expect(screen.getByRole('link', { name: 'OpenStreetMap' })).toBeInTheDocument()
  })

  it('pone un marcador por cada lugar, con su nombre y categoría', async () => {
    const lugares = await obtenerLugares()
    render(<App />)

    expect(
      await screen.findByTitle('Casa Histórica de la Independencia (Histórico)'),
    ).toBeInTheDocument()
    expect(document.querySelectorAll('.marcador-lugar')).toHaveLength(lugares.length)
  })

  it('al tocar un marcador se abre el panel con el detalle de ese lugar', async () => {
    render(<App />)

    fireEvent.click(await screen.findByTitle('Villa Nougués (Natural / paisaje)'))

    expect(await screen.findByRole('heading', { name: 'Villa Nougués' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }))
    expect(screen.queryByRole('complementary', { name: 'Detalle del lugar' })).toBeNull()
  })
})
