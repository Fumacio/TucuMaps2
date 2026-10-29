import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import Legal from './Legal.jsx'

function mostrar(documento) {
  return render(
    <MemoryRouter>
      <Legal documento={documento} />
    </MemoryRouter>,
  )
}

describe('Legal (RF-04, RF-24)', () => {
  it('Términos: título, secciones y el aviso de que no reemplaza al 911', () => {
    mostrar('terminos')

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Términos y Condiciones de Uso')
    expect(screen.getByRole('heading', { name: /TucuMaps no es un servicio oficial ni de emergencias/ }))
      .toBeInTheDocument()
    expect(screen.getByText(/no reemplaza a los servicios de emergencia/)).toBeInTheDocument()
  })

  it('no muestra las notas internas de los documentos', () => {
    mostrar('terminos')

    expect(screen.queryByText(/Antes de publicar/)).toBeNull()
    expect(screen.queryByText(/Textos de la interfaz/)).toBeNull()
  })

  it('Privacidad: muestra sus tres tablas (datos, proveedores y plazos)', () => {
    mostrar('privacidad')

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Política de Privacidad')
    expect(screen.getAllByRole('table')).toHaveLength(3)
    expect(screen.getByRole('cell', { name: 'Render' })).toBeInTheDocument()
  })

  it('el enlace a la Privacidad desde los Términos queda dentro de la app', () => {
    mostrar('terminos')

    const enlace = screen.getByRole('link', { name: 'Política de Privacidad' })
    expect(enlace).toHaveAttribute('href', '/privacidad')
    expect(enlace).not.toHaveAttribute('target')
  })
})
