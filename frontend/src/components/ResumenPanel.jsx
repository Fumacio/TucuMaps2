import { useEffect, useState } from 'react'
import { obtenerResumenAdmin } from '../api/admin.js'

const CONTADORES = [
  { campo: 'reportes_pendientes', etiqueta: 'Reportes pendientes', pestana: 'reportes' },
  { campo: 'eventos_pendientes', etiqueta: 'Eventos pendientes', pestana: 'eventos' },
  { campo: 'alertas_activas', etiqueta: 'Alertas activas' },
  { campo: 'usuarios_bloqueados', etiqueta: 'Usuarios bloqueados', pestana: 'usuarios' },
]

// RF-15: los contadores del inicio del panel. `actualizar` cambia después de cada acción. Si no
// se pueden pedir, quedan los últimos que hubo (o ninguno): las listas de abajo avisan el error.
function ResumenPanel({ actualizar, onIr }) {
  const [resumen, setResumen] = useState(null)

  useEffect(() => {
    let vigente = true
    obtenerResumenAdmin()
      .then((datos) => {
        if (vigente) setResumen(datos)
      })
      .catch(() => {})
    return () => {
      vigente = false
    }
  }, [actualizar])

  if (!resumen) return null

  return (
    <ul className="resumen-panel" aria-label="Resumen">
      {CONTADORES.map(({ campo, etiqueta, pestana }) => {
        const contenido = (
          <>
            <strong>{resumen[campo]}</strong>
            <span>{etiqueta}</span>
          </>
        )
        return (
          <li key={campo}>
            {pestana ? (
              <button type="button" className="resumen-panel__dato" onClick={() => onIr(pestana)}>
                {contenido}
              </button>
            ) : (
              <div className="resumen-panel__dato">{contenido}</div>
            )}
          </li>
        )
      })}
    </ul>
  )
}

export default ResumenPanel
