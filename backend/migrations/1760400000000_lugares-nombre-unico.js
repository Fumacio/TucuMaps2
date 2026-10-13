// Dos lugares no pueden llamarse igual. Le da al seed una clave para reconocer sus
// lugares (INSERT ... ON CONFLICT) y evita pines duplicados cuando exista el ABM de admin.

exports.up = (pgm) => {
  pgm.sql('CREATE UNIQUE INDEX lugares_nombre_unico ON lugares (nombre);');
};

exports.down = (pgm) => {
  pgm.sql('DROP INDEX IF EXISTS lugares_nombre_unico;');
};
