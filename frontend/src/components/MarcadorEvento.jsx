import { useMemo } from 'react'
import { Marker } from 'react-leaflet'
import { CATEGORIAS_EVENTO, crearIconoEvento } from './iconoEvento.js'

function MarcadorEvento({ evento, onSeleccionar }) {
  // Uno por marcador: Leaflet mueve el elemento del ícono, no lo copia.
  const icono = useMemo(() => crearIconoEvento(), [])
  const eventos = useMemo(() => ({ click: () => onSeleccionar(evento) }), [onSeleccionar, evento])
  const categoria = CATEGORIAS_EVENTO[evento.categoria] ?? 'Evento'

  return (
    <Marker
      position={[evento.lat, evento.lng]}
      icon={icono}
      title={`${evento.nombre} (${categoria})`}
      eventHandlers={eventos}
    />
  )
}

export default MarcadorEvento
