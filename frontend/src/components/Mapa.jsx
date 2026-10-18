import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer } from 'react-leaflet'

// RF-02: el mapa abre centrado en Tucumán. Con este centro y zoom se ven los 20 lugares del seed,
// desde el centro de San Miguel hasta Villa Nougués.
const CENTRO_TUCUMAN = [-26.82, -65.26]
const ZOOM_INICIAL = 12

function Mapa() {
  return (
    <MapContainer center={CENTRO_TUCUMAN} zoom={ZOOM_INICIAL} className="mapa">
      {/* Mapa base de OpenStreetMap; su licencia exige mostrar la atribución (RF-02). */}
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        maxZoom={19}
      />
    </MapContainer>
  )
}

export default Mapa
