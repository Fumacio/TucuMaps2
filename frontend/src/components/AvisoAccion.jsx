// El resultado de una acción del panel, fijo arriba de la lista.
function AvisoAccion({ aviso }) {
  return aviso.tipo === 'exito' ? (
    <p className="formulario__exito moderacion__aviso" role="status">
      {aviso.texto}
    </p>
  ) : (
    <p className="formulario__error moderacion__aviso" role="alert">
      {aviso.texto}
    </p>
  )
}

export default AvisoAccion
