import { Link } from 'react-router-dom'

// RF-07: lo enviado queda pendiente hasta que un administrador lo revisa. `otro` y `onOtro` son
// opcionales (al editar no se ofrece mandar otro). Con `volver.reemplazar`, el formulario se saca del
// historial: así "Atrás" no vuelve a abrirlo con los datos de antes de guardar.
function ExitoEnvio({ titulo, mensaje, volver = { a: '/', texto: 'Volver al mapa' }, otro, onOtro }) {
  return (
    <div className="pagina-formulario">
      <div className="formulario">
        <h1>{titulo}</h1>
        <p className="formulario__exito" role="status">
          {mensaje}
        </p>
        <Link to={volver.a} replace={volver.reemplazar} className="boton-principal">
          {volver.texto}
        </Link>
        {otro && (
          <button type="button" className="boton-secundario" onClick={onOtro}>
            {otro}
          </button>
        )}
      </div>
    </div>
  )
}

export default ExitoEnvio
