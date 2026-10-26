import { useMemo } from 'react'
import { Marker } from 'react-leaflet'
import { crearIconoAlerta, datosTipoAlerta } from './iconoAlerta.js'

function MarcadorAlerta({ alerta }) {
  const icono = useMemo(() => crearIconoAlerta(alerta), [alerta])

  return (
    <Marker
      position={[alerta.lat, alerta.lng]}
      icon={icono}
      title={datosTipoAlerta(alerta.tipo).etiqueta}
    />
  )
}

export default MarcadorAlerta
