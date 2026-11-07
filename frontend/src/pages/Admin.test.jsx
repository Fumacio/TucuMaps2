import { fireEvent, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  aprobarReporte,
  obtenerReportesAdmin,
  rechazarReporte,
  resolverReporte,
  retirarReporte,
} from '../api/admin.js'
import { obtenerSesion } from '../api/auth.js'
import { ANA, mostrarConSesion } from '../test/conSesion.jsx'
import Admin from './Admin.jsx'

vi.mock('../api/auth.js', () => ({ obtenerSesion: vi.fn() }))
vi.mock('../api/admin.js', () => ({
  POR_PAGINA: 20,
  obtenerReportesAdmin: vi.fn(),
  aprobarReporte: vi.fn(),
  rechazarReporte: vi.fn(),
  resolverReporte: vi.fn(),
  retirarReporte: vi.fn(),
}))

const ADMIN = { ...ANA, rol: 'admin' }
const REPORTE = {
  id: 45,
  tipo: 'robo_asalto',
  descripcion: 'Arrebatos frecuentes en la parada',
  direccion: 'Av. Mate de Luna 2400',
  barrio: 'Barrio Norte',
  lat: -26.8235,
  lng: -65.2301,
  estado: 'pendiente',
  activa: false,
  autor: { id: 12, nombre: 'Ana Pérez' },
  confirmaciones: 0,
  creado_en: '2026-11-01T15:00:00.000Z',
  motivo_rechazo: null,
}
const OTRO = { ...REPORTE, id: 46, descripcion: 'Otro reporte de la cola' }

function pagina(datos, total = datos.length) {
  return { datos, pagina: 1, por_pagina: 20, total }
}

function mostrar() {
  return mostrarConSesion('/admin', <Admin />)
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(obtenerSesion).mockResolvedValue(ADMIN)
  vi.mocked(obtenerReportesAdmin).mockResolvedValue(pagina([REPORTE, OTRO]))
})

describe('Admin: quién entra (RF-15)', () => {
  it('un ciudadano ve un aviso y no se piden los datos', async () => {
    vi.mocked(obtenerSesion).mockResolvedValue(ANA)
    mostrar()

    expect(await screen.findByRole('alert')).toHaveTextContent('No tenés permiso para ver esta pantalla.')
    expect(obtenerReportesAdmin).not.toHaveBeenCalled()
  })

  it('sin sesión lleva al login', async () => {
    vi.mocked(obtenerSesion).mockResolvedValue(null)
    mostrar()

    expect(await screen.findByText('pantalla del login')).toBeInTheDocument()
    expect(obtenerReportesAdmin).not.toHaveBeenCalled()
  })

  it('si la sesión se cerró en otro lado (401), lleva al login', async () => {
    vi.mocked(obtenerReportesAdmin).mockRejectedValue({ codigo: 'NO_AUTENTICADO', mensaje: 'Iniciá sesión.' })
    mostrar()

    expect(await screen.findByText('pantalla del login')).toBeInTheDocument()
  })
})

describe('Admin: cola de reportes (RF-08, RF-13, RF-15)', () => {
  it('arranca en los pendientes y muestra los datos para decidir', async () => {
    mostrar()

    const tarjeta = (await screen.findAllByRole('article'))[0]
    expect(obtenerReportesAdmin).toHaveBeenCalledWith({ estado: 'pendiente', tipo: '', desde: '', hasta: '' }, 1)
    expect(tarjeta).toHaveTextContent('Robos, asaltos y entraderas')
    expect(tarjeta).toHaveTextContent('Av. Mate de Luna 2400, Barrio Norte')
    expect(tarjeta).toHaveTextContent('por Ana Pérez')
    expect(tarjeta).toHaveTextContent('Pendiente de revisión')
    expect(within(tarjeta).getByRole('link', { name: 'Ver el punto en el mapa' })).toHaveAttribute(
      'href',
      expect.stringContaining('mlat=-26.8235&mlon=-65.2301'),
    )
  })

  it('los filtros se mandan a la API y vuelven a la primera página', async () => {
    vi.mocked(obtenerReportesAdmin).mockResolvedValue(pagina([REPORTE], 25))
    mostrar()

    fireEvent.click(await screen.findByRole('button', { name: 'Siguiente' }))
    await screen.findByRole('button', { name: 'Anterior' })
    expect(obtenerReportesAdmin).toHaveBeenLastCalledWith(expect.anything(), 2)

    fireEvent.change(screen.getByLabelText('Estado'), { target: { value: 'aprobado' } })
    expect(obtenerReportesAdmin).toHaveBeenLastCalledWith(expect.objectContaining({ estado: 'aprobado' }), 1)
  })

  it('si "desde" queda después de "hasta", borra "hasta"', async () => {
    mostrar()
    await screen.findAllByRole('article')

    fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: '2026-11-08' } })
    fireEvent.change(screen.getByLabelText('Enviados desde'), { target: { value: '2026-11-10' } })

    expect(screen.getByLabelText('Hasta')).toHaveValue('')
  })

  it('aprobar avisa el resultado y lo saca de los pendientes sin volver a pedir', async () => {
    vi.mocked(aprobarReporte).mockResolvedValue({ ...REPORTE, estado: 'aprobado', activa: true })
    mostrar()

    const tarjeta = (await screen.findAllByRole('article'))[0]
    fireEvent.click(within(tarjeta).getByRole('button', { name: 'Aprobar' }))

    expect(await screen.findByRole('status')).toHaveTextContent('Reporte aprobado')
    expect(aprobarReporte).toHaveBeenCalledWith(45)
    expect(screen.getAllByRole('article')).toHaveLength(1)
    expect(screen.queryByText('Arrebatos frecuentes en la parada')).toBeNull()
    expect(obtenerReportesAdmin).toHaveBeenCalledTimes(1)
  })

  it('rechazar pide el motivo, valida el largo y lo manda', async () => {
    vi.mocked(rechazarReporte).mockResolvedValue({ ...REPORTE, estado: 'rechazado' })
    mostrar()

    const tarjeta = (await screen.findAllByRole('article'))[0]
    fireEvent.click(within(tarjeta).getByRole('button', { name: 'Rechazar' }))
    fireEvent.change(within(tarjeta).getByLabelText('Motivo del rechazo'), { target: { value: ' no ' } })
    fireEvent.click(within(tarjeta).getByRole('button', { name: 'Confirmar rechazo' }))

    expect(within(tarjeta).getByText('El motivo debe tener entre 5 y 300 caracteres')).toBeInTheDocument()
    expect(rechazarReporte).not.toHaveBeenCalled()

    fireEvent.change(within(tarjeta).getByLabelText('Motivo del rechazo'), {
      target: { value: '  Falta la dirección  ' },
    })
    fireEvent.click(within(tarjeta).getByRole('button', { name: 'Confirmar rechazo' }))

    expect(await screen.findByRole('status')).toHaveTextContent('Reporte rechazado.')
    expect(rechazarReporte).toHaveBeenCalledWith(45, 'Falta la dirección')
  })

  it('en un aprobado se puede resolver, y retirar pide confirmación; no aprobar ni rechazar', async () => {
    const aprobado = { ...REPORTE, estado: 'aprobado', activa: true }
    vi.mocked(obtenerReportesAdmin).mockResolvedValue(pagina([aprobado]))
    vi.mocked(retirarReporte).mockResolvedValue({ ...aprobado, estado: 'retirado' })
    vi.mocked(resolverReporte).mockResolvedValue({ ...aprobado, estado: 'resuelto' })
    mostrar()

    const tarjeta = await screen.findByRole('article')
    expect(within(tarjeta).queryByRole('button', { name: 'Aprobar' })).toBeNull()
    expect(within(tarjeta).queryByRole('button', { name: 'Rechazar' })).toBeNull()
    expect(within(tarjeta).getByRole('button', { name: 'Marcar como resuelto' })).toBeInTheDocument()

    fireEvent.click(within(tarjeta).getByRole('button', { name: 'Retirar' }))
    expect(retirarReporte).not.toHaveBeenCalled()
    fireEvent.click(within(tarjeta).getByRole('button', { name: 'Sí, retirar' }))

    expect(await screen.findByRole('status')).toHaveTextContent('Reporte retirado del mapa.')
    expect(retirarReporte).toHaveBeenCalledWith(45)
  })

  it('con el filtro Todos, el reporte queda en la lista con su estado nuevo', async () => {
    vi.mocked(aprobarReporte).mockResolvedValue({ ...REPORTE, estado: 'aprobado', activa: true })
    mostrar()
    await screen.findAllByRole('article')

    fireEvent.change(screen.getByLabelText('Estado'), { target: { value: '' } })
    const tarjeta = (await screen.findAllByRole('article'))[0]
    fireEvent.click(within(tarjeta).getByRole('button', { name: 'Aprobar' }))

    expect(await within(tarjeta).findByText('Publicado')).toBeInTheDocument()
    expect(within(tarjeta).getByRole('button', { name: 'Marcar como resuelto' })).toBeInTheDocument()
  })

  it('una transición no permitida (409) muestra el mensaje de la API y actualiza la lista', async () => {
    vi.mocked(aprobarReporte).mockRejectedValue({
      codigo: 'TRANSICION_INVALIDA',
      mensaje: 'Otro administrador ya revisó este reporte.',
    })
    mostrar()

    const tarjeta = (await screen.findAllByRole('article'))[0]
    vi.mocked(obtenerReportesAdmin).mockResolvedValue(pagina([OTRO]))
    fireEvent.click(within(tarjeta).getByRole('button', { name: 'Aprobar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Otro administrador ya revisó este reporte.')
    expect(await screen.findByText('Otro reporte de la cola')).toBeInTheDocument()
    expect(screen.queryByText('Arrebatos frecuentes en la parada')).toBeNull()
    expect(obtenerReportesAdmin).toHaveBeenCalledTimes(2)
  })

  it('al aprobar el último de la página, la vuelve a pedir', async () => {
    vi.mocked(obtenerReportesAdmin).mockResolvedValue(pagina([REPORTE]))
    vi.mocked(aprobarReporte).mockResolvedValue({ ...REPORTE, estado: 'aprobado' })
    mostrar()

    fireEvent.click(await screen.findByRole('button', { name: 'Aprobar' }))
    await screen.findByRole('status')

    expect(obtenerReportesAdmin).toHaveBeenCalledTimes(2)
  })

  it('si la API falla, muestra el error con Reintentar (RF-06)', async () => {
    vi.mocked(obtenerReportesAdmin)
      .mockRejectedValueOnce({ codigo: 'ERROR_SERVIDOR', mensaje: 'El servidor no está respondiendo.' })
      .mockResolvedValue(pagina([REPORTE]))
    mostrar()

    fireEvent.click(await screen.findByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByRole('article')).toBeInTheDocument()
  })
})
