// Alcance del 13/10/2026 (decisión de Nacho): la app se enfoca en la capital y sus
// alrededores cercanos. Oculta del mapa los 6 lugares del interior que el primer seed
// había cargado. No los borra: el down los vuelve a mostrar.
const RETIRADOS = [
  'Ruinas de San José de Lules',
  'Ruinas de Ibatín',
  'Parque de los Menhires',
  'Capilla y Museo Jesuítico La Banda',
  'Ciudad Sagrada de Quilmes',
  'Museo de la Pachamama',
];

const lista = RETIRADOS.map((n) => `'${n.replace(/'/g, "''")}'`).join(', ');

exports.up = (pgm) => {
  pgm.sql(`UPDATE lugares SET activo = FALSE, actualizado_en = now() WHERE nombre IN (${lista});`);
};

exports.down = (pgm) => {
  pgm.sql(`UPDATE lugares SET activo = TRUE, actualizado_en = now() WHERE nombre IN (${lista});`);
};
