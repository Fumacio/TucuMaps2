import { useState } from 'react'
import { POR_PAGINA, bloquearUsuario, desbloquearUsuario, obtenerUsuariosAdmin } from '../api/admin.js'
import { useSesion } from '../context/sesion.js'
import { useListaAdmin } from '../hooks/useListaAdmin.js'
import AvisoAccion from './AvisoAccion.jsx'
import Cargando from './Cargando.jsx'
import { textoFechaCorta } from './fechas.js'
import MensajeError from './MensajeError.jsx'
import Paginacion from './Paginacion.jsx'

const FILTROS_INICIALES = { q: '', bloqueado: '' }

// RF-16: buscar usuarios y bloquearlos o desbloquearlos.
function ModeracionUsuarios({ onCambio }) {
  const lista = useListaAdmin(obtenerUsuariosAdmin, FILTROS_INICIALES, onCambio)
  const { filtros, cambiarFiltro, elementos, cargando, error, aviso } = lista
  const [texto, setTexto] = useState('')
  const { usuario: yo } = useSesion()

  function buscar(evento) {
    evento.preventDefault()
    cambiarFiltro('q', texto.trim())
  }

  return (
    <section aria-label="Usuarios">
      <form className="moderacion__filtros moderacion__filtros--usuarios" onSubmit={buscar}>
        <label>
          Buscar por nombre o email
          <input type="search" maxLength={100} value={texto} onChange={(e) => setTexto(e.target.value)} />
        </label>
        <label>
          Estado
          <select value={filtros.bloqueado} onChange={(e) => cambiarFiltro('bloqueado', e.target.value)}>
            <option value="">Todos</option>
            <option value="true">Bloqueados</option>
            <option value="false">Sin bloquear</option>
          </select>
        </label>
        <button type="submit" className="boton-secundario">
          Buscar
        </button>
      </form>

      {aviso && <AvisoAccion aviso={aviso} />}
      {cargando && elementos.length === 0 && !error && (
        <Cargando className="agenda__aviso" texto="Cargando usuarios…" />
      )}
      {error && <MensajeError className="agenda__aviso" error={error} onReintentar={lista.recargar} />}
      {!cargando && !error && elementos.length === 0 && (
        <p className="agenda__aviso" role="status">
          No hay usuarios con estos filtros.
        </p>
      )}

      {elementos.length > 0 && (
        <ul className="moderacion__lista">
          {elementos.map((usuario) => (
            <li key={usuario.id}>
              <TarjetaUsuario
                usuario={usuario}
                esMiCuenta={usuario.id === yo?.id}
                bloquear={() => lista.ejecutar(bloquearUsuario(usuario.id), `Se bloqueó a ${usuario.nombre}.`)}
                desbloquear={() =>
                  lista.ejecutar(desbloquearUsuario(usuario.id), `Se desbloqueó a ${usuario.nombre}.`)
                }
              />
            </li>
          ))}
        </ul>
      )}

      <Paginacion pagina={lista.pagina} total={lista.total} porPagina={POR_PAGINA} onCambiar={lista.irAPagina} />
    </section>
  )
}

function TarjetaUsuario({ usuario, esMiCuenta, bloquear, desbloquear }) {
  const [confirmando, setConfirmando] = useState(false)
  const [ocupado, setOcupado] = useState(false)

  async function confirmar() {
    setOcupado(true)
    await (usuario.bloqueado ? desbloquear() : bloquear())
    setOcupado(false)
    setConfirmando(false)
  }

  return (
    <article className="tarjeta-usuario">
      <h2 className="tarjeta-envio__titulo">
        {usuario.nombre}
        {esMiCuenta && <span className="moderacion__nota"> (tu cuenta)</span>}
      </h2>
      <p className="moderacion__texto">{usuario.email}</p>
      <p className="tarjeta-envio__fecha">
        {usuario.envios} {usuario.envios === 1 ? 'envío' : 'envíos'} · {usuario.rechazos}{' '}
        {usuario.rechazos === 1 ? 'rechazo' : 'rechazos'} · Se registró el {textoFechaCorta(usuario.creado_en)}
      </p>
      <p className="tarjeta-usuario__estados">
        {usuario.rol === 'admin' && <span className="estado-envio estado-envio--resuelto">Administrador</span>}
        <span className="estado-envio">{usuario.email_verificado ? 'Email verificado' : 'Email sin verificar'}</span>
        {usuario.bloqueado && <span className="estado-envio estado-envio--rechazado">Bloqueado</span>}
      </p>

      {confirmando ? (
        <div className="moderacion__confirmar" role="group" aria-label="Confirmar">
          <p>
            {usuario.bloqueado
              ? `¿Desbloquear a ${usuario.nombre}? Va a poder entrar de nuevo. Lo que se le rechazó no se reabre.`
              : `¿Bloquear a ${usuario.nombre}? Sus reportes y eventos pendientes se van a rechazar con el motivo "Usuario bloqueado" y su sesión se corta.`}
          </p>
          <div className="moderacion__botones">
            <button
              type="button"
              className={usuario.bloqueado ? 'boton-principal' : 'boton-peligro'}
              disabled={ocupado}
              onClick={confirmar}
            >
              {usuario.bloqueado ? 'Sí, desbloquear' : 'Sí, bloquear'}
            </button>
            <button type="button" className="boton-secundario" onClick={() => setConfirmando(false)}>
              Volver
            </button>
          </div>
        </div>
      ) : (
        <div className="moderacion__botones">
          <button
            type="button"
            className={usuario.bloqueado ? 'boton-secundario' : 'boton-peligro'}
            onClick={() => setConfirmando(true)}
          >
            {usuario.bloqueado ? 'Desbloquear' : 'Bloquear'}
          </button>
        </div>
      )}
    </article>
  )
}

export default ModeracionUsuarios
