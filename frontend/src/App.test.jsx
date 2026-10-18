import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App.jsx'

describe('App', () => {
  it('muestra el mapa con la atribución de OpenStreetMap (RF-02)', () => {
    render(<App />)
    expect(screen.getByRole('link', { name: 'OpenStreetMap' })).toBeInTheDocument()
  })
})
