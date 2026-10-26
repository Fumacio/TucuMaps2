import { describe, expect, it } from 'vitest'
import { crearIconoGrupo, iconoGrupoDeCapa, iconoGrupoTurismo } from './iconoGrupo.js'

describe('crearIconoGrupo (RF-05)', () => {
  it('muestra el total de lugares del grupo', () => {
    const circulo = crearIconoGrupo(7).options.html

    expect(circulo.textContent).toBe('7')
    expect(circulo).toHaveClass('grupo-marcadores--turismo')
  })

  it('crece según cuántos lugares agrupa', () => {
    expect(crearIconoGrupo(3).options.iconSize).toEqual([44, 44])
    expect(crearIconoGrupo(42).options.iconSize).toEqual([52, 52])
    expect(crearIconoGrupo(500).options.iconSize).toEqual([60, 60])
  })

  it('la capa de Seguridad usa su propio color y habla de alertas', () => {
    const circulo = crearIconoGrupo(5, 'seguridad').options.html

    expect(circulo).toHaveClass('grupo-marcadores--seguridad')
    expect(circulo).toHaveAttribute('aria-label', '5 alertas. Tocá para verlos.')
  })

  it('los lectores de pantalla leen cuántos lugares hay', () => {
    const circulo = crearIconoGrupo(3).options.html

    expect(circulo).toHaveAttribute('role', 'img')
    expect(circulo).toHaveAttribute('aria-label', '3 lugares. Tocá para verlos.')
  })

  it.each([
    [['marcador-lugar-icono', 'marcador-lugar-icono'], 'turismo', '2 lugares'],
    [['marcador-evento-icono', 'marcador-evento-icono'], 'eventos', '2 eventos'],
    [['marcador-lugar-icono', 'marcador-evento-icono'], 'mixto', '2 lugares y eventos'],
  ])('en Turismo el color depende de qué hay adentro: %j → %s', (clases, variante, texto) => {
    const marcadores = clases.map((className) => ({ options: { icon: { options: { className } } } }))
    const grupo = { getChildCount: () => marcadores.length, getAllChildMarkers: () => marcadores }
    const circulo = iconoGrupoTurismo(grupo).options.html

    expect(circulo).toHaveClass(`grupo-marcadores--${variante}`)
    expect(circulo).toHaveAttribute('aria-label', `${texto}. Tocá para verlos.`)
  })

  it('iconoGrupoDeCapa le da a la librería una función que usa el total del grupo', () => {
    const grupoFalso = { getChildCount: () => 12 }

    expect(iconoGrupoDeCapa('turismo')(grupoFalso).options.html.textContent).toBe('12')
  })
})
