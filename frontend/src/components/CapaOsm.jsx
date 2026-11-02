import { TileLayer } from 'react-leaflet'

// El fondo de los mapas: OpenStreetMap, con la atribución que exige su licencia.
function CapaOsm() {
  return (
    <TileLayer
      url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      maxZoom={19}
    />
  )
}

export default CapaOsm
