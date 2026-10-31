import { useSesion } from '../context/sesion.js'
import BotonReenviar from './BotonReenviar.jsx'

// RF-03: quien no verificó su email no puede enviar reportes ni propuestas; se lo recuerda
// en toda la app, con el botón para reenviar el enlace.
function AvisoVerificacion() {
  const { usuario } = useSesion()
  if (!usuario || usuario.email_verificado) return null

  return (
    <div className="aviso-verificacion" role="region" aria-label="Verificación del email">
      <span>
        Verificá tu email: te mandamos un enlace a <strong>{usuario.email}</strong>.
      </span>
      <BotonReenviar className="aviso-verificacion__boton" />
    </div>
  )
}

export default AvisoVerificacion
