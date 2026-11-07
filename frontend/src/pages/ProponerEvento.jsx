import { useLocation } from 'react-router-dom'
import { editarEvento, proponerEvento } from '../api/eventos.js'
import FormularioEvento from '../components/FormularioEvento.jsx'
import PuertaDeEnvio from '../components/PuertaDeEnvio.jsx'

const EXITO_NUEVO = {
  titulo: '¡Gracias por tu propuesta!',
  mensaje:
    'Tu evento quedó pendiente de revisión. No va a aparecer en el mapa ni en la agenda hasta que un administrador lo apruebe.',
  otro: 'Proponer otro evento',
}
const EXITO_EDITADO = {
  titulo: 'Guardamos los cambios',
  mensaje: 'Tu evento sigue pendiente de revisión.',
  volver: { a: '/mis-envios', texto: 'Volver a Mis envíos', reemplazar: true },
}

// RF-07, RF-09, RF-10: proponer un evento. Queda pendiente hasta que un administrador la aprueba.
// Desde Mis envíos llega una propuesta pendiente para corregirla (state.editar).
function ProponerEvento() {
  const editar = useLocation().state?.editar ?? null

  return (
    <PuertaDeEnvio titulo="Proponer evento" accion="proponer un evento">
      {/* La key arranca de cero si se pasa de editar a una nueva desde el navbar. */}
      <FormularioEvento
        key={editar ? `editar-${editar.id}` : 'nuevo'}
        inicial={editar?.contenido ?? null}
        mandar={(cuerpo) => (editar ? editarEvento(editar.id, cuerpo) : proponerEvento(cuerpo))}
        titulo={editar ? 'Editar evento' : 'Proponer evento'}
        intro="Un administrador lo revisa antes de mostrarlo en el mapa y en la agenda."
        textoBoton={editar ? 'Guardar cambios' : 'Proponer evento'}
        exito={editar ? EXITO_EDITADO : EXITO_NUEVO}
      />
    </PuertaDeEnvio>
  )
}

export default ProponerEvento
