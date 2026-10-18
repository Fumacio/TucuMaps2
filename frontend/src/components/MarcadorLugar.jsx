import { Marker } from 'react-leaflet'
import { CATEGORIAS_LUGAR, crearIconoLugar } from './iconoLugar.js'

function MarcadorLugar({ lugar, onSeleccionar }) {
  const categoria = CATEGORIAS_LUGAR[lugar.categoria]?.etiqueta ?? 'Lugar'

  return (
    <Marker
      position={[lugar.lat, lugar.lng]}
      icon={crearIconoLugar(lugar)}
      title={`${lugar.nombre} (${categoria})`}
      eventHandlers={{ click: () => onSeleccionar(lugar.id) }}
    />
  )
}

export default MarcadorLugar
