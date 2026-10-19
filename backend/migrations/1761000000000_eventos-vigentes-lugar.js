// La ficha de un lugar muestra sus próximos eventos (decisión de Nacho del 19/10/2026):
// la vista pública suma lugar_id, la sede opcional del evento. Va al final porque
// CREATE OR REPLACE VIEW solo permite agregar columnas después de las que ya existen.

exports.up = (pgm) => {
  pgm.sql(`
    CREATE OR REPLACE VIEW eventos_vigentes AS
      SELECT id, nombre, categoria, modalidad, descripcion, lugar_nombre, direccion,
             barrio, lat, lng, inicio, fin, flyer_url, etiquetas, lugar_id
      FROM eventos
      WHERE estado = 'aprobado'
        AND COALESCE(fin, inicio) + interval '24 hours' > now();
  `);
};

// Una columna no se puede quitar con CREATE OR REPLACE: se borra la vista y se crea como antes.
exports.down = (pgm) => {
  pgm.sql(`
    DROP VIEW eventos_vigentes;
    CREATE VIEW eventos_vigentes AS
      SELECT id, nombre, categoria, modalidad, descripcion, lugar_nombre, direccion,
             barrio, lat, lng, inicio, fin, flyer_url, etiquetas
      FROM eventos
      WHERE estado = 'aprobado'
        AND COALESCE(fin, inicio) + interval '24 hours' > now();
  `);
};
