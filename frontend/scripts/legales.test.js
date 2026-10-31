// @vitest-environment node
// Lee archivos del disco: corre en Node, no en el navegador simulado de las otras pruebas.
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { DOCUMENTOS, textoParaLaApp } from './legales.js'

describe('textos legales (RF-04)', () => {
  it.each(DOCUMENTOS.map((d) => [d.destino.pathname.split('/').pop(), d]))(
    '%s coincide con su documento de docs/ (si falla: npm run legales)',
    (_, { origen, destino }) => {
      // En Windows, git puede bajar el archivo con saltos de línea \r\n: se compara el texto.
      const enLaApp = readFileSync(destino, 'utf8').replaceAll('\r\n', '\n')
      expect(enLaApp).toBe(textoParaLaApp(readFileSync(origen, 'utf8')))
    },
  )
})

describe('textoParaLaApp', () => {
  const documento = [
    '---',
    'tags:',
    '  - legal',
    '---',
    '',
    '# Términos',
    '',
    '> [!warning] Antes de publicar',
    '> Nota interna.',
    '>',
    '> Este recuadro no forma parte del texto.',
    '',
    'Leé la [[Politica de privacidad TucuMaps|Política de Privacidad]] y [[Otra nota]].',
    '',
    '---',
    '',
    '### Textos de la interfaz relacionados',
    'Notas para el equipo.',
  ].join('\r\n')

  const texto = textoParaLaApp(documento)

  it('saca el encabezado de Obsidian, el recuadro "Antes de publicar" y las notas finales', () => {
    expect(texto).not.toContain('tags:')
    expect(texto).not.toContain('Antes de publicar')
    expect(texto).not.toContain('Nota interna')
    expect(texto).not.toContain('Textos de la interfaz')
    expect(texto.startsWith('# Términos')).toBe(true)
  })

  it('convierte los enlaces de Obsidian en enlaces de la app, o en texto si no hay página', () => {
    expect(texto).toContain('[Política de Privacidad](/privacidad)')
    expect(texto).toContain(' y Otra nota.')
    expect(texto).not.toContain('[[')
  })
})
