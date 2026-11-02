import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { obtenerSesion } from '../api/auth.js'
import { proponerEvento } from '../api/eventos.js'
import { obtenerLugares } from '../api/lugares.js'
import { ahoraEnTucuman } from '../components/fechas.js'
import { ANA, mostrarConSesion } from '../test/conSesion.jsx'
import ProponerEvento from './ProponerEvento.jsx'

vi.mock('../api/auth.js', () => ({ obtenerSesion: vi.fn() }))
vi.mock('../api/eventos.js', () => ({ proponerEvento: vi.fn() }))
vi.mock('../api/lugares.js', () => ({ obtenerLugares: vi.fn() }))
// El mapa real no se puede tocar en jsdom: un botón marca el punto (ElegirUbicacion tiene sus pruebas).
vi.mock('../components/ElegirUbicacion.jsx', () => ({
  default: ({ valor, onCambiar, error }) => (
    <div>
      <button type="button" onClick={() => onCambiar({ lat: -26.83, lng: -65.2 })}>
        marcar punto
      </button>
      {valor && <p>punto en {`${valor.lat}, ${valor.lng}`}</p>}
      {error && <p>{error}</p>}
    </div>
  ),
}))

const CASA_HISTORICA = {
  id: 2,
  nombre: 'Casa Histórica de la Independencia',
  direccion: 'Congreso 151',
  barrio: 'Centro',
  lat: -26.833132,
  lng: -65.203841,
}
const DIA_MS = 24 * 60 * 60 * 1000
const PASADO_MANIANA = ahoraEnTucuman(Date.now() + 2 * DIA_MS).slice(0, 11) + '20:00'

function escribir(etiqueta, valor) {
  fireEvent.change(screen.getByLabelText(etiqueta), { target: { value: valor } })
}

async function completar() {
  await screen.findByLabelText('Nombre')
  escribir('Nombre', 'Peña en el Parque')
  escribir('Categoría', 'musica')
  escribir('Modalidad', 'a_la_gorra')
  escribir('Descripción', 'Peña folclórica abierta a todos')
  escribir('Empieza', PASADO_MANIANA)
  escribir('Nombre del lugar', 'Anfiteatro del Parque')
  escribir('Dirección', 'Av. Soldati s/n')
  escribir('Barrio', 'Parque 9 de Julio')
  fireEvent.click(screen.getByRole('button', { name: 'marcar punto' }))
}

function enviar() {
  fireEvent.click(screen.getByRole('button', { name: 'Proponer evento' }))
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(obtenerSesion).mockResolvedValue(ANA)
  vi.mocked(obtenerLugares).mockResolvedValue([CASA_HISTORICA])
})

describe('ProponerEvento (RF-07, RF-09, RF-10)', () => {
  it('manda la propuesta con la fecha en hora de Tucumán y avisa que queda pendiente', async () => {
    vi.mocked(proponerEvento).mockResolvedValue({ id: 9, estado: 'pendiente' })
    mostrarConSesion('/proponer-evento', <ProponerEvento />)

    await completar()
    escribir('Etiquetas', ' folclore, familia ,, ')
    enviar()

    expect(await screen.findByRole('status')).toHaveTextContent(
      'pendiente de revisión. No va a aparecer en el mapa ni en la agenda hasta que un administrador lo apruebe',
    )
    expect(proponerEvento).toHaveBeenCalledWith({
      nombre: 'Peña en el Parque',
      categoria: 'musica',
      modalidad: 'a_la_gorra',
      descripcion: 'Peña folclórica abierta a todos',
      lugar_nombre: 'Anfiteatro del Parque',
      direccion: 'Av. Soldati s/n',
      barrio: 'Parque 9 de Julio',
      lugar_id: null,
      lat: -26.83,
      lng: -65.2,
      inicio: `${PASADO_MANIANA}:00-03:00`,
      fin: null,
      flyer_url: '',
      etiquetas: ['folclore', 'familia'],
    })
  })

  it('elegir un lugar del mapa completa nombre, dirección, barrio y punto, y manda su id', async () => {
    vi.mocked(proponerEvento).mockResolvedValue({ id: 9, estado: 'pendiente' })
    mostrarConSesion('/proponer-evento', <ProponerEvento />)

    await completar()
    await screen.findByRole('option', { name: CASA_HISTORICA.nombre })
    escribir('Lugar del mapa (opcional)', '2')

    expect(screen.getByLabelText('Nombre del lugar')).toHaveValue(CASA_HISTORICA.nombre)
    expect(screen.getByLabelText('Dirección')).toHaveValue('Congreso 151')
    expect(screen.getByLabelText('Barrio')).toHaveValue('Centro')
    expect(screen.getByText('punto en -26.833132, -65.203841')).toBeInTheDocument()

    enviar()
    await screen.findByRole('status')
    expect(proponerEvento).toHaveBeenCalledWith(
      expect.objectContaining({ lugar_id: 2, lat: -26.833132, lng: -65.203841, barrio: 'Centro' }),
    )
  })

  it('antes de enviar revisa lo obligatorio, las fechas y las etiquetas', async () => {
    mostrarConSesion('/proponer-evento', <ProponerEvento />)
    await screen.findByLabelText('Nombre')

    escribir('Empieza', '2020-01-01T10:00')
    escribir('Etiquetas', 'a, b, c, d, e, f')
    enviar()

    expect(screen.getByLabelText('Nombre')).toHaveAccessibleDescription('El nombre debe tener al menos 3 caracteres')
    expect(screen.getByLabelText('Categoría')).toHaveAccessibleDescription('Elegí una categoría')
    expect(screen.getByLabelText('Empieza')).toHaveAccessibleDescription('El evento tiene que empezar en el futuro')
    expect(screen.getByText('Podés poner hasta 5 etiquetas')).toBeInTheDocument()
    expect(screen.getByText('Marcá en el mapa dónde es')).toBeInTheDocument()
    expect(proponerEvento).not.toHaveBeenCalled()
  })

  it('el fin tiene que ser posterior al inicio', async () => {
    mostrarConSesion('/proponer-evento', <ProponerEvento />)

    await completar()
    escribir('Termina (opcional)', PASADO_MANIANA.slice(0, 11) + '18:00')
    enviar()

    expect(screen.getByLabelText('Termina (opcional)')).toHaveAccessibleDescription(
      'El fin tiene que ser posterior al inicio',
    )
    expect(proponerEvento).not.toHaveBeenCalled()
  })

  it('un error de la API en una etiqueta va debajo de Etiquetas; el 429, arriba (RF-09)', async () => {
    vi.mocked(proponerEvento)
      .mockRejectedValueOnce({
        codigo: 'DATOS_INVALIDOS',
        mensaje: 'Revisá los datos ingresados.',
        detalles: [{ campo: 'etiquetas.1', mensaje: 'Cada etiqueta tiene caracteres no permitidos' }],
      })
      .mockRejectedValueOnce({ codigo: 'LIMITE_DIARIO', mensaje: 'Llegaste al límite de 3 propuestas por día.' })
    mostrarConSesion('/proponer-evento', <ProponerEvento />)

    await completar()
    enviar()
    expect(await screen.findByText('Cada etiqueta tiene caracteres no permitidos')).toBeInTheDocument()

    enviar()
    expect(await screen.findByRole('alert')).toHaveTextContent('Llegaste al límite de 3 propuestas por día.')
  })

  it('sin sesión avisa que hay que iniciarla', async () => {
    vi.mocked(obtenerSesion).mockResolvedValue(null)
    mostrarConSesion('/proponer-evento', <ProponerEvento />)

    expect(await screen.findByText('Para proponer un evento tenés que iniciar sesión.')).toBeInTheDocument()
  })
})
