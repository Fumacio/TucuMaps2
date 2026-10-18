import { describe, expect, it } from 'vitest'
import { crearIconoLugar, fotoChica } from './iconoLugar.js'

const FOTO = 'https://commons.wikimedia.org/wiki/Special:FilePath/Villa_Nougues.jpg?width=1024'

describe('crearIconoLugar', () => {
  it('con foto: muestra la foto chica y el ícono de la categoría', () => {
    const pin = crearIconoLugar({ categoria: 'religioso', imagen_url: FOTO }).options.html

    expect(pin.dataset.categoria).toBe('religioso')
    expect(pin.querySelector('img').src).toContain('width=120')
    expect(pin.querySelector('.marcador-lugar__categoria').textContent).toBe('⛪')
  })

  it('sin foto: el ícono de la categoría va grande en el centro', () => {
    const pin = crearIconoLugar({ categoria: 'cultural_museo', imagen_url: null }).options.html

    expect(pin.querySelector('img')).toBeNull()
    expect(pin.querySelector('.marcador-lugar__sin-foto').textContent).toBe('🖼️')
  })

  it('una imagen_url con comillas no mete HTML en la página', () => {
    const urlRara = 'https://ejemplo.com/a.jpg" onerror="alert(1)'
    const pin = crearIconoLugar({ categoria: 'historico', imagen_url: urlRara }).options.html

    const foto = pin.querySelector('img')
    expect(foto.getAttribute('onerror')).toBeNull()
  })
})

describe('fotoChica', () => {
  it('pide 120 px de ancho a Wikimedia Commons', () => {
    expect(fotoChica(FOTO)).toContain('width=120')
  })

  it('deja igual las fotos de otros sitios', () => {
    expect(fotoChica('https://ejemplo.com/foto.jpg')).toBe('https://ejemplo.com/foto.jpg')
  })
})
