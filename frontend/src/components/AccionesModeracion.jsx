import { useState } from 'react'
import Campo from './Campo.jsx'

const BOTONES = {
  aprobar: { texto: 'Aprobar', clase: 'boton-principal' },
  rechazar: { texto: 'Rechazar', clase: 'boton-peligro' },
  resolver: { texto: 'Marcar como resuelto', clase: 'boton-secundario' },
  retirar: { texto: 'Retirar', clase: 'boton-peligro' },
}

// RF-08, RF-13: los botones de un elemento del panel. `acciones` son las que valen para su estado
// y `alElegir(accion, motivo)` devuelve una promesa de si salió bien. Rechazar pide el motivo
// (lo ve el autor) y retirar, confirmación.
function AccionesModeracion({ acciones, alElegir }) {
  const [abierta, setAbierta] = useState(null) // 'rechazar', 'retirar' o null
  const [motivo, setMotivo] = useState('')
  const [errorMotivo, setErrorMotivo] = useState(null)
  const [ocupado, setOcupado] = useState(false)

  async function elegir(accion, valorMotivo) {
    setOcupado(true)
    const salioBien = await alElegir(accion, valorMotivo)
    setOcupado(false)
    if (salioBien) setAbierta(null)
  }

  function rechazar(evento) {
    evento.preventDefault()
    const texto = motivo.trim()
    if (texto.length < 5 || texto.length > 300) {
      setErrorMotivo('El motivo debe tener entre 5 y 300 caracteres')
      return
    }
    setErrorMotivo(null)
    elegir('rechazar', texto)
  }

  if (abierta === 'rechazar') {
    return (
      <form className="moderacion__confirmar" onSubmit={rechazar} noValidate>
        <Campo
          etiqueta="Motivo del rechazo"
          multilinea
          rows={3}
          maxLength={300}
          ayuda="Entre 5 y 300 caracteres. Lo ve quien lo envió."
          value={motivo}
          onChange={(e) => {
            setMotivo(e.target.value)
            setErrorMotivo(null)
          }}
          error={errorMotivo}
        />
        <div className="moderacion__botones">
          <button type="submit" className="boton-peligro" disabled={ocupado}>
            {ocupado ? 'Rechazando…' : 'Confirmar rechazo'}
          </button>
          <button type="button" className="boton-secundario" onClick={() => setAbierta(null)}>
            Volver
          </button>
        </div>
      </form>
    )
  }

  if (abierta === 'retirar') {
    return (
      <div className="moderacion__confirmar" role="group" aria-label="Confirmar el retiro">
        <p>¿Retirarlo del mapa? No se puede deshacer.</p>
        <div className="moderacion__botones">
          <button type="button" className="boton-peligro" disabled={ocupado} onClick={() => elegir('retirar')}>
            {ocupado ? 'Retirando…' : 'Sí, retirar'}
          </button>
          <button type="button" className="boton-secundario" onClick={() => setAbierta(null)}>
            Volver
          </button>
        </div>
      </div>
    )
  }

  if (acciones.length === 0) return null

  return (
    <div className="moderacion__botones">
      {acciones.map((accion) => (
        <button
          key={accion}
          type="button"
          className={BOTONES[accion].clase}
          disabled={ocupado}
          onClick={() => (accion === 'rechazar' || accion === 'retirar' ? setAbierta(accion) : elegir(accion))}
        >
          {BOTONES[accion].texto}
        </button>
      ))}
    </div>
  )
}

export default AccionesModeracion
