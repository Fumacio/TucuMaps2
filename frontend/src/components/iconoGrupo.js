import L from 'leaflet'

// RF-05: ícono de un grupo de marcadores ("de lejos" en el diseño): un círculo con el total.
// La variante elige el color de la capa: celeste para Turismo, bordó para Seguridad (index.css).
const TAMANIOS = [
  { hasta: 9, medida: 44, clase: 'chico' },
  { hasta: 99, medida: 52, clase: 'mediano' },
  { hasta: Infinity, medida: 60, clase: 'grande' },
]

// Qué se agrupa en cada capa, para el texto que leen los lectores de pantalla.
const QUE_AGRUPA = { turismo: 'lugares', seguridad: 'alertas' }

export function crearIconoGrupo(cantidad, variante = 'turismo') {
  const tamanio = TAMANIOS.find((t) => cantidad <= t.hasta)

  const circulo = document.createElement('div')
  circulo.className = `grupo-marcadores grupo-marcadores--${variante} grupo-marcadores--${tamanio.clase}`
  circulo.textContent = cantidad
  // role="img" permite ponerle nombre; Leaflet hace "botón" al elemento de afuera y toma este
  // nombre. "Tocá para verlos": al tocar, el mapa se acerca o, si ya no puede, los abre en abanico.
  circulo.setAttribute('role', 'img')
  circulo.setAttribute('aria-label', `${cantidad} ${QUE_AGRUPA[variante] ?? 'marcadores'}. Tocá para verlos.`)

  return L.divIcon({
    html: circulo,
    className: 'grupo-marcadores-icono', // reemplaza el cuadrado blanco que Leaflet pone por defecto
    iconSize: [tamanio.medida, tamanio.medida],
  })
}

// Lo que espera MarkerClusterGroup en iconCreateFunction: recibe el grupo y devuelve su ícono.
export function iconoGrupoDeCapa(variante) {
  return (grupo) => crearIconoGrupo(grupo.getChildCount(), variante)
}
