import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { obtenerEventos } from '../api/eventos.js'
import { eventosEjemplo } from '../test/eventosEjemplo.js'
import Agenda from './Agenda.jsx'

vi.mock('../api/eventos.js', () => ({ obtenerEventos: vi.fn() }))

function mostrar() {
  return render(
    <MemoryRouter>
      <Agenda />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.mocked(obtenerEventos).mockReset()
  vi.mocked(obtenerEventos).mockResolvedValue(eventosEjemplo)
})

describe('Agenda', () => {
  it('muestra los eventos en el orden de la API, por inicio (RF-02)', async () => {
    mostrar()

    expect(screen.getByRole('status')).toHaveTextContent('Cargando eventos')
    const nombres = (await screen.findAllByRole('heading', { level: 2 })).map((h) => h.textContent)
    expect(nombres).toEqual(['Peña en el Parque', 'Feria de artesanos'])
  })

  it('cada tarjeta tiene fecha, lugar, categoría, modalidad y Ver mapa', async () => {
    mostrar()

    const tarjeta = (await screen.findAllByRole('article'))[0]
    expect(tarjeta).toHaveTextContent('Sáb 7 nov · 20:00')
    expect(tarjeta).toHaveTextContent('Anfiteatro del Parque 9 de Julio')
    expect(tarjeta).toHaveTextContent('Música')
    expect(tarjeta).toHaveTextContent('A la gorra')
    expect(within(tarjeta).getByRole('link', { name: 'Ver Peña en el Parque en el mapa' })).toHaveAttribute(
      'href',
      '/?evento=9',
    )
  })

  it('los filtros se mandan a la API', async () => {
    mostrar()
    await screen.findAllByRole('article')

    fireEvent.change(screen.getByLabelText('Tipo'), { target: { value: 'musica' } })
    fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '2026-11-07' } })
    fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: '2026-11-08' } })

    expect(obtenerEventos).toHaveBeenLastCalledWith({
      categoria: 'musica',
      desde: '2026-11-07',
      hasta: '2026-11-08',
    })
  })

  it('si "desde" queda después de "hasta", borra "hasta" en vez de pedir algo inválido', async () => {
    mostrar()
    fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: '2026-11-08' } })
    fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '2026-11-10' } })

    expect(screen.getByLabelText('Hasta')).toHaveValue('')
    expect(obtenerEventos).toHaveBeenLastCalledWith({ categoria: '', desde: '2026-11-10', hasta: '' })
  })

  it('sin eventos, muestra un mensaje en lugar de una lista vacía', async () => {
    vi.mocked(obtenerEventos).mockResolvedValue([])
    mostrar()

    expect(await screen.findByText('Todavía no hay eventos próximos. ¡Volvé pronto!')).toBeInTheDocument()
  })

  it('sin resultados con filtros, lo dice y permite limpiarlos', async () => {
    mostrar()
    await screen.findAllByRole('article')
    vi.mocked(obtenerEventos).mockResolvedValue([])

    fireEvent.change(screen.getByLabelText('Tipo'), { target: { value: 'teatro' } })
    expect(await screen.findByText('No hay eventos que coincidan con los filtros.')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }))
    expect(screen.getByLabelText('Tipo')).toHaveValue('')
  })

  it('si la API falla, muestra el mensaje de error (RF-06)', async () => {
    vi.mocked(obtenerEventos).mockRejectedValue({ mensaje: 'El servidor no está respondiendo.' })
    mostrar()

    expect(await screen.findByRole('alert')).toHaveTextContent('El servidor no está respondiendo.')
  })
})
