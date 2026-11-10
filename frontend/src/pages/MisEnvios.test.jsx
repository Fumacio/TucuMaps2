import { fireEvent, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { obtenerSesion } from '../api/auth.js'
import { obtenerMisEnvios } from '../api/envios.js'
import { cancelarEvento } from '../api/eventos.js'
import { ANA, mostrarConSesion } from '../test/conSesion.jsx'
import MisEnvios from './MisEnvios.jsx'

vi.mock('../api/auth.js', () => ({ obtenerSesion: vi.fn() }))
vi.mock('../api/envios.js', () => ({ obtenerMisEnvios: vi.fn() }))
vi.mock('../api/eventos.js', () => ({ cancelarEvento: vi.fn() }))
vi.mock('../api/reportes.js', () => ({ cancelarReporte: vi.fn() }))

const REPORTE_RECHAZADO = {
  tipo: 'reporte',
  id: 45,
  estado: 'rechazado',
  motivo_rechazo: 'Falta la dirección',
  creado_en: '2026-10-20T15:00:00.000Z',
  actualizado_en: '2026-10-20T16:10:00.000Z',
  contenido: {
    tipo: 'riesgo_comunitario',
    descripcion: 'Cuadra entera sin luz desde hace una semana',
    direccion: null,
    barrio: 'Centro',
    lat: -26.83,
    lng: -65.215,
  },
}
const EVENTO_PENDIENTE = {
  tipo: 'evento',
  id: 9,
  estado: 'pendiente',
  motivo_rechazo: null,
  creado_en: '2026-10-21T15:00:00.000Z',
  actualizado_en: '2026-10-21T15:00:00.000Z',
  contenido: {
    nombre: 'Peña en el Parque',
    categoria: 'musica',
    modalidad: 'a_la_gorra',
    descripcion: 'Peña folclórica abierta',
    lugar_nombre: 'Anfiteatro del Parque 9 de Julio',
    inicio: '2026-11-07T23:00:00.000Z',
  },
}

function pagina(datos, total = datos.length, numero = 1) {
  return { datos, pagina: numero, por_pagina: 20, total }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(obtenerSesion).mockResolvedValue(ANA)
})

describe('MisEnvios (RF-07, RF-08)', () => {
  it('muestra cada envío con su estado con nombre claro y el motivo del rechazo', async () => {
    vi.mocked(obtenerMisEnvios).mockResolvedValue(pagina([EVENTO_PENDIENTE, REPORTE_RECHAZADO]))
    mostrarConSesion('/mis-aportes', <MisEnvios />)

    const [evento, reporte] = await screen.findAllByRole('article')
    expect(evento).toHaveTextContent('Peña en el Parque')
    expect(evento).toHaveTextContent('Música · Sáb 7 nov · 20:00 · Anfiteatro del Parque 9 de Julio')
    expect(evento).toHaveTextContent('Pendiente de revisión')
    expect(reporte).toHaveTextContent('Defensa civil y riesgos comunitarios')
    expect(reporte).toHaveTextContent('Rechazado')
    expect(reporte).toHaveTextContent('Motivo: Falta la dirección')
    expect(within(evento).queryByText(/Motivo/)).toBeNull()
  })

  it('el filtro pide solo reportes o solo eventos', async () => {
    vi.mocked(obtenerMisEnvios).mockResolvedValue(pagina([EVENTO_PENDIENTE, REPORTE_RECHAZADO]))
    mostrarConSesion('/mis-aportes', <MisEnvios />)
    await screen.findAllByRole('article')

    vi.mocked(obtenerMisEnvios).mockResolvedValue(pagina([REPORTE_RECHAZADO]))
    fireEvent.click(screen.getByRole('button', { name: 'Reportes' }))

    expect(screen.getByRole('button', { name: 'Reportes' })).toHaveAttribute('aria-pressed', 'true')
    expect(await screen.findAllByRole('article')).toHaveLength(1)
    expect(obtenerMisEnvios).toHaveBeenLastCalledWith({ tipo: 'reporte', pagina: 1 })
  })

  it('"Ver más" trae la página siguiente y la suma a la lista', async () => {
    vi.mocked(obtenerMisEnvios)
      .mockResolvedValueOnce(pagina([EVENTO_PENDIENTE], 2))
      .mockResolvedValueOnce(pagina([REPORTE_RECHAZADO], 2, 2))
    mostrarConSesion('/mis-aportes', <MisEnvios />)

    fireEvent.click(await screen.findByRole('button', { name: 'Ver más' }))

    expect(await screen.findByText('Defensa civil y riesgos comunitarios')).toBeInTheDocument()
    expect(screen.getAllByRole('article')).toHaveLength(2)
    expect(obtenerMisEnvios).toHaveBeenLastCalledWith({ tipo: '', pagina: 2 })
    expect(screen.queryByRole('button', { name: 'Ver más' })).toBeNull()
  })

  it('si entre página y página se mandó algo, "Ver más" no repite el que ya estaba', async () => {
    vi.mocked(obtenerMisEnvios)
      .mockResolvedValueOnce(pagina([EVENTO_PENDIENTE], 3))
      .mockResolvedValueOnce(pagina([EVENTO_PENDIENTE, REPORTE_RECHAZADO], 3, 2))
    mostrarConSesion('/mis-aportes', <MisEnvios />)

    fireEvent.click(await screen.findByRole('button', { name: 'Ver más' }))

    expect(await screen.findByText('Defensa civil y riesgos comunitarios')).toBeInTheDocument()
    expect(screen.getAllByRole('article')).toHaveLength(2)
  })

  it('sin envíos lo dice y ofrece enviar uno', async () => {
    vi.mocked(obtenerMisEnvios).mockResolvedValue(pagina([]))
    mostrarConSesion('/mis-aportes', <MisEnvios />)

    expect(await screen.findByText('Todavía no enviaste nada.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Enviar reporte' })).toHaveAttribute('href', '/reportar')
  })

  it('si la API falla, muestra el error con Reintentar (RF-06)', async () => {
    vi.mocked(obtenerMisEnvios)
      .mockRejectedValueOnce({ codigo: 'ERROR_SERVIDOR', mensaje: 'El servidor no está respondiendo.' })
      .mockResolvedValue(pagina([EVENTO_PENDIENTE]))
    mostrarConSesion('/mis-aportes', <MisEnvios />)

    fireEvent.click(await screen.findByRole('button', { name: 'Reintentar' }))

    expect(await screen.findAllByRole('article')).toHaveLength(1)
  })

  it('Editar y Cancelar solo aparecen en los pendientes (RF-07)', async () => {
    vi.mocked(obtenerMisEnvios).mockResolvedValue(pagina([EVENTO_PENDIENTE, REPORTE_RECHAZADO]))
    mostrarConSesion('/mis-aportes', <MisEnvios />)

    const [evento, reporte] = await screen.findAllByRole('article')
    expect(within(evento).getByRole('link', { name: 'Editar' })).toHaveAttribute('href', '/proponer-evento')
    expect(within(evento).getByRole('button', { name: 'Cancelar' })).toBeInTheDocument()
    expect(within(reporte).queryByRole('link', { name: 'Editar' })).toBeNull()
    expect(within(reporte).queryByRole('button', { name: 'Cancelar' })).toBeNull()
  })

  it('Cancelar pide confirmación y deja el envío como Cancelado', async () => {
    vi.mocked(obtenerMisEnvios).mockResolvedValue(pagina([EVENTO_PENDIENTE]))
    vi.mocked(cancelarEvento).mockResolvedValue({ id: 9, estado: 'cancelado' })
    mostrarConSesion('/mis-aportes', <MisEnvios />)

    const tarjeta = await screen.findByRole('article')
    fireEvent.click(within(tarjeta).getByRole('button', { name: 'Cancelar' }))
    expect(within(tarjeta).getByText('¿Cancelar esta propuesta? No se puede deshacer.')).toBeInTheDocument()
    expect(cancelarEvento).not.toHaveBeenCalled()

    fireEvent.click(within(tarjeta).getByRole('button', { name: 'Sí, cancelar' }))

    expect(await within(tarjeta).findByText('Cancelado')).toBeInTheDocument()
    expect(cancelarEvento).toHaveBeenCalledWith(9)
    expect(within(tarjeta).queryByRole('link', { name: 'Editar' })).toBeNull()
  })

  it('si un administrador ya lo revisó (409), vuelve a pedir la lista y muestra el estado real', async () => {
    vi.mocked(obtenerMisEnvios)
      .mockResolvedValueOnce(pagina([EVENTO_PENDIENTE]))
      .mockResolvedValue(pagina([{ ...EVENTO_PENDIENTE, estado: 'rechazado', motivo_rechazo: 'Falta el horario' }]))
    vi.mocked(cancelarEvento).mockRejectedValue({
      codigo: 'TRANSICION_INVALIDA',
      mensaje: 'Esta propuesta ya no está pendiente.',
    })
    mostrarConSesion('/mis-aportes', <MisEnvios />)

    const tarjeta = await screen.findByRole('article')
    fireEvent.click(within(tarjeta).getByRole('button', { name: 'Cancelar' }))
    fireEvent.click(within(tarjeta).getByRole('button', { name: 'Sí, cancelar' }))

    expect(await screen.findByText('Falta el horario', { exact: false })).toBeInTheDocument()
    expect(screen.getByText('Rechazado')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cancelar' })).toBeNull()
  })

  it('sin sesión lleva al login', async () => {
    vi.mocked(obtenerSesion).mockResolvedValue(null)
    mostrarConSesion('/mis-aportes', <MisEnvios />)

    expect(await screen.findByText('pantalla del login')).toBeInTheDocument()
  })
})
