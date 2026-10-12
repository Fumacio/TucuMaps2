// Primer administrador: convierte en admin a un usuario ya registrado.
// El registro público solo crea ciudadanos; este script se corre a mano.
// Uso: npm run crear-admin -- email@ejemplo.com
const usuarios = require('../src/models/usuarios');
const pool = require('../src/db/pool');

async function main() {
  const email = (process.argv[2] ?? '').trim().toLowerCase();
  if (!email) {
    console.error('Uso: npm run crear-admin -- email@ejemplo.com');
    process.exitCode = 1;
    return;
  }
  const usuario = await usuarios.hacerAdmin(email);
  if (!usuario) {
    console.error(`No existe un usuario con el email ${email}. Registralo primero.`);
    process.exitCode = 1;
    return;
  }
  console.log(`${usuario.nombre} (${usuario.email}) ahora es administrador.`);
}

main()
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
