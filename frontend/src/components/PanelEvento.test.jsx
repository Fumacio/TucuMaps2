import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { eventosEjemplo } from '../test/eventosEjemplo.js'
import PanelEvento from './PanelEvento.jsx'

const [pena, feria] = eventosEjemplo

describe('PanelEvento', () => {
  it('muestra nombre, categoría, modalidad, fecha y hora, lugar y descripción', () => {
    render(<PanelEvento evento={pena} onCerrar={() => {}} />)

    expect(screen.getByRole('heading', { name: 'Peña en el Parque' })).toBeInTheDocument()
    expect(screen.getByText('Música')).toBeInTheDocument()
    expect(screen.getByText('A la gorra')).toBeInTheDocument()
    expect(screen.getByText(/Sábado 7 de noviembre, 20:00 a 23:30 hs/)).toBeInTheDocument()
    expect(screen.getByText('Anfiteatro del Parque 9 de Julio')).toBeInTheDocument()
    expect(screen.getByText('Peña folclórica abierta')).toBeInTheDocument()
    expect(screen.getByText('#folclore')).toBeInTheDocument()
  })

  it('el flyer aparece solo si el evento tiene', () => {
    const { unmount } = render(<PanelEvento evento={pena} onCerrar={() => {}} />)
    expect(screen.queryByRole('img')).toBeNull()
    unmount()

    render(<PanelEvento evento={feria} onCerrar={() => {}} />)
    expect(screen.getByRole('img', { name: 'Flyer de Feria de artesanos' })).toHaveAttribute(
      'src',
      'https://ejemplo.com/flyer-feria.jpg',
    )
  })
})
