import { useId } from 'react'

// Un campo de formulario con su etiqueta, una ayuda opcional y el error debajo. El error queda
// asociado al campo (aria-describedby) para que el lector de pantalla lo lea al enfocarlo.
function Campo({ etiqueta, error, ayuda, ...entrada }) {
  const id = useId()
  const idAyuda = `${id}-ayuda`
  const idError = `${id}-error`
  const descripcion = [ayuda && idAyuda, error && idError].filter(Boolean).join(' ')

  return (
    <div className="campo">
      <label htmlFor={id}>{etiqueta}</label>
      <input
        id={id}
        className="campo__entrada"
        aria-invalid={error ? true : undefined}
        aria-describedby={descripcion || undefined}
        {...entrada}
      />
      {ayuda && (
        <p id={idAyuda} className="campo__ayuda">
          {ayuda}
        </p>
      )}
      {error && (
        <p id={idError} className="campo__error">
          {error}
        </p>
      )}
    </div>
  )
}

export default Campo
