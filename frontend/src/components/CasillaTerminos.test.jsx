import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import CasillaTerminos from './CasillaTerminos.jsx'

// La comparación con el texto de docs/ está en CasillaTerminos.texto.test.jsx (corre en Node).

describe('CasillaTerminos (RF-04)', () => {
  it('enlaza a las dos páginas en otra pestaña, para leerlas antes de aceptar', () => {
    render(<CasillaTerminos marcada={false} onCambiar={() => {}} />)

    const terminos = screen.getByRole('link', { name: 'Términos y Condiciones' })
    const privacidad = screen.getByRole('link', { name: 'Política de Privacidad' })
    expect(terminos).toHaveAttribute('href', '/terminos')
    expect(privacidad).toHaveAttribute('href', '/privacidad')
    for (const enlace of [terminos, privacidad]) {
      expect(enlace).toHaveAttribute('target', '_blank')
      expect(enlace).toHaveAttribute('rel', 'noopener noreferrer')
    }
  })

  it('avisa el cambio y muestra el error asociado a la casilla', () => {
    const onCambiar = vi.fn()
    render(<CasillaTerminos marcada={false} onCambiar={onCambiar} error="Tenés que aceptar los términos de uso" />)

    const casilla = screen.getByRole('checkbox')
    fireEvent.click(casilla)
    expect(onCambiar).toHaveBeenCalledWith(true)
    expect(casilla).toHaveAttribute('aria-invalid', 'true')
    expect(casilla).toHaveAccessibleDescription('Tenés que aceptar los términos de uso')
  })
})
