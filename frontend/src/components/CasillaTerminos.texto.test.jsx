// @vitest-environment node
// Lee docs/ del disco: corre en Node, no en el navegador simulado de las otras pruebas.
import { readFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { DOCUMENTOS } from '../../scripts/legales.js'
import CasillaTerminos from './CasillaTerminos.jsx'

describe('CasillaTerminos (RF-04)', () => {
  it('tiene el mismo texto que docs/Terminos de uso (Textos de la interfaz)', () => {
    // La misma ubicación que usa npm run legales: no depende de desde dónde se corran las pruebas.
    const documento = readFileSync(DOCUMENTOS[0].origen, 'utf8')
    const casilla = documento.match(/> ☐ (.*)/)
    expect(casilla, 'No está la línea "> ☐ ..." en docs/Terminos de uso').not.toBeNull()
    // Los enlaces del documento ([texto](destino)) se comparan solo por su texto.
    const esperado = casilla[1].replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').trim()

    const html = renderToStaticMarkup(<CasillaTerminos marcada={false} onCambiar={() => {}} />)
    const texto = html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()

    expect(texto).toBe(esperado)
  })
})
