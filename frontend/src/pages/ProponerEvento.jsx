import PuertaDeEnvio from '../components/PuertaDeEnvio.jsx'

// RF-07, RF-09, RF-10: proponer un evento. El formulario llega en la parte 3 del #62.
function ProponerEvento() {
  return (
    <PuertaDeEnvio titulo="Proponer evento" accion="proponer un evento">
      <div className="pagina-formulario">
        <div className="formulario">
          <h1>Proponer evento</h1>
        </div>
      </div>
    </PuertaDeEnvio>
  )
}

export default ProponerEvento
