import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useEffect, useState } from 'react'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { dentroDeTucuman } from './ubicacion.js'

const CENTRO = [-26.83, -65.21] // San Miguel de Tucumán
const ZOOM_INICIAL = 12
const ZOOM_UBICACION = 16

const PIN = L.divIcon({
  className: 'pin-elegido',
  html: '<span></span>',
  iconSize: [28, 28],
  iconAnchor: [14, 34], // la punta de la gota
})

function AlTocar({ onTocar }) {
  useMapEvents({ click: (e) => onTocar({ lat: e.latlng.lat, lng: e.latlng.lng }) })
  return null
}

// Si el punto llega de afuera (por ejemplo, al elegir un lugar del mapa) y no se ve, va hasta él.
function MostrarPunto({ valor }) {
  const mapa = useMap()

  useEffect(() => {
    if (valor && !mapa.getBounds().contains([valor.lat, valor.lng])) {
      mapa.setView([valor.lat, valor.lng], ZOOM_UBICACION)
    }
  }, [mapa, valor])

  return null
}

// Mapa chico para marcar dónde pasó algo: se toca el mapa o se usa la ubicación del celular.
// valor: { lat, lng } o null.
function ElegirUbicacion({ valor, onCambiar, error, ayuda = 'Tocá el mapa donde pasó.' }) {
  const [mapa, setMapa] = useState(null)
  const [aviso, setAviso] = useState(null)
  const [buscando, setBuscando] = useState(false)
  const hayGps = typeof navigator !== 'undefined' && 'geolocation' in navigator

  function elegir(punto) {
    if (!dentroDeTucuman(punto)) {
      setAviso('Ese punto está fuera de Tucumán. Marcá un lugar dentro de la provincia.')
      return
    }
    setAviso(null)
    onCambiar({ lat: Number(punto.lat.toFixed(6)), lng: Number(punto.lng.toFixed(6)) })
  }

  function usarMiUbicacion() {
    setBuscando(true)
    setAviso(null)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setBuscando(false)
        const punto = { lat: coords.latitude, lng: coords.longitude }
        if (!dentroDeTucuman(punto)) {
          setAviso('Tu ubicación está fuera de Tucumán. Tocá el mapa para marcar el lugar.')
          return
        }
        elegir(punto)
        mapa?.setView([punto.lat, punto.lng], ZOOM_UBICACION)
      },
      () => {
        setBuscando(false)
        setAviso('No pudimos obtener tu ubicación. Tocá el mapa para marcar el lugar.')
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  const mensaje = aviso ?? error

  return (
    <fieldset className="elegir-ubicacion">
      <legend>Ubicación</legend>
      <p className="campo__ayuda">{ayuda}</p>
      <div className="elegir-ubicacion__mapa">
        <MapContainer center={CENTRO} zoom={ZOOM_INICIAL} ref={setMapa}>
          <TileLayer
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            maxZoom={19}
          />
          <AlTocar onTocar={elegir} />
          <MostrarPunto valor={valor} />
          {valor && <Marker position={[valor.lat, valor.lng]} icon={PIN} />}
        </MapContainer>
      </div>
      {hayGps && (
        <button type="button" className="boton-secundario" onClick={usarMiUbicacion} disabled={buscando}>
          {buscando ? 'Buscando tu ubicación…' : 'Usar mi ubicación'}
        </button>
      )}
      <p className="elegir-ubicacion__estado" role="status">
        {valor ? 'Ubicación marcada.' : 'Todavía no marcaste la ubicación.'}
      </p>
      {mensaje && (
        <p className="campo__error" role="alert">
          {mensaje}
        </p>
      )}
    </fieldset>
  )
}

export default ElegirUbicacion
