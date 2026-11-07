import { useState } from 'react'

// Pregunta antes de una acción del panel. `alConfirmar` devuelve una promesa de si salió bien: si
// falló, la pregunta queda abierta para reintentar; si salió bien, se cierra con `alVolver`.
function ConfirmarAccion({ texto, textoSi, textoOcupado, clase = 'boton-peligro', alConfirmar, alVolver }) {
  const [ocupado, setOcupado] = useState(false)

  async function confirmar() {
    setOcupado(true)
    const salioBien = await alConfirmar()
    setOcupado(false)
    if (salioBien) alVolver()
  }

  return (
    <div className="moderacion__confirmar" role="group" aria-label="Confirmar">
      <p>{texto}</p>
      <div className="moderacion__botones">
        <button type="button" className={clase} disabled={ocupado} onClick={confirmar}>
          {ocupado ? textoOcupado : textoSi}
        </button>
        <button type="button" className="boton-secundario" disabled={ocupado} onClick={alVolver}>
          Volver
        </button>
      </div>
    </div>
  )
}

export default ConfirmarAccion
