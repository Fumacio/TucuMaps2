import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  cambiarActivoLugar,
  crearLugar,
  editarLugar,
  obtenerLugaresAdmin,
  aprobarEvento,
  bloquearUsuario,
  desbloquearUsuario,
  obtenerResumenAdmin,
  obtenerUsuariosAdmin,
  aprobarReporte,
  crearEventoAdmin,
  editarEventoAdmin,
  obtenerEventosAdmin,
  obtenerReportesAdmin,
  rechazarEvento,
  rechazarReporte,
  resolverReporte,
  retirarEvento,
  retirarReporte,
} from './admin.js'
import { api } from './cliente.js'

vi.mock('./cliente.js', () => ({ api: vi.fn() }))

beforeEach(() => {
  vi.mocked(api).mockReset()
  vi.mocked(api).mockResolvedValue({})
})

describe('lugares (RF-13)', () => {
  it('la lista pide la página', async () => {
    await obtenerLugaresAdmin({}, 2)
    expect(api).toHaveBeenCalledWith('/admin/lugares?pagina=2&por_pagina=20')
  })

  it('crear manda POST y editar manda PUT', async () => {
    await crearLugar({ nombre: 'Casa' })
    expect(api).toHaveBeenLastCalledWith('/admin/lugares', { metodo: 'POST', cuerpo: { nombre: 'Casa' } })
    await editarLugar(2, { nombre: 'Casa' })
    expect(api).toHaveBeenLastCalledWith('/admin/lugares/2', { metodo: 'PUT', cuerpo: { nombre: 'Casa' } })
  })

  it('ocultar o mostrar manda PATCH con activo, también cuando es false', async () => {
    await cambiarActivoLugar(2, false)
    expect(api).toHaveBeenCalledWith('/admin/lugares/2/activo', { metodo: 'PATCH', cuerpo: { activo: false } })
  })
})

describe('resumen y usuarios (RF-15, RF-16)', () => {
  it('el resumen se pide a /admin/resumen', async () => {
    await obtenerResumenAdmin()
    expect(api).toHaveBeenCalledWith('/admin/resumen')
  })

  it('la lista de usuarios manda la búsqueda', async () => {
    await obtenerUsuariosAdmin({ q: 'ana', bloqueado: '' })
    expect(api).toHaveBeenCalledWith('/admin/usuarios?pagina=1&por_pagina=20&q=ana')
  })

  it('bloquear y desbloquear van a su ruta, sin cuerpo', async () => {
    await bloquearUsuario(12)
    expect(api).toHaveBeenLastCalledWith('/admin/usuarios/12/bloquear', { metodo: 'POST', cuerpo: undefined })
    await desbloquearUsuario(12)
    expect(api).toHaveBeenLastCalledWith('/admin/usuarios/12/desbloquear', { metodo: 'POST', cuerpo: undefined })
  })
})

describe('moderación de eventos (RF-08, RF-13, RF-15)', () => {
  it('la lista manda los filtros con valor', async () => {
    await obtenerEventosAdmin({ estado: '', categoria: 'musica', archivado: 'false' })

    expect(api).toHaveBeenCalledWith('/admin/eventos?pagina=1&por_pagina=20&categoria=musica&archivado=false')
  })

  it('crear manda POST y editar manda PUT con el evento', async () => {
    await crearEventoAdmin({ nombre: 'Peña' })
    expect(api).toHaveBeenLastCalledWith('/admin/eventos', { metodo: 'POST', cuerpo: { nombre: 'Peña' } })
    await editarEventoAdmin(9, { nombre: 'Peña' })
    expect(api).toHaveBeenLastCalledWith('/admin/eventos/9', { metodo: 'PUT', cuerpo: { nombre: 'Peña' } })
  })

  it('aprobar, rechazar y retirar van a su ruta', async () => {
    await aprobarEvento(9)
    expect(api).toHaveBeenLastCalledWith('/admin/eventos/9/aprobar', { metodo: 'POST', cuerpo: undefined })
    await rechazarEvento(9, 'Falta el horario')
    expect(api).toHaveBeenLastCalledWith('/admin/eventos/9/rechazar', {
      metodo: 'POST',
      cuerpo: { motivo: 'Falta el horario' },
    })
    await retirarEvento(9)
    expect(api).toHaveBeenLastCalledWith('/admin/eventos/9/retirar', { metodo: 'POST', cuerpo: undefined })
  })
})

describe('moderación de reportes (RF-08, RF-13, RF-15)', () => {
  it('la lista manda la página y solo los filtros con valor', async () => {
    await obtenerReportesAdmin({ estado: 'pendiente', tipo: '', desde: '2026-11-01', hasta: '' }, 2)

    expect(api).toHaveBeenCalledWith('/admin/reportes?pagina=2&por_pagina=20&estado=pendiente&desde=2026-11-01')
  })

  it('aprobar, resolver y retirar mandan POST sin cuerpo', async () => {
    await aprobarReporte(45)
    expect(api).toHaveBeenLastCalledWith('/admin/reportes/45/aprobar', { metodo: 'POST', cuerpo: undefined })
    await resolverReporte(45)
    expect(api).toHaveBeenLastCalledWith('/admin/reportes/45/resolver', { metodo: 'POST', cuerpo: undefined })
    await retirarReporte(45)
    expect(api).toHaveBeenLastCalledWith('/admin/reportes/45/retirar', { metodo: 'POST', cuerpo: undefined })
  })

  it('rechazar manda el motivo', async () => {
    await rechazarReporte(45, 'Falta la dirección')

    expect(api).toHaveBeenCalledWith('/admin/reportes/45/rechazar', {
      metodo: 'POST',
      cuerpo: { motivo: 'Falta la dirección' },
    })
  })
})
