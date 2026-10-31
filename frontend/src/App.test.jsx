import { fireEvent, render, screen, within } from '@testing-library/react'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import App from './App.jsx'
import ProveedorSesion from './context/ProveedorSesion.jsx'
import { eventosEjemplo } from './test/eventosEjemplo.js'
import { lugaresEjemplo } from './test/lugaresEjemplo.js'
import { simularPantalla } from './test/pantalla.js'

// Las pruebas no usan el backend: los lugares salen de src/test/lugaresEjemplo.js.
vi.mock('./api/lugares.js', () => import('./test/lugaresFalsos.js'))
vi.mock('./api/eventos.js', async () => {
  const { eventosEjemplo } = await import('./test/eventosEjemplo.js')
  return { obtenerEventos: () => Promise.resolve(eventosEjemplo) }
})
vi.mock('./api/auth.js', () => ({
  obtenerSesion: () => Promise.resolve(null),
  cerrarSesion: () => Promise.resolve(null),
}))
vi.mock('./api/reportes.js', async () => {
  const { alertasEjemplo } = await import('./test/alertasEjemplo.js')
  return { obtenerAlertas: () => Promise.resolve(alertasEjemplo) }
})

let restaurarPantalla
beforeAll(() => {
  restaurarPantalla = simularPantalla()
})
afterAll(() => restaurarPantalla())

function mostrar(ruta = '/') {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <ProveedorSesion>
        <App />
      </ProveedorSesion>
    </MemoryRouter>,
  )
}

describe('App', () => {
  it('muestra el mapa con la atribución de OpenStreetMap (RF-02)', () => {
    mostrar()
    expect(screen.getByRole('link', { name: 'OpenStreetMap' })).toBeInTheDocument()
  })

  it('agrupa los lugares cercanos en un círculo con el total (RF-05)', async () => {
    mostrar()

    // Casa Histórica, Catedral y Casa Padilla están a pocas cuadras: forman un grupo de 3.
    expect(await screen.findByLabelText('3 lugares. Tocá para verlos.')).toHaveTextContent('3')
    // Los lejanos quedan sueltos, con su nombre y categoría.
    expect(screen.getByTitle('Villa Nougués (Natural / paisaje)')).toBeInTheDocument()

    // La Peña es en el Parque 9 de Julio: el evento y el lugar van juntos en un grupo mixto.
    expect(screen.getByLabelText('2 lugares y eventos. Tocá para verlos.')).toBeInTheDocument()

    // Entre pins sueltos y grupos están todos los lugares y eventos, ni uno más ni uno menos.
    const sueltos = document.querySelectorAll('.marcador-lugar, .marcador-evento').length
    const agrupados = [...document.querySelectorAll('.grupo-marcadores')].reduce(
      (total, grupo) => total + Number(grupo.textContent),
      0,
    )
    expect(sueltos + agrupados).toBe(lugaresEjemplo.length + eventosEjemplo.length)
  })

  it('al tocar un grupo, el mapa se acerca y los marcadores se separan', async () => {
    mostrar()

    fireEvent.click(await screen.findByLabelText('3 lugares. Tocá para verlos.'))

    expect(
      await screen.findByTitle('Casa Histórica de la Independencia (Histórico)'),
    ).toBeInTheDocument()
    expect(screen.getByTitle('Catedral de San Miguel de Tucumán (Religioso)')).toBeInTheDocument()
  })

  it('al tocar un marcador se abre el panel con el detalle de ese lugar', async () => {
    mostrar()

    fireEvent.click(await screen.findByTitle('Villa Nougués (Natural / paisaje)'))

    expect(await screen.findByRole('heading', { name: 'Villa Nougués' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }))
    expect(screen.queryByRole('complementary', { name: 'Detalle del lugar' })).toBeNull()
  })

  it('el botón Seguridad se prende y se apaga (RF-02)', () => {
    mostrar()
    const boton = screen.getByRole('button', { name: 'Seguridad' })

    expect(boton).toHaveAttribute('aria-pressed', 'false') // arranca en Turismo
    fireEvent.click(boton)
    expect(boton).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(boton)
    expect(boton).toHaveAttribute('aria-pressed', 'false')
  })

  it('cada capa muestra solo sus marcadores (RF-02)', async () => {
    mostrar()
    expect(await screen.findByTitle('Villa Nougués (Natural / paisaje)')).toBeInTheDocument()
    const boton = screen.getByRole('button', { name: 'Seguridad' })

    expect(await screen.findByTitle('Feria de artesanos (Feria)')).toBeInTheDocument()

    fireEvent.click(boton)
    expect(await screen.findByTitle('Robos, asaltos y entraderas')).toBeInTheDocument()
    expect(screen.getByTitle('Accidentes de tránsito')).toBeInTheDocument()
    expect(document.querySelectorAll('.marcador-lugar')).toHaveLength(0)
    expect(document.querySelectorAll('.marcador-evento')).toHaveLength(0)
    expect(document.querySelectorAll('.grupo-marcadores--turismo, .grupo-marcadores--mixto')).toHaveLength(0)

    fireEvent.click(boton)
    expect(await screen.findByTitle('Villa Nougués (Natural / paisaje)')).toBeInTheDocument()
    expect(document.querySelectorAll('.marcador-alerta')).toHaveLength(0)
  })

  it('al tocar una alerta muestra tipo, descripción, dirección y confirmaciones (RF-04)', async () => {
    mostrar()
    fireEvent.click(screen.getByRole('button', { name: 'Seguridad' }))

    fireEvent.click(await screen.findByTitle('Robos, asaltos y entraderas'))

    const globito = await screen.findByText('Arrebatos frecuentes en la parada')
    const popup = globito.closest('.leaflet-popup')
    expect(popup).toHaveTextContent('Robos, asaltos y entraderas')
    expect(popup).toHaveTextContent('Av. Mate de Luna 2400, Barrio Norte')
    expect(popup).toHaveTextContent('Confirmada por 4 vecinos')
  })

  it('el aviso legal se ve en las dos capas: corto en Turismo, completo en Seguridad (RF-04)', () => {
    mostrar()
    const turismo = screen.getByRole('complementary', { name: 'Aviso legal' })
    expect(turismo).toHaveTextContent('TucuMaps no es un servicio oficial.')
    expect(within(turismo).getByRole('link', { name: 'Términos' })).toHaveAttribute('href', '/terminos')
    expect(within(turismo).getByRole('link', { name: 'Privacidad' })).toHaveAttribute('href', '/privacidad')

    fireEvent.click(screen.getByRole('button', { name: 'Seguridad' }))
    const seguridad = screen.getByRole('complementary', { name: 'Aviso legal' })
    expect(seguridad).toHaveTextContent(
      'TucuMaps no es un servicio oficial y no reemplaza al 911. Las alertas las envían usuarios y no están verificadas.',
    )
    expect(within(seguridad).getByRole('link', { name: '911' })).toHaveAttribute('href', 'tel:911')
  })

  it('desde el aviso del mapa se llega a los Términos y de ahí a la Privacidad (RF-04)', async () => {
    mostrar()

    fireEvent.click(screen.getByRole('link', { name: 'Términos' }))
    expect(
      await screen.findByRole('heading', { level: 1, name: /Términos y Condiciones de Uso/ }),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('link', { name: 'Política de Privacidad' }))
    expect(await screen.findByRole('heading', { level: 1, name: /Política de Privacidad/ })).toBeInTheDocument()
  })

  it('al tocar un evento se abre su detalle (RF-02)', async () => {
    mostrar()

    fireEvent.click(await screen.findByTitle('Feria de artesanos (Feria)'))

    const panel = await screen.findByRole('complementary', { name: 'Detalle del evento' })
    expect(panel).toHaveTextContent('Feria de artesanos')
    expect(panel).toHaveTextContent('Gratuita')
    expect(panel).toHaveTextContent('Domingo 8 de noviembre, 10:00 hs')
    expect(panel).toHaveTextContent('Plaza Urquiza')
  })

  it('un evento en el mismo lugar que un sitio se puede separar tocando el grupo', async () => {
    mostrar()

    fireEvent.click(await screen.findByLabelText('2 lugares y eventos. Tocá para verlos.'))

    expect(await screen.findByTitle('Peña en el Parque (Música)')).toBeInTheDocument()
    expect(screen.getByTitle('Parque 9 de Julio (Recreativo)')).toBeInTheDocument()
  })

  it('con ?evento= abre el detalle de ese evento (Ver mapa de la agenda)', async () => {
    mostrar('/?evento=10')

    const panel = await screen.findByRole('complementary', { name: 'Detalle del evento' })
    expect(panel).toHaveTextContent('Feria de artesanos')
    expect(screen.getByRole('img', { name: 'Flyer de Feria de artesanos' })).toBeInTheDocument()
  })

  it('con ?evento= de un evento que ya no está, lo avisa y el aviso se puede cerrar (RF-12)', async () => {
    mostrar('/?evento=999')

    expect(await screen.findByText('Ese evento ya no está en la agenda.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar aviso' }))
    expect(screen.queryByText('Ese evento ya no está en la agenda.')).toBeNull()
  })

  it('el navbar del usuario anónimo tiene el logo y "Iniciar sesión" (todavía sin pantalla)', async () => {
    mostrar('/agenda')

    const navbar = screen.getByRole('banner')
    expect(within(navbar).getByRole('link', { name: 'TUCUMAPS' })).toHaveAttribute('href', '/')
    // Aparece cuando ya se sabe que no hay sesión.
    expect(await within(navbar).findByRole('button', { name: 'Iniciar sesión' })).toBeDisabled()
  })

  it('la barra inferior lleva a la agenda y vuelve al mapa', async () => {
    mostrar()

    fireEvent.click(screen.getByRole('link', { name: 'Agenda' }))
    expect(await screen.findByRole('heading', { name: 'Eventos próximos' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Agenda' })).toHaveAttribute('aria-current', 'page')

    fireEvent.click(screen.getByRole('link', { name: 'Mapa' }))
    expect(await screen.findByRole('button', { name: 'Seguridad' })).toBeInTheDocument()
  })

  it('al pasar a Seguridad se cierra el panel del lugar abierto', async () => {
    mostrar()
    fireEvent.click(await screen.findByTitle('Villa Nougués (Natural / paisaje)'))
    expect(await screen.findByRole('heading', { name: 'Villa Nougués' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Seguridad' }))

    expect(screen.queryByRole('complementary', { name: 'Detalle del lugar' })).toBeNull()
  })
})
