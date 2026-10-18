// Precio de la entrada de cada lugar (ej. "Gratuita" o la lista de tarifas), que Lourdes
// sumó al preparar el contenido de los 20 lugares. Texto libre, como los horarios.

exports.up = (pgm) => {
  pgm.sql('ALTER TABLE lugares ADD COLUMN precio_entrada VARCHAR(200);');
};

exports.down = (pgm) => {
  pgm.sql('ALTER TABLE lugares DROP COLUMN precio_entrada;');
};
