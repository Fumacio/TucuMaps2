import Markdown from 'react-markdown'
import { Link } from 'react-router-dom'
import remarkGfm from 'remark-gfm'
import privacidad from '../legales/privacidad.md?raw'
import terminos from '../legales/terminos.md?raw'

// RF-04, RF-24: los textos salen de src/legales/ (npm run legales). react-markdown no deja pasar
// HTML, así que el texto no puede meter código en la página.
const TEXTOS = { terminos, privacidad }

const COMPONENTES = {
  // Los enlaces a otra página de la app se abren sin recargar; los de afuera, en otra pestaña.
  a({ href = '', children }) {
    if (href.startsWith('/')) return <Link to={href}>{children}</Link>
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    )
  },
  // En el celular la tabla se desliza de costado en vez de romper el ancho de la página.
  table({ children }) {
    return (
      <div className="legal__tabla">
        <table>{children}</table>
      </div>
    )
  },
}

function Legal({ documento }) {
  return (
    <article className="legal">
      <Markdown remarkPlugins={[remarkGfm]} components={COMPONENTES}>
        {TEXTOS[documento]}
      </Markdown>
    </article>
  )
}

export default Legal
