import { fireEvent, render, screen } from '@testing-library/react'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import App from './App.jsx'
import { lugaresEjemplo } from './test/lugaresEjemplo.js'
import { simularPantalla } from './test/pantalla.js'

// Las pruebas no usan el backend: los lugares salen de src/test/lugaresEjemplo.js.
vi.mock('./api/lugares.js', () => import('./test/lugaresFalsos.js'))
vi.mock('./api/reportes.js', async () => {
  const { alertasEjemplo } = await import('./test/alertasEjemplo.js')
  return { obtenerAlertas: () => Promise.resolve(alertasEjemplo) }
})

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

  it('el botón Seguridad se prende y se apaga (RF-02)', () => {
    render(<App />)
    const boton = screen.getByRole('button', { name: 'Seguridad' })

    expect(boton).toHaveAttribute('aria-pressed', 'false') // arranca en Turismo
    fireEvent.click(boton)
    expect(boton).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(boton)
    expect(boton).toHaveAttribute('aria-pressed', 'false')
  })

  it('cada capa muestra solo sus marcadores (RF-02)', async () => {
    render(<App />)
    expect(await screen.findByTitle('Villa Nougués (Natural / paisaje)')).toBeInTheDocument()
    const boton = screen.getByRole('button', { name: 'Seguridad' })

    fireEvent.click(boton)
    expect(await screen.findByTitle('Robos, asaltos y entraderas')).toBeInTheDocument()
    expect(screen.getByTitle('Accidentes de tránsito')).toBeInTheDocument()
    expect(document.querySelectorAll('.marcador-lugar')).toHaveLength(0)
    expect(document.querySelectorAll('.grupo-marcadores--turismo')).toHaveLength(0)

    fireEvent.click(boton)
    expect(await screen.findByTitle('Villa Nougués (Natural / paisaje)')).toBeInTheDocument()
    expect(document.querySelectorAll('.marcador-alerta')).toHaveLength(0)
  })

  it('al tocar una alerta muestra tipo, descripción, dirección y confirmaciones (RF-04)', async () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Seguridad' }))

    fireEvent.click(await screen.findByTitle('Robos, asaltos y entraderas'))

    const globito = await screen.findByText('Arrebatos frecuentes en la parada')
    const popup = globito.closest('.leaflet-popup')
    expect(popup).toHaveTextContent('Robos, asaltos y entraderas')
    expect(popup).toHaveTextContent('Av. Mate de Luna 2400, Barrio Norte')
    expect(popup).toHaveTextContent('Confirmada por 4 vecinos')
  })

  it('el aviso del 911 se ve solo en la capa Seguridad (RF-04)', async () => {
    render(<App />)
    expect(screen.queryByRole('note')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Seguridad' }))
    const aviso = screen.getByRole('note')
    expect(aviso).toHaveTextContent('no es un servicio oficial y no reemplaza al 911')
    expect(screen.getByRole('link', { name: '911' })).toHaveAttribute('href', 'tel:911')
  })

  it('al pasar a Seguridad se cierra el panel del lugar abierto', async () => {
    render(<App />)
    fireEvent.click(await screen.findByTitle('Villa Nougués (Natural / paisaje)'))
    expect(await screen.findByRole('heading', { name: 'Villa Nougués' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Seguridad' }))

    expect(screen.queryByRole('complementary', { name: 'Detalle del lugar' })).toBeNull()
  })
})
