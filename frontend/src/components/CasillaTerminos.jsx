import { useId } from 'react'

// RF-04: casilla obligatoria del registro, con el texto de docs/Terminos de uso ("Textos de la
// interfaz"). Una sola casilla cubre los dos campos de POST /api/auth/registro: el formulario
// manda `acepta_terminos` y `mayor_de_edad` con el valor de `marcada`, y en `error` pasa el
// mensaje de cualquiera de los dos. Sin `required`: el formulario muestra sus propios mensajes.
// Los enlaces abren otra pestaña para leer sin perder el formulario.
function CasillaTerminos({ marcada, onCambiar, error }) {
  const idError = useId()

  return (
    <div className="casilla-terminos">
      <label>
        <input
          type="checkbox"
          checked={marcada}
          onChange={(e) => onCambiar(e.target.checked)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? idError : undefined}
        />
        <span>
          Tengo 18 años o más, acepto los{' '}
          <a href="/terminos" target="_blank" rel="noopener noreferrer">
            Términos y Condiciones
          </a>{' '}
          y la{' '}
          <a href="/privacidad" target="_blank" rel="noopener noreferrer">
            Política de Privacidad
          </a>
          , y presto mi consentimiento para que mis datos se alojen en servidores ubicados fuera de
          la Argentina, según se explica en la Política de Privacidad.
        </span>
      </label>
      {error && (
        <p id={idError} className="casilla-terminos__error">
          {error}
        </p>
      )}
    </div>
  )
}

export default CasillaTerminos
