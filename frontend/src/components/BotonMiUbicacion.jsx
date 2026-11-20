import L from 'leaflet'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useMap } from 'react-leaflet'

const ZOOM_MAXIMO = 16

// RF-02: botón "Mi ubicación" del mapa principal, arriba del + y el − (Manual de usuario, 2.1).
// Va como un control de Leaflet para quedar en esa misma columna; tocarlo no es tocar el mapa.
function BotonMiUbicacion({ buscando, onBuscar }) {
  const mapa = useMap()
  const [contenedor] = useState(() => {
    const div = L.DomUtil.create('div', 'leaflet-bar control-mi-ubicacion')
    L.DomEvent.disableClickPropagation(div)
    return div
  })

  useEffect(() => {
    const control = L.control({ position: 'bottomright' })
    control.onAdd = () => contenedor
    control.addTo(mapa)
    return () => control.remove()
  }, [mapa, contenedor])

  return createPortal(
    <button
      type="button"
      className="control-mi-ubicacion__boton"
      aria-label="Mi ubicación"
      title="Mi ubicación"
      disabled={buscando}
      aria-busy={buscando}
      onClick={() =>
        // Que entre el círculo de la precisión: con un GPS impreciso (en la compu, por ejemplo)
        // no tiene sentido acercarse tanto.
        onBuscar((punto) =>
          mapa.fitBounds(L.latLng(punto.lat, punto.lng).toBounds(punto.precision * 2), { maxZoom: ZOOM_MAXIMO }),
        )
      }
    >
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
        <circle cx="12" cy="12" r="4" fill="currentColor" />
        <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M12 1v4M12 19v4M1 12h4M19 12h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </button>,
    contenedor,
  )
}

export default BotonMiUbicacion
