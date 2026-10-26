// RNF-04: el mapa tiene que seguir fluido con al menos 500 marcadores (con agrupación, RF-05).
// Solo en desarrollo: http://localhost:5173/?marcadores=500 suma lugares inventados a los reales.
// En la versión publicada (npm run build) import.meta.env.DEV es false y no hace nada.
const CATEGORIAS = ['historico', 'cultural_museo', 'natural_paisaje', 'religioso', 'recreativo']
const MAXIMO = 5000

// Zona del Gran San Miguel de Tucumán, de Villa Nougués al Parque 9 de Julio.
const ZONA = { latNorte: -26.7, latSur: -26.9, lngOeste: -65.4, lngEste: -65.15 }

// Números "al azar" pero siempre los mismos, para que la prueba se pueda repetir igual.
export function generadorRepetible(semilla) {
  let valor = semilla
  return () => {
    valor = (valor * 1664525 + 1013904223) % 4294967296
    return valor / 4294967296
  }
}

// Cuántos datos inventados pide la URL (?parametro=N); 0 si no pide o el valor no sirve.
// Se recuerda en la pestaña, así siguen al pasar de la agenda al mapa (?parametro=0 lo apaga).
export function cantidadDePrueba(parametro) {
  const clave = `tucumaps-prueba-${parametro}`
  const enUrl = new URLSearchParams(window.location.search).get(parametro)
  let texto = enUrl
  try {
    if (enUrl === null) texto = sessionStorage.getItem(clave)
    else sessionStorage.setItem(clave, enUrl)
  } catch {
    // Sin sessionStorage (modo privado estricto): solo vale lo que dice la URL.
  }
  const cantidad = Number(texto)
  if (texto === null || !Number.isInteger(cantidad) || cantidad <= 0) return 0
  return Math.min(cantidad, MAXIMO)
}

export function puntoAlAzar(azar) {
  return {
    lat: ZONA.latSur + azar() * (ZONA.latNorte - ZONA.latSur),
    lng: ZONA.lngOeste + azar() * (ZONA.lngEste - ZONA.lngOeste),
  }
}

export function sumarLugaresDePrueba(lugares) {
  if (!import.meta.env.DEV) return lugares

  const cantidad = cantidadDePrueba('marcadores')
  if (cantidad === 0) return lugares

  const azar = generadorRepetible(26)
  const inventados = Array.from({ length: cantidad }, (_, i) => ({
    id: -(i + 1), // negativos: no chocan con los id reales
    nombre: `Lugar de prueba ${i + 1}`,
    categoria: CATEGORIAS[i % CATEGORIAS.length],
    imagen_url: null,
    ...puntoAlAzar(azar),
  }))
  return [...lugares, ...inventados]
}
