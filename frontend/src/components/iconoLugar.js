import L from 'leaflet'

// Ícono provisorio y nombre de cada categoría de lugar (mismas etiquetas que GET /api/catalogos).
// Para usar íconos propios, alcanza con cambiar `icono` acá.
export const CATEGORIAS_LUGAR = {
  historico: { etiqueta: 'Histórico', icono: '🏛️' },
  cultural_museo: { etiqueta: 'Cultural / museo', icono: '🖼️' },
  natural_paisaje: { etiqueta: 'Natural / paisaje', icono: '🌿' },
  religioso: { etiqueta: 'Religioso', icono: '⛪' },
  recreativo: { etiqueta: 'Recreativo', icono: '🌳' },
}

const CATEGORIA_DESCONOCIDA = { etiqueta: 'Lugar', icono: '📍' }

const ANCHO_FOTO_PIN = 120 // píxeles: alcanza para el círculo del pin y pesa mucho menos que la foto grande

// Las fotos de Wikimedia Commons aceptan ?width= para pedir una versión más chica.
export function fotoChica(imagenUrl, ancho = ANCHO_FOTO_PIN) {
  try {
    const url = new URL(imagenUrl)
    if (url.hostname === 'commons.wikimedia.org') url.searchParams.set('width', ancho)
    return url.toString()
  } catch {
    return imagenUrl
  }
}

// Arma el pin del diseño: gota celeste con la foto del lugar y un circulito con el ícono de su
// categoría. Si el lugar no tiene foto, el ícono de la categoría va grande en el centro.
// Se arma con elementos del DOM (no con un texto HTML) para que un dato raro de la API,
// como una comilla en imagen_url, no pueda meter HTML en la página.
export function crearIconoLugar(lugar) {
  const categoria = CATEGORIAS_LUGAR[lugar.categoria] ?? CATEGORIA_DESCONOCIDA

  const pin = document.createElement('div')
  pin.className = 'marcador-lugar'
  pin.dataset.categoria = lugar.categoria

  const gota = document.createElement('div')
  gota.className = 'marcador-lugar__gota'
  pin.append(gota)

  if (lugar.imagen_url) {
    const foto = document.createElement('img')
    foto.className = 'marcador-lugar__foto'
    foto.src = fotoChica(lugar.imagen_url)
    foto.alt = ''
    foto.loading = 'lazy'
    pin.append(foto)

    const insignia = document.createElement('span')
    insignia.className = 'marcador-lugar__categoria'
    insignia.textContent = categoria.icono
    pin.append(insignia)
  } else {
    const iconoGrande = document.createElement('span')
    iconoGrande.className = 'marcador-lugar__sin-foto'
    iconoGrande.textContent = categoria.icono
    pin.append(iconoGrande)
  }

  return L.divIcon({
    html: pin,
    className: 'marcador-lugar-icono', // reemplaza el cuadrado blanco que Leaflet pone por defecto
    iconSize: [56, 64], // mismas medidas que .marcador-lugar en index.css
    iconAnchor: [28, 63], // la punta de la gota es la que marca la coordenada
  })
}
