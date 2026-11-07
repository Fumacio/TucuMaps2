import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { aprobarEvento, obtenerEventosAdmin } from '../api/admin.js'
import { obtenerSesion } from '../api/auth.js'
import Admin from '../pages/Admin.jsx'
import { ANA, mostrarConSesion } from '../test/conSesion.jsx'

vi.mock('../api/auth.js', () => ({ obtenerSesion: vi.fn() }))
vi.mock('../api/admin.js', () => ({
  POR_PAGINA: 20,
  obtenerReportesAdmin: vi.fn(() => Promise.resolve({ datos: [], total: 0 })),
  obtenerEventosAdmin: vi.fn(),
  aprobarEvento: vi.fn(),
  rechazarEvento: vi.fn(),
  retirarEvento: vi.fn(),
}))

const EVENTO = {
  id: 9,
  nombre: 'Peña en el Parque',
  categoria: 'musica',
  modalidad: 'a_la_gorra',
  descripcion: 'Peña folclórica abierta',
  lugar_nombre: 'Anfiteatro del Parque',
  direccion: 'Av. Soldati s/n',
  barrio: 'Parque 9 de Julio',
  lat: -26.8317,
  lng: -65.1876,
  inicio: '2026-11-07T23:00:00.000Z',
  fin: null,
  flyer_url: null,
  etiquetas: ['folclore'],
  estado: 'pendiente',
  archivado: false,
  autor: { id: 12, nombre: 'Ana Pérez' },
  creado_en: '2026-11-01T15:00:00.000Z',
  motivo_rechazo: null,
}

async function abrirEventos(eventos) {
  vi.mocked(obtenerEventosAdmin).mockResolvedValue({ datos: eventos, total: eventos.length })
  mostrarConSesion('/admin', <Admin />)
  fireEvent.click(await screen.findByRole('button', { name: 'Eventos' }))
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(obtenerSesion).mockResolvedValue({ ...ANA, rol: 'admin' })
})

describe('Admin: cola de eventos (RF-08, RF-12, RF-13, RF-15)', () => {
  it('la pestaña Eventos arranca en los pendientes y ofrece crear uno', async () => {
    await abrirEventos([EVENTO])

    const tarjeta = await screen.findByRole('article')
    expect(obtenerEventosAdmin).toHaveBeenCalledWith({ estado: 'pendiente', categoria: '', archivado: '' }, 1)
    expect(tarjeta).toHaveTextContent('Peña en el Parque')
    expect(tarjeta).toHaveTextContent('Música · A la gorra')
    expect(screen.getByRole('link', { name: 'Crear evento' })).toHaveAttribute('href', '/admin/evento')
    expect(within(tarjeta).getByRole('link', { name: 'Editar' })).toHaveAttribute('href', '/admin/evento')
  })

  it('aprobar avisa y vuelve a pedir la página, que ya no lo trae', async () => {
    vi.mocked(aprobarEvento).mockResolvedValue({ ...EVENTO, estado: 'aprobado' })
    const feria = { ...EVENTO, id: 10, nombre: 'Feria' }
    await abrirEventos([EVENTO, feria])

    const tarjeta = (await screen.findAllByRole('article'))[0]
    vi.mocked(obtenerEventosAdmin).mockResolvedValue({ datos: [feria], total: 1 })
    fireEvent.click(within(tarjeta).getByRole('button', { name: 'Aprobar' }))

    expect(await screen.findByRole('status')).toHaveTextContent('Evento aprobado')
    expect(aprobarEvento).toHaveBeenCalledWith(9)
    await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(1))
  })

  it('una propuesta archivada solo se puede rechazar, y no se edita', async () => {
    await abrirEventos([{ ...EVENTO, archivado: true }])

    const tarjeta = await screen.findByRole('article')
    expect(tarjeta).toHaveTextContent('Archivado')
    expect(within(tarjeta).queryByRole('button', { name: 'Aprobar' })).toBeNull()
    expect(within(tarjeta).getByRole('button', { name: 'Rechazar' })).toBeInTheDocument()
    expect(within(tarjeta).queryByRole('link', { name: 'Editar' })).toBeNull()
  })

  it('un publicado se puede retirar o editar; uno rechazado no tiene acciones', async () => {
    await abrirEventos([
      { ...EVENTO, estado: 'aprobado' },
      { ...EVENTO, id: 10, estado: 'rechazado', motivo_rechazo: 'Falta el horario' },
    ])

    const [publicado, rechazado] = await screen.findAllByRole('article')
    expect(within(publicado).getByRole('button', { name: 'Retirar' })).toBeInTheDocument()
    expect(within(publicado).getByRole('link', { name: 'Editar' })).toBeInTheDocument()
    expect(within(rechazado).queryByRole('button')).toBeNull()
    expect(within(rechazado).queryByRole('link', { name: 'Editar' })).toBeNull()
    expect(rechazado).toHaveTextContent('Falta el horario')
  })

  it('el flyer solo se enlaza si es http o https', async () => {
    await abrirEventos([
      { ...EVENTO, flyer_url: 'https://ejemplo.com/flyer.jpg' },
      { ...EVENTO, id: 10, flyer_url: 'javascript:alert(1)' },
    ])

    const [conFlyer, raro] = await screen.findAllByRole('article')
    expect(within(conFlyer).getByRole('link', { name: 'Ver el flyer' })).toHaveAttribute(
      'href',
      'https://ejemplo.com/flyer.jpg',
    )
    expect(within(raro).queryByRole('link', { name: 'Ver el flyer' })).toBeNull()
  })
})
