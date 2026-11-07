import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { crearEventoAdmin, editarEventoAdmin } from '../api/admin.js'
import { obtenerSesion } from '../api/auth.js'
import { obtenerLugares } from '../api/lugares.js'
import { ahoraEnTucuman } from '../components/fechas.js'
import { ANA, mostrarConSesion } from '../test/conSesion.jsx'
import AdminEvento from './AdminEvento.jsx'

vi.mock('../api/auth.js', () => ({ obtenerSesion: vi.fn() }))
vi.mock('../api/admin.js', () => ({ crearEventoAdmin: vi.fn(), editarEventoAdmin: vi.fn() }))
vi.mock('../api/lugares.js', () => ({ obtenerLugares: vi.fn() }))
// El mapa real no se puede tocar en jsdom: un botón marca el punto (ElegirUbicacion tiene sus pruebas).
vi.mock('../components/ElegirUbicacion.jsx', () => ({
  default: ({ onCambiar }) => (
    <button type="button" onClick={() => onCambiar({ lat: -26.83, lng: -65.2 })}>
      marcar punto
    </button>
  ),
}))

const DIA_MS = 24 * 60 * 60 * 1000
const PUBLICADO = {
  id: 9,
  nombre: 'Feria de varios días',
  categoria: 'feria',
  modalidad: 'gratuita',
  descripcion: 'Feria abierta durante toda la semana',
  lugar_nombre: 'Plaza Independencia',
  direccion: '25 de Mayo 90',
  barrio: 'Centro',
  lugar_id: null,
  lat: -26.83,
  lng: -65.2,
  inicio: new Date(Date.now() - DIA_MS).toISOString(), // ya empezó
  fin: null,
  flyer_url: null,
  etiquetas: [],
  estado: 'aprobado',
}

function escribir(etiqueta, valor) {
  fireEvent.change(screen.getByLabelText(etiqueta), { target: { value: valor } })
}

function mostrarEditando() {
  mostrarConSesion({ pathname: '/admin/evento', state: { editar: PUBLICADO } }, <AdminEvento />, '/admin/evento')
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(obtenerSesion).mockResolvedValue({ ...ANA, rol: 'admin' })
  vi.mocked(obtenerLugares).mockResolvedValue([])
})

describe('AdminEvento (RF-13)', () => {
  it('un ciudadano ve un aviso y no el formulario', async () => {
    vi.mocked(obtenerSesion).mockResolvedValue(ANA)
    mostrarConSesion('/admin/evento', <AdminEvento />)

    expect(await screen.findByRole('alert')).toHaveTextContent('No tenés permiso')
    expect(screen.queryByRole('button', { name: 'Crear evento' })).toBeNull()
  })

  it('crear manda POST y avisa que ya se publicó', async () => {
    vi.mocked(crearEventoAdmin).mockResolvedValue({ id: 10, estado: 'aprobado' })
    mostrarConSesion('/admin/evento', <AdminEvento />)

    await screen.findByRole('heading', { name: 'Crear evento' })
    escribir('Nombre', 'Peña en el Parque')
    escribir('Categoría', 'musica')
    escribir('Modalidad', 'gratuita')
    escribir('Descripción', 'Peña folclórica abierta a todos')
    escribir('Empieza', ahoraEnTucuman(Date.now() + 2 * DIA_MS))
    escribir('Nombre del lugar', 'Anfiteatro')
    escribir('Dirección', 'Av. Soldati s/n')
    escribir('Barrio', 'Parque 9 de Julio')
    fireEvent.click(screen.getByRole('button', { name: 'marcar punto' }))
    fireEvent.click(screen.getByRole('button', { name: 'Crear evento' }))

    expect(await screen.findByRole('status')).toHaveTextContent('Ya se ve en el mapa y en la agenda.')
    expect(crearEventoAdmin).toHaveBeenCalledWith(expect.objectContaining({ nombre: 'Peña en el Parque' }))
    expect(screen.getByRole('link', { name: 'Volver al panel' })).toHaveAttribute('href', '/admin?pestana=eventos')
  })

  it('un publicado que ya empezó se puede guardar con su mismo inicio', async () => {
    vi.mocked(editarEventoAdmin).mockResolvedValue(PUBLICADO)
    mostrarEditando()

    await screen.findByRole('heading', { name: 'Editar evento' })
    escribir('Descripción', 'Feria abierta durante toda la semana, con música')
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(await screen.findByRole('status')).toHaveTextContent('El evento quedó actualizado.')
    expect(editarEventoAdmin).toHaveBeenCalledWith(
      9,
      expect.objectContaining({ descripcion: 'Feria abierta durante toda la semana, con música' }),
    )
  })

  it('si su lugar se desactivó, se guarda sin ese lugar', async () => {
    vi.mocked(editarEventoAdmin).mockResolvedValue(PUBLICADO)
    const editar = { ...PUBLICADO, lugar_id: 7 }
    mostrarConSesion({ pathname: '/admin/evento', state: { editar } }, <AdminEvento />, '/admin/evento')

    await screen.findByRole('heading', { name: 'Editar evento' })
    await waitFor(() => expect(obtenerLugares).toHaveBeenCalled())
    await act(async () => {})
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    await screen.findByRole('status')
    expect(editarEventoAdmin).toHaveBeenCalledWith(9, expect.objectContaining({ lugar_id: null }))
  })

  it('un pendiente cuyo inicio ya pasó no se guarda: solo un publicado puede', async () => {
    const editar = { ...PUBLICADO, estado: 'pendiente' }
    mostrarConSesion({ pathname: '/admin/evento', state: { editar } }, <AdminEvento />, '/admin/evento')

    await screen.findByRole('heading', { name: 'Editar evento' })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(screen.getByLabelText('Empieza')).toHaveAccessibleDescription('El evento tiene que empezar en el futuro')
    expect(editarEventoAdmin).not.toHaveBeenCalled()
  })

  it('pero un inicio nuevo en el pasado no', async () => {
    mostrarEditando()

    await screen.findByRole('heading', { name: 'Editar evento' })
    escribir('Empieza', '2020-01-01T10:00')
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(screen.getByLabelText('Empieza')).toHaveAccessibleDescription('El evento tiene que empezar en el futuro')
    expect(editarEventoAdmin).not.toHaveBeenCalled()
  })
})
