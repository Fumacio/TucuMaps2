import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import { CAJA_TUCUMAN } from './ubicacion.js'

// Junto con LIMITES_TUCUMAN (que no deja arrastrar el mapa afuera de la provincia), esto evita
// alejarse más de lo necesario para verla entera. Cuánto es depende del tamaño
// de la pantalla, así que se vuelve a calcular si cambia (girar el celular).
function LimitarATucuman() {
  const mapa = useMap()

  useEffect(() => {
    function ajustarZoomMinimo() {
      const { x, y } = mapa.getSize()
      if (x === 0 || y === 0) return // todavía sin tamaño (o en las pruebas)
      mapa.setMinZoom(mapa.getBoundsZoom(CAJA_TUCUMAN))
    }

    ajustarZoomMinimo()
    mapa.on('resize', ajustarZoomMinimo)
    return () => mapa.off('resize', ajustarZoomMinimo)
  }, [mapa])

  return null
}

export default LimitarATucuman
