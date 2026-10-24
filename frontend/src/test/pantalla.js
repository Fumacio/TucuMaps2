// jsdom no dibuja: para él todo mide 0 × 0, y el mapa no muestra marcadores (la agrupación solo
// dibuja los que entran en pantalla). Esto simula una pantalla de 1024 × 768 en las pruebas
// del mapa y devuelve una función que deja todo como estaba.
export function simularPantalla(ancho = 1024, alto = 768) {
  const originales = {
    clientWidth: Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth'),
    clientHeight: Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientHeight'),
  }
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: ancho })
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, value: alto })

  return () => {
    for (const [propiedad, descriptor] of Object.entries(originales)) {
      if (descriptor) Object.defineProperty(HTMLElement.prototype, propiedad, descriptor)
      else delete HTMLElement.prototype[propiedad]
    }
  }
}
