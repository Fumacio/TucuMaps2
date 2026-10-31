import { verificarEmail } from '../api/auth.js'
import BotonReenviar from '../components/BotonReenviar.jsx'
import ConfirmarConEnlace from '../components/ConfirmarConEnlace.jsx'
import { useSesion } from '../context/sesion.js'

// RF-03: abre el enlace del correo de verificación (vence a las 24 hs).
function VerificarEmail() {
  const { usuario, actualizar } = useSesion()

  return (
    <ConfirmarConEnlace
      titulo="Verificación del email"
      confirmar={verificarEmail}
      alConfirmar={actualizar}
      exito="¡Listo! Tu email quedó verificado. Ya podés enviar reportes y proponer eventos."
      // Si el enlace venció y la persona tiene la sesión abierta, puede pedir otro.
      siFalla={usuario && !usuario.email_verificado && <BotonReenviar className="boton-secundario" />}
    />
  )
}

export default VerificarEmail
