const pool = require('../db/pool');

// RF-24, RNF-07: plazos de la Política de Privacidad, con el reloj de la base. Las consultas son
// las de docs/schema.sql. Devuelve cuántas filas tocó cada una.
async function aplicar(db = pool) {
  // Las confirmaciones de esos reportes se borran en cascada.
  const reportes = await db.query("DELETE FROM reportes WHERE creado_en < now() - interval '1 year'");
  // Los eventos quedan como historial, pero sin autor.
  const eventos = await db.query(
    `UPDATE eventos SET propuesto_por = NULL
     WHERE propuesto_por IS NOT NULL AND creado_en < now() - interval '1 year'`,
  );
  // Enlaces de un solo uso vencidos hace más de una semana (RF-03).
  const tokens = await db.query("DELETE FROM tokens_usuario WHERE expira_en < now() - interval '7 days'");
  return {
    reportes_borrados: reportes.rowCount,
    eventos_desvinculados: eventos.rowCount,
    tokens_borrados: tokens.rowCount,
  };
}

module.exports = { aplicar };
