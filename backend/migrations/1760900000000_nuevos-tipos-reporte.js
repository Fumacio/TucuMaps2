// Tipos de alerta definitivos (decisión de Nacho, 18/10/2026): los cuatro que van a tener
// ícono en el mapa. Reemplaza al catálogo inicial de seis. Los reportes que ya existan con
// un tipo viejo pasan al nuevo más cercano.
const NUEVOS = ['riesgo_comunitario', 'robo_asalto', 'disturbio', 'accidente_transito'];
const VIEJOS = ['robo_hurto', 'arrebato_motochorro', 'zona_sin_iluminacion', 'zona_peligrosa',
  'accidente_transito', 'otro'];

const check = (valores) => `CHECK (tipo IN (${valores.map((v) => `'${v}'`).join(', ')}))`;

exports.up = (pgm) => {
  pgm.sql('ALTER TABLE reportes DROP CONSTRAINT reportes_tipo_check;');
  pgm.sql(`UPDATE reportes SET tipo = CASE tipo
             WHEN 'robo_hurto' THEN 'robo_asalto'
             WHEN 'arrebato_motochorro' THEN 'robo_asalto'
             WHEN 'accidente_transito' THEN 'accidente_transito'
             ELSE 'riesgo_comunitario'
           END;`);
  pgm.sql(`ALTER TABLE reportes ADD CONSTRAINT reportes_tipo_check ${check(NUEVOS)};`);
};

// Vuelta atrás aproximada: los tipos nuevos sin equivalente exacto quedan como 'otro'.
exports.down = (pgm) => {
  pgm.sql('ALTER TABLE reportes DROP CONSTRAINT reportes_tipo_check;');
  pgm.sql(`UPDATE reportes SET tipo = CASE tipo
             WHEN 'robo_asalto' THEN 'robo_hurto'
             WHEN 'accidente_transito' THEN 'accidente_transito'
             ELSE 'otro'
           END;`);
  pgm.sql(`ALTER TABLE reportes ADD CONSTRAINT reportes_tipo_check ${check(VIEJOS)};`);
};
