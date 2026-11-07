import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  bloquearUsuario,
  desbloquearUsuario,
  obtenerResumenAdmin,
  obtenerUsuariosAdmin,
} from '../api/admin.js'
import { obtenerSesion } from '../api/auth.js'
import Admin from '../pages/Admin.jsx'
import { ANA, mostrarConSesion } from '../test/conSesion.jsx'

vi.mock('../api/auth.js', () => ({ obtenerSesion: vi.fn() }))
vi.mock('../api/admin.js', () => ({
  POR_PAGINA: 20,
  obtenerResumenAdmin: vi.fn(),
  obtenerReportesAdmin: vi.fn(() => Promise.resolve({ datos: [], total: 0, por_pagina: 20 })),
  obtenerUsuariosAdmin: vi.fn(),
  bloquearUsuario: vi.fn(),
  desbloquearUsuario: vi.fn(),
}))

const ADMIN = { ...ANA, id: 1, nombre: 'Nacho', rol: 'admin' }
const VECINA = {
  id: 12,
  nombre: 'Ana Pérez',
  email: 'ana@mail.com',
  rol: 'ciudadano',
  email_verificado: true,
  bloqueado: false,
  creado_en: '2026-10-20T15:00:00.000Z',
  envios: 3,
  rechazos: 1,
}
const RESUMEN = { reportes_pendientes: 3, eventos_pendientes: 1, alertas_activas: 5, usuarios_bloqueados: 0 }

function lista(usuarios) {
  return { datos: usuarios, pagina: 1, por_pagina: 20, total: usuarios.length }
}

async function abrirUsuarios(usuarios = [VECINA]) {
  vi.mocked(obtenerUsuariosAdmin).mockResolvedValue(lista(usuarios))
  mostrarConSesion('/admin', <Admin />)
  fireEvent.click(await screen.findByRole('button', { name: 'Usuarios' }))
  return screen.findByRole('article')
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(obtenerSesion).mockResolvedValue(ADMIN)
  vi.mocked(obtenerResumenAdmin).mockResolvedValue(RESUMEN)
})

describe('Admin: resumen (RF-15)', () => {
  it('si falla al actualizarse, quedan los últimos contadores', async () => {
    vi.mocked(bloquearUsuario).mockResolvedValue({ ...VECINA, bloqueado: true })
    const tarjeta = await abrirUsuarios()
    await screen.findByRole('list', { name: 'Resumen' })

    vi.mocked(obtenerResumenAdmin).mockRejectedValue({ codigo: 'ERROR_SERVIDOR', mensaje: 'x' })
    fireEvent.click(within(tarjeta).getByRole('button', { name: 'Bloquear' }))
    fireEvent.click(within(tarjeta).getByRole('button', { name: 'Sí, bloquear' }))
    await screen.findByRole('status')
    await waitFor(() => expect(obtenerResumenAdmin.mock.calls.length).toBeGreaterThan(1))

    expect(screen.getByRole('list', { name: 'Resumen' })).toHaveTextContent('3Reportes pendientes')
  })

  it('muestra los cuatro contadores', async () => {
    mostrarConSesion('/admin', <Admin />)

    const resumen = await screen.findByRole('list', { name: 'Resumen' })
    expect(resumen).toHaveTextContent('3Reportes pendientes')
    expect(resumen).toHaveTextContent('1Eventos pendientes')
    expect(resumen).toHaveTextContent('5Alertas activas')
    expect(resumen).toHaveTextContent('0Usuarios bloqueados')
  })

  it('tocar un contador lleva a su pestaña', async () => {
    vi.mocked(obtenerUsuariosAdmin).mockResolvedValue(lista([VECINA]))
    mostrarConSesion('/admin', <Admin />)

    fireEvent.click(await screen.findByRole('button', { name: /Usuarios bloqueados/ }))

    expect(await screen.findByRole('article')).toHaveTextContent('Ana Pérez')
    expect(screen.getByRole('button', { name: 'Usuarios' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('si no se puede pedir, no se muestra y el panel sigue andando', async () => {
    vi.mocked(obtenerResumenAdmin).mockRejectedValue({ codigo: 'ERROR_SERVIDOR', mensaje: 'x' })
    mostrarConSesion('/admin', <Admin />)

    expect(await screen.findByRole('button', { name: 'Reportes' })).toBeInTheDocument()
    await waitFor(() => expect(obtenerResumenAdmin).toHaveBeenCalled())
    expect(screen.queryByRole('list', { name: 'Resumen' })).toBeNull()
  })
})

describe('Admin: usuarios (RF-16)', () => {
  it('cambiar el estado aplica también lo que está escrito en la búsqueda', async () => {
    await abrirUsuarios()

    fireEvent.change(screen.getByLabelText('Buscar por nombre o email'), { target: { value: 'pedro' } })
    fireEvent.change(screen.getByLabelText('Estado'), { target: { value: 'true' } })

    expect(obtenerUsuariosAdmin).toHaveBeenLastCalledWith({ q: 'pedro', bloqueado: 'true' }, 1)
  })

  it('si bloquear falla sin conexión, la pregunta queda abierta para reintentar', async () => {
    vi.mocked(bloquearUsuario).mockRejectedValue({ codigo: 'SIN_CONEXION', mensaje: 'No pudimos conectarnos.' })
    const tarjeta = await abrirUsuarios()

    fireEvent.click(within(tarjeta).getByRole('button', { name: 'Bloquear' }))
    fireEvent.click(within(tarjeta).getByRole('button', { name: 'Sí, bloquear' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos conectarnos.')
    expect(await within(tarjeta).findByRole('button', { name: 'Sí, bloquear' })).toBeEnabled()
  })

  it('muestra los datos de cada usuario', async () => {
    const tarjeta = await abrirUsuarios()

    expect(tarjeta).toHaveTextContent('Ana Pérez')
    expect(tarjeta).toHaveTextContent('ana@mail.com')
    expect(tarjeta).toHaveTextContent('3 envíos · 1 rechazo')
    expect(tarjeta).toHaveTextContent('Email verificado')
    expect(obtenerUsuariosAdmin).toHaveBeenCalledWith({ q: '', bloqueado: '' }, 1)
  })

  it('la búsqueda y el estado se mandan a la API', async () => {
    await abrirUsuarios()

    fireEvent.change(screen.getByLabelText('Buscar por nombre o email'), { target: { value: '  ana ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Buscar' }))
    expect(obtenerUsuariosAdmin).toHaveBeenLastCalledWith({ q: 'ana', bloqueado: '' }, 1)

    fireEvent.change(screen.getByLabelText('Estado'), { target: { value: 'true' } })
    expect(obtenerUsuariosAdmin).toHaveBeenLastCalledWith({ q: 'ana', bloqueado: 'true' }, 1)
  })

  it('bloquear pide confirmación, avisa que los pendientes se rechazan y actualiza los contadores', async () => {
    vi.mocked(bloquearUsuario).mockResolvedValue({ ...VECINA, bloqueado: true })
    const tarjeta = await abrirUsuarios()
    await screen.findByRole('list', { name: 'Resumen' })
    const pedidosDelResumen = vi.mocked(obtenerResumenAdmin).mock.calls.length

    fireEvent.click(within(tarjeta).getByRole('button', { name: 'Bloquear' }))
    expect(tarjeta).toHaveTextContent('Sus reportes y eventos pendientes se van a rechazar')
    expect(bloquearUsuario).not.toHaveBeenCalled()

    vi.mocked(obtenerUsuariosAdmin).mockResolvedValue(lista([{ ...VECINA, bloqueado: true }]))
    fireEvent.click(within(tarjeta).getByRole('button', { name: 'Sí, bloquear' }))

    expect(await screen.findByRole('status')).toHaveTextContent('Se bloqueó a Ana Pérez.')
    expect(bloquearUsuario).toHaveBeenCalledWith(12)
    expect(await screen.findByRole('button', { name: 'Desbloquear' })).toBeInTheDocument()
    await waitFor(() => expect(obtenerResumenAdmin.mock.calls.length).toBeGreaterThan(pedidosDelResumen))
  })

  it('desbloquear pide confirmación y avisa que lo rechazado no se reabre', async () => {
    vi.mocked(desbloquearUsuario).mockResolvedValue(VECINA)
    const tarjeta = await abrirUsuarios([{ ...VECINA, bloqueado: true }])

    fireEvent.click(within(tarjeta).getByRole('button', { name: 'Desbloquear' }))
    expect(tarjeta).toHaveTextContent('Lo que se le rechazó no se reabre.')

    fireEvent.click(within(tarjeta).getByRole('button', { name: 'Sí, desbloquear' }))

    expect(await screen.findByRole('status')).toHaveTextContent('Se desbloqueó a Ana Pérez.')
    expect(desbloquearUsuario).toHaveBeenCalledWith(12)
  })

  it('bloquearse a uno mismo muestra el mensaje de la API (409)', async () => {
    vi.mocked(bloquearUsuario).mockRejectedValue({
      codigo: 'TRANSICION_INVALIDA',
      mensaje: 'No podés bloquearte a vos mismo.',
    })
    const tarjeta = await abrirUsuarios([{ ...VECINA, id: 1, nombre: 'Nacho', rol: 'admin' }])
    expect(tarjeta).toHaveTextContent('(tu cuenta)')

    fireEvent.click(within(tarjeta).getByRole('button', { name: 'Bloquear' }))
    fireEvent.click(within(tarjeta).getByRole('button', { name: 'Sí, bloquear' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('No podés bloquearte a vos mismo.')
  })
})
