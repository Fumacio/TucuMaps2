import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from './cliente.js'
import { cancelarEvento, editarEvento, obtenerEvento, obtenerEventos, proponerEvento } from './eventos.js'

vi.mock('./cliente.js', () => ({ api: vi.fn() }))

beforeEach(() => {
  vi.mocked(api).mockReset()
  vi.mocked(api).mockResolvedValue([])
})

describe('eventos (RF-02, RF-12)', () => {
  it('sin filtros pide GET /api/eventos', async () => {
    await obtenerEventos()
    expect(api).toHaveBeenCalledWith('/eventos')
  })

  it('manda solo los filtros que tienen valor', async () => {
    await obtenerEventos({ categoria: 'musica', desde: '2026-11-07', hasta: '' })
    expect(api).toHaveBeenCalledWith('/eventos?categoria=musica&desde=2026-11-07')
  })

  it('un filtro raro no puede agregar otros parámetros', async () => {
    await obtenerEventos({ categoria: 'musica&lugar_id=1' })
    expect(api).toHaveBeenCalledWith('/eventos?categoria=musica%26lugar_id%3D1')
  })

  it('obtenerEvento pide GET /api/eventos/:id', async () => {
    vi.mocked(api).mockResolvedValue({ id: 9, nombre: 'Peña en el Parque' })

    expect(await obtenerEvento(9)).toEqual({ id: 9, nombre: 'Peña en el Parque' })
    expect(api).toHaveBeenCalledWith('/eventos/9')
  })

  it('un id raro no puede cambiar la ruta que se pide', async () => {
    await obtenerEvento('1/../usuarios')
    expect(api).toHaveBeenCalledWith('/eventos/1%2F..%2Fusuarios')
  })
})

describe('proponer un evento (RF-07)', () => {
  it('proponerEvento manda POST /api/eventos con la propuesta', async () => {
    const evento = { nombre: 'Peña en el Parque', categoria: 'musica' }

    await proponerEvento(evento)
    expect(api).toHaveBeenCalledWith('/eventos', { metodo: 'POST', cuerpo: evento })
  })
})

describe('editar y cancelar una propuesta pendiente (RF-07)', () => {
  it('editarEvento manda PUT /api/eventos/:id', async () => {
    await editarEvento(9, { nombre: 'Peña' })
    expect(api).toHaveBeenCalledWith('/eventos/9', { metodo: 'PUT', cuerpo: { nombre: 'Peña' } })
  })

  it('cancelarEvento manda POST /api/eventos/:id/cancelar', async () => {
    await cancelarEvento(9)
    expect(api).toHaveBeenCalledWith('/eventos/9/cancelar', { metodo: 'POST' })
  })
})
