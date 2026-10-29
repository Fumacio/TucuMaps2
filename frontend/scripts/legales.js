// RF-04: los textos legales de la app salen de los documentos de docs/, sin copiarlos a mano.
// `npm run legales` los vuelve a generar; legales.test.js avisa si quedaron desactualizados.
import { fileURLToPath } from 'node:url'

export const DOCUMENTOS = [
  {
    origen: new URL('../../docs/Terminos de uso TucuMaps.md', import.meta.url),
    destino: new URL('../src/legales/terminos.md', import.meta.url),
  },
  {
    origen: new URL('../../docs/Politica de privacidad TucuMaps.md', import.meta.url),
    destino: new URL('../src/legales/privacidad.md', import.meta.url),
  },
]

// Enlaces de Obsidian ([[Nota|texto]]) que tienen página en la app.
const RUTAS = {
  'Terminos de uso TucuMaps': '/terminos',
  'Politica de privacidad TucuMaps': '/privacidad',
}

// Deja solo lo que ve el usuario: sin el encabezado de Obsidian, sin el recuadro "Antes de
// publicar" y sin las notas finales de "Textos de la interfaz relacionados".
export function textoParaLaApp(documento) {
  let texto = documento.replaceAll('\r\n', '\n')
  texto = texto.replace(/^---\n[\s\S]*?\n---\n/, '')
  texto = texto.replace(/^> \[!warning\] Antes de publicar\n(?:>.*\n)*/m, '')
  texto = texto.replace(/\n---\n+### Textos de la interfaz relacionados[\s\S]*$/, '\n')
  texto = texto.replace(/\n{3,}/g, '\n\n') // lo que quedó en blanco al sacar el recuadro
  texto = texto.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, nota, etiqueta) => {
    const visible = etiqueta ?? nota
    return RUTAS[nota] ? `[${visible}](${RUTAS[nota]})` : visible
  })
  return `${texto.trim()}\n`
}

export function rutaDeArchivo(url) {
  return fileURLToPath(url)
}
