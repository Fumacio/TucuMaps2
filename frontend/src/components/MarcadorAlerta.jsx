import { useMemo } from 'react'
import { Marker, Popup } from 'react-leaflet'
import { crearIconoAlerta, datosTipoAlerta, textoConfirmaciones } from './iconoAlerta.js'

// RF-04: la API nunca manda quién hizo el reporte, y acá tampoco se muestra.
function MarcadorAlerta({ alerta }) {
  const icono = useMemo(() => crearIconoAlerta({ tipo: alerta.tipo }), [alerta.tipo])
  const tipo = datosTipoAlerta(alerta.tipo)
  const direccion = [alerta.direccion, alerta.barrio].filter(Boolean).join(', ')

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
        <p className="popup-alerta__confirmaciones">{textoConfirmaciones(alerta.confirmaciones)}</p>
      </Popup>
    </Marker>
  )
}

export default MarcadorAlerta
