import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App.jsx'

describe('App', () => {
  it('muestra el nombre de TucuMaps', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'TucuMaps' })).toBeInTheDocument()
  })
})
