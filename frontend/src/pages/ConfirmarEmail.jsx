import { confirmarEmailNuevo } from '../api/cuenta.js'
import ConfirmarConEnlace from '../components/ConfirmarConEnlace.jsx'
import { useSesion } from '../context/sesion.js'

// RF-25: abre el enlace que llega al email nuevo después de pedir el cambio en Mi cuenta.
function ConfirmarEmail() {
  const { actualizar } = useSesion()

  return (
    <ConfirmarConEnlace
      titulo="Cambio de email"
      confirmar={confirmarEmailNuevo}
      alConfirmar={actualizar}
      exito="¡Listo! Tu email cambió. Desde ahora usalo para iniciar sesión."
    />
  )
}

export default ConfirmarEmail
