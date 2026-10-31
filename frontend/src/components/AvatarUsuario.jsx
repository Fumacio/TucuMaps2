// Foto de perfil genérica (Pantallas, 4): en el MVP no se suben fotos.
function AvatarUsuario() {
  return (
    <svg className="avatar-usuario" viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="32" fill="currentColor" opacity="0.15" />
      <circle cx="32" cy="25" r="11" fill="currentColor" />
      <path d="M12 54a20 20 0 0 1 40 0" fill="currentColor" />
    </svg>
  )
}

export default AvatarUsuario
