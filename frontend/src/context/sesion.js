import { createContext, useContext } from 'react'

// RF-01: quién está conectado, para cualquier pantalla. Lo llena ProveedorSesion.
// usuario: el de la API o null (sin sesión). cargando: todavía no se sabe.
export const ContextoSesion = createContext(null)

export function useSesion() {
  const sesion = useContext(ContextoSesion)
  if (!sesion) throw new Error('useSesion tiene que usarse dentro de <ProveedorSesion>')
  return sesion
}
