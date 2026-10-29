// npm run legales: genera src/legales/*.md desde los documentos de docs/.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { DOCUMENTOS, rutaDeArchivo, textoParaLaApp } from './legales.js'

for (const { origen, destino } of DOCUMENTOS) {
  const ruta = rutaDeArchivo(destino)
  mkdirSync(dirname(ruta), { recursive: true })
  writeFileSync(ruta, textoParaLaApp(readFileSync(origen, 'utf8')))
  console.log(`Actualizado ${ruta}`)
}
