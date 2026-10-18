import { useMemo } from 'react'
import { Marker } from 'react-leaflet'
import { CATEGORIAS_LUGAR, crearIconoLugar } from './iconoLugar.js'

function MarcadorLugar({ lugar, onSeleccionar }) {
  const categoria = CATEGORIAS_LUGAR[lugar.categoria]?.etiqueta ?? 'Lugar'

  // useMemo guarda el ícono y los eventos entre dibujos: si no, cada vez que se abre el panel
  // se rearmarían los pins de todos los lugares y las fotos parpadearían.
  const icono = useMemo(() => crearIconoLugar(lugar), [lugar])
  const eventos = useMemo(
    () => ({ click: () => onSeleccionar(lugar.id) }),
    [onSeleccionar, lugar.id],
  )

  return (
    <Marker
      position={[lugar.lat, lugar.lng]}
      icon={icono}
      title={`${lugar.nombre} (${categoria})`}
      eventHandlers={eventos}
    />
  )
}

export default MarcadorLugar
