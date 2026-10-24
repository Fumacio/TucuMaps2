import { fireEvent, render, screen } from '@testing-library/react'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import App from './App.jsx'
import { lugaresEjemplo } from './test/lugaresEjemplo.js'
import { simularPantalla } from './test/pantalla.js'

// Las pruebas no usan el backend: los lugares salen de src/test/lugaresEjemplo.js.
vi.mock('./api/lugares.js', () => import('./test/lugaresFalsos.js'))

let restaurarPantalla
beforeAll(() => {
  restaurarPantalla = simularPantalla()
})
afterAll(() => restaurarPantalla())

describe('App', () => {
  it('muestra el mapa con la atribución de OpenStreetMap (RF-02)', () => {
    render(<App />)
    expect(screen.getByRole('link', { name: 'OpenStreetMap' })).toBeInTheDocument()
  })

  it('agrupa los lugares cercanos en un círculo con el total (RF-05)', async () => {
    render(<App />)

    // Casa Histórica, Catedral y Casa Padilla están a pocas cuadras: forman un grupo de 3.
    expect(await screen.findByLabelText('3 lugares. Tocá para verlos.')).toHaveTextContent('3')
    // Los lejanos quedan sueltos, con su nombre y categoría.
    expect(screen.getByTitle('Villa Nougués (Natural / paisaje)')).toBeInTheDocument()

    // Entre pins sueltos y grupos están todos los lugares, ni uno más ni uno menos.
    const sueltos = document.querySelectorAll('.marcador-lugar').length
    const agrupados = [...document.querySelectorAll('.grupo-marcadores')].reduce(
      (total, grupo) => total + Number(grupo.textContent),
      0,
    )
    expect(sueltos + agrupados).toBe(lugaresEjemplo.length)
  })

  it('al tocar un grupo, el mapa se acerca y los marcadores se separan', async () => {
    render(<App />)

    fireEvent.click(await screen.findByLabelText('3 lugares. Tocá para verlos.'))

    expect(
      await screen.findByTitle('Casa Histórica de la Independencia (Histórico)'),
    ).toBeInTheDocument()
    expect(screen.getByTitle('Catedral de San Miguel de Tucumán (Religioso)')).toBeInTheDocument()
  })

  it('al tocar un marcador se abre el panel con el detalle de ese lugar', async () => {
    render(<App />)

    fireEvent.click(await screen.findByTitle('Villa Nougués (Natural / paisaje)'))

    expect(await screen.findByRole('heading', { name: 'Villa Nougués' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }))
    expect(screen.queryByRole('complementary', { name: 'Detalle del lugar' })).toBeNull()
  })
})
