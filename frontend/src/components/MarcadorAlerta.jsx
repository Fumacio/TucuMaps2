import { useMemo, useState } from 'react'
import { Marker, Popup } from 'react-leaflet'
import ConfirmarAlerta from './ConfirmarAlerta.jsx'
import { crearIconoAlerta, datosTipoAlerta, textoConfirmaciones } from './iconoAlerta.js'

// RF-04: la API nunca manda quién hizo el reporte, y acá tampoco se muestra.
function MarcadorAlerta({ alerta }) {
  const icono = useMemo(() => crearIconoAlerta({ tipo: alerta.tipo }), [alerta.tipo])
  const tipo = datosTipoAlerta(alerta.tipo)
  const direccion = [alerta.direccion, alerta.barrio].filter(Boolean).join(', ')
  // RF-14: al confirmar, la API devuelve el total nuevo. Se muestra mientras la lista del mapa
  // siga trayendo el número de antes; cuando llega uno actualizado, manda ese.
  const [confirmacion, setConfirmacion] = useState(null) // { antes, total }
  const confirmaciones =
    confirmacion && alerta.confirmaciones === confirmacion.antes ? confirmacion.total : alerta.confirmaciones

  return (
    <Marker position={[alerta.lat, alerta.lng]} icon={icono} title={tipo.etiqueta}>
      {/* El margen de arriba deja lugar al botón Seguridad al acomodar el globito. */}
      <Popup
        className="popup-alerta"
        autoPanPaddingTopLeft={[12, 72]}
        autoPanPaddingBottomRight={[12, 12]}
      >
        <h3 className={`popup-alerta__tipo popup-alerta__tipo--${tipo.grupo}`}>{tipo.etiqueta}</h3>
        <p className="popup-alerta__descripcion">{alerta.descripcion}</p>
        {direccion && <p className="popup-alerta__direccion">{direccion}</p>}
        <p className="popup-alerta__confirmaciones">{textoConfirmaciones(confirmaciones)}</p>
        <ConfirmarAlerta
          alerta={alerta}
          confirmada={confirmacion !== null}
          onConfirmada={(total) => setConfirmacion({ antes: alerta.confirmaciones, total })}
        />
      </Popup>
    </Marker>
  )
}

export default MarcadorAlerta
