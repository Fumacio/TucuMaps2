import { fotoChica } from './iconoLugar.js'

// La columna de la derecha de login y registro (Pantallas, 3): un texto y la Casa Histórica.
const FOTO_CASA_HISTORICA =
  'https://commons.wikimedia.org/wiki/Special:FilePath/Tucuman-CasaIndependencia2.jpg'

function PanelBienvenida() {
  return (
    <aside className="bienvenida">
      <p>Con tu cuenta de TucuMaps podés avisarnos de tu evento y enviar reportes de inseguridad.</p>
      <img
        className="bienvenida__foto"
        src={fotoChica(FOTO_CASA_HISTORICA, 640)}
        alt="Casa Histórica de la Independencia"
        loading="lazy"
      />
    </aside>
  )
}

export default PanelBienvenida
