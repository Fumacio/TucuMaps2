import { describe, expect, it } from 'vitest'
import { TIPOS_ALERTA, crearIconoAlerta, datosTipoAlerta } from './iconoAlerta.js'

describe('crearIconoAlerta', () => {
  it('un robo usa el ícono de la pistola, del grupo crimen', () => {
    const imagen = crearIconoAlerta({ tipo: 'robo_asalto' }).options.html

    expect(imagen.src).toContain('robo_asalto')
    expect(imagen.className).toContain('marcador-alerta--crimen')
    expect(imagen.dataset.tipo).toBe('robo_asalto')
  })

  it.each(['riesgo_comunitario', 'accidente_transito', 'disturbio'])(
    '%s usa el triángulo, del grupo urgencia',
    (tipo) => {
      const imagen = crearIconoAlerta({ tipo }).options.html

      expect(imagen.src).toContain('urgencia')
      expect(imagen.className).toContain('marcador-alerta--urgencia')
    },
  )

  it('la coordenada queda en el centro del círculo', () => {
    const { iconSize, iconAnchor } = crearIconoAlerta({ tipo: 'disturbio' }).options

    expect(iconAnchor).toEqual([iconSize[0] / 2, iconSize[1] / 2])
  })
})

describe('datosTipoAlerta', () => {
  it('tiene los cuatro tipos del SRS (3.1)', () => {
    expect(Object.keys(TIPOS_ALERTA).sort()).toEqual([
      'accidente_transito',
      'disturbio',
      'riesgo_comunitario',
      'robo_asalto',
    ])
  })

  it('un tipo desconocido igual se muestra como alerta', () => {
    expect(datosTipoAlerta('inventado').etiqueta).toBe('Alerta')
  })
})
