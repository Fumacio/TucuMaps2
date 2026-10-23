import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import PanelDetalle from './PanelDetalle.jsx'

// Las pruebas no usan el backend: los lugares salen de src/test/lugaresEjemplo.js.
vi.mock('../api/lugares.js', () => import('../test/lugaresFalsos.js'))

describe('PanelDetalle', () => {
  it('muestra el nombre, la categoría y el contenido histórico del lugar (RF-02)', async () => {
    render(<PanelDetalle lugarId={1} onCerrar={() => {}} />)

    expect(screen.getByRole('status')).toHaveTextContent('Cargando')
    expect(
      await screen.findByRole('heading', { name: 'Casa Histórica de la Independencia' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Histórico')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Historia' })).toBeInTheDocument()
    expect(screen.getByText(/Congreso de Tucumán proclamó la independencia/)).toBeInTheDocument()
  })

  it('si el lugar no existe, muestra el mensaje de error', async () => {
    render(<PanelDetalle lugarId={999} onCerrar={() => {}} />)

    expect(await screen.findByRole('alert')).toHaveTextContent('No encontramos ese lugar.')
  })

  it('se cierra con el botón y con Escape', async () => {
    const onCerrar = vi.fn()
    render(<PanelDetalle lugarId={1} onCerrar={onCerrar} />)

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }))
    fireEvent.keyDown(window, { key: 'Escape' })

    expect(onCerrar).toHaveBeenCalledTimes(2)
  })

  it('tocar la manija agranda el panel, y volver a tocarla lo achica', () => {
    render(<PanelDetalle lugarId={1} onCerrar={() => {}} />)
    const panel = screen.getByRole('complementary', { name: 'Detalle del lugar' })

    fireEvent.click(screen.getByRole('button', { name: 'Agrandar el panel' }))
    expect(panel).toHaveClass('panel-detalle--expandido')

    fireEvent.click(screen.getByRole('button', { name: 'Achicar el panel' }))
    expect(panel).not.toHaveClass('panel-detalle--expandido')
  })

  it('deslizar la manija hacia abajo con el panel chico lo cierra', () => {
    const onCerrar = vi.fn()
    render(<PanelDetalle lugarId={1} onCerrar={onCerrar} />)
    const manija = screen.getByRole('button', { name: 'Agrandar el panel' })

    fireEvent.pointerDown(manija, { clientY: 300 })
    fireEvent.pointerUp(manija, { clientY: 400 })
    fireEvent.click(manija) // el navegador manda un click después de soltar: no tiene que agrandarlo

    expect(onCerrar).toHaveBeenCalled()
  })

  it('después de deslizar, un toque más tarde en la manija sí funciona', () => {
    const ahora = vi.spyOn(Date, 'now').mockReturnValue(10_000)
    render(<PanelDetalle lugarId={1} onCerrar={() => {}} />)
    const panel = screen.getByRole('complementary', { name: 'Detalle del lugar' })
    const manija = screen.getByRole('button', { name: 'Agrandar el panel' })

    // Deslizar hacia arriba sin que el navegador mande click (pasa en muchos celulares).
    fireEvent.pointerDown(manija, { clientY: 400 })
    fireEvent.pointerUp(manija, { clientY: 300 })
    expect(panel).toHaveClass('panel-detalle--expandido')

    ahora.mockReturnValue(12_000) // dos segundos después, un toque
    fireEvent.click(manija)
    expect(panel).not.toHaveClass('panel-detalle--expandido')

    ahora.mockRestore()
  })
})
