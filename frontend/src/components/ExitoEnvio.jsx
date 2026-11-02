import { Link } from 'react-router-dom'

// RF-07: lo enviado queda pendiente hasta que un administrador lo revisa.
function ExitoEnvio({ titulo, mensaje, otro, onOtro }) {
  return (
    <div className="pagina-formulario">
      <div className="formulario">
        <h1>{titulo}</h1>
        <p className="formulario__exito" role="status">
          {mensaje}
        </p>
        <Link to="/" className="boton-principal">
          Volver al mapa
        </Link>
        <button type="button" className="boton-secundario" onClick={onOtro}>
          {otro}
        </button>
      </div>
    </div>
  )
}

export default ExitoEnvio
