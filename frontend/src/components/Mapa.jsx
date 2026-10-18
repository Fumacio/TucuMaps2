import 'leaflet/dist/leaflet.css'
import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, ZoomControl } from 'react-leaflet'
import { obtenerLugares } from '../api/lugares.js'
import MarcadorLugar from './MarcadorLugar.jsx'

// RF-02: el mapa abre centrado en Tucumán. Con este centro y zoom se ven los 20 lugares del seed,
// desde el centro de San Miguel hasta Villa Nougués.
const CENTRO_TUCUMAN = [-26.82, -65.26]
const ZOOM_INICIAL = 12

function Mapa({ onSeleccionarLugar }) {
  const [lugares, setLugares] = useState([])
  const [error, setError] = useState(null)

  // Pide los lugares una sola vez, cuando el mapa aparece en pantalla.
  useEffect(() => {
    let vigente = true // evita guardar la respuesta si el mapa ya se cerró
    obtenerLugares()
      .then((datos) => {
        if (vigente) setLugares(datos)
      })
      .catch((err) => {
        if (vigente) setError(err)
      })
    return () => {
      vigente = false
    }
  }, [])

  return (
    <>
      <MapContainer
        center={CENTRO_TUCUMAN}
        zoom={ZOOM_INICIAL}
        zoomControl={false}
        className="mapa"
      >
        {/* Abajo a la derecha: arriba a la izquierda lo taparía el panel de detalle en la
            computadora, y arriba a la derecha va el botón de Seguridad del diseño. */}
        <ZoomControl position="bottomright" />
        {/* Mapa base de OpenStreetMap; su licencia exige mostrar la atribución (RF-02). */}
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          maxZoom={19}
        />
        {lugares.map((lugar) => (
          <MarcadorLugar key={lugar.id} lugar={lugar} onSeleccionar={onSeleccionarLugar} />
        ))}
      </MapContainer>
      {error && (
        <p className="mapa-aviso" role="alert">
          {error.mensaje}
        </p>
      )}
    </>
  )
}

export default Mapa
