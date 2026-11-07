// Anterior y Siguiente de una lista paginada; con una sola página no se muestra.
function Paginacion({ pagina, total, porPagina, onCambiar }) {
  const paginas = Math.ceil(total / porPagina)
  if (paginas <= 1) return null

  return (
    <nav className="paginacion" aria-label="Páginas">
      <button
        type="button"
        className="boton-secundario"
        disabled={pagina <= 1}
        onClick={() => onCambiar(pagina - 1)}
      >
        Anterior
      </button>
      <span>
        Página {pagina} de {paginas}
      </span>
      <button
        type="button"
        className="boton-secundario"
        disabled={pagina >= paginas}
        onClick={() => onCambiar(pagina + 1)}
      >
        Siguiente
      </button>
    </nav>
  )
}

export default Paginacion
