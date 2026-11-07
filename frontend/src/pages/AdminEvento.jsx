import { useLocation } from 'react-router-dom'
import { crearEventoAdmin, editarEventoAdmin } from '../api/admin.js'
import FormularioEvento from '../components/FormularioEvento.jsx'
import SoloAdmin from '../components/SoloAdmin.jsx'

const VOLVER = { a: '/admin?pestana=eventos', texto: 'Volver al panel', reemplazar: true }

// RF-13: crear un evento desde el panel (nace publicado) o corregir uno pendiente o publicado
// (sigue en su estado). El evento a editar llega de la lista (state.editar).
function AdminEvento() {
  const editar = useLocation().state?.editar ?? null

  return (
    <SoloAdmin>
      <FormularioEvento
        key={editar ? `editar-${editar.id}` : 'nuevo'}
        inicial={editar}
        mandar={(cuerpo) => (editar ? editarEventoAdmin(editar.id, cuerpo) : crearEventoAdmin(cuerpo))}
        titulo={editar ? 'Editar evento' : 'Crear evento'}
        intro={
          editar
            ? 'Los cambios se guardan sin cambiar su estado.'
            : 'Se publica enseguida en el mapa y en la agenda, sin pasar por la cola.'
        }
        textoBoton={editar ? 'Guardar cambios' : 'Crear evento'}
        exito={
          editar
            ? { titulo: 'Guardamos los cambios', mensaje: 'El evento quedó actualizado.', volver: VOLVER }
            : {
                titulo: 'Evento creado',
                mensaje: 'Ya se ve en el mapa y en la agenda.',
                volver: VOLVER,
                otro: 'Crear otro evento',
              }
        }
        inicioFijoPermitido={Boolean(editar)}
      />
    </SoloAdmin>
  )
}

export default AdminEvento
