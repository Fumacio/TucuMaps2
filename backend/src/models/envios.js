// RF-09: ventana de 24 horas de los envíos de un usuario (reportes o propuestas de eventos).
// La tabla y la columna del autor son constantes del código, nunca vienen del usuario.
const AUTOR = { reportes: 'usuario_id', eventos: 'propuesto_por' };

// Devuelve { cantidad, segundos }: cuántos envíos hizo en las últimas 24 horas (en cualquier
// estado, también cancelados) y, si llegó a `limite`, en cuántos segundos se libera un cupo.
// Todo se calcula con el reloj de la base, el mismo que guarda creado_en.
async function contarRecientes(tabla, usuarioId, limite, db) {
  const autor = AUTOR[tabla];
  if (!autor) throw new Error(`Tabla de envíos desconocida: ${tabla}`);
  const { rows } = await db.query(
    `WITH recientes AS (
       SELECT creado_en FROM ${tabla}
       WHERE ${autor} = $1 AND creado_en > now() - interval '24 hours'
     )
     SELECT (SELECT count(*)::int FROM recientes) AS cantidad,
            -- Para volver a quedar por debajo del límite tienen que vencer los
            -- (cantidad - limite + 1) más viejos: se mira el último de ellos.
            (SELECT ceil(extract(epoch FROM creado_en + interval '24 hours' - now()))::int
             FROM recientes ORDER BY creado_en
             OFFSET greatest((SELECT count(*) FROM recientes) - $2, 0) LIMIT 1) AS segundos`,
    [usuarioId, limite],
  );
  return rows[0];
}

module.exports = { contarRecientes };
