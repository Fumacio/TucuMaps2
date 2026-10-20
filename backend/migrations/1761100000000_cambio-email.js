// RF-25 (decisión de Nacho del 20/10/2026): el usuario cambia su email desde el perfil.
// El email nuevo se guarda en el token del enlace de confirmación y recién pasa a la cuenta
// cuando se confirma. PostgreSQL 12+ permite ADD VALUE dentro de la transacción de la
// migración, siempre que el valor nuevo no se use en esa misma transacción.

exports.up = (pgm) => {
  pgm.sql(`
    ALTER TYPE tipo_token ADD VALUE IF NOT EXISTS 'cambiar_email';
    ALTER TABLE tokens_usuario ADD COLUMN email_nuevo VARCHAR(255);
  `);
};

// Un valor de un ENUM no se puede quitar: 'cambiar_email' queda en el tipo sin usarse.
exports.down = (pgm) => {
  pgm.sql(`
    DELETE FROM tokens_usuario WHERE email_nuevo IS NOT NULL;
    ALTER TABLE tokens_usuario DROP COLUMN email_nuevo;
  `);
};
