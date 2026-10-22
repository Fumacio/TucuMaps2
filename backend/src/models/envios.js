const pool = require('../db/pool');

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

// RF-07: autor y estado de un envío. Bloquea la fila hasta el fin de la transacción, así nadie
// la cambia entre que se controla y se edita o cancela.
async function bloquearEnvio(tabla, id, db) {
  const autor = AUTOR[tabla];
  if (!autor) throw new Error(`Tabla de envíos desconocida: ${tabla}`);
  const { rows } = await db.query(`SELECT ${autor} AS autor_id, estado FROM ${tabla} WHERE id = $1 FOR UPDATE`, [id]);
  return rows[0] ?? null;
}

// Campos del formulario de cada clase de envío: van en `contenido` para que el frontend pueda
// precargar el formulario al editar.
const CONTENIDO = {
  reporte: ['tipo', 'descripcion', 'direccion', 'barrio', 'lat', 'lng'],
  evento: ['nombre', 'categoria', 'modalidad', 'descripcion', 'lugar_nombre', 'direccion', 'barrio',
    'lugar_id', 'lat', 'lng', 'inicio', 'fin', 'flyer_url', 'etiquetas'],
};

// PostgreSQL devuelve BIGINT y NUMERIC como texto.
const NUMERICOS = new Set(['lat', 'lng', 'lugar_id']);

function armarEnvio(fila) {
  const contenido = {};
  for (const campo of CONTENIDO[fila.clase]) {
    const valor = fila[campo];
    contenido[campo] = NUMERICOS.has(campo) && valor !== null ? Number(valor) : valor;
  }
  return {
    tipo: fila.clase,
    id: Number(fila.id),
    estado: fila.estado,
    motivo_rechazo: fila.motivo_rechazo,
    creado_en: fila.creado_en,
    actualizado_en: fila.actualizado_en,
    contenido,
  };
}

// RF-07, RF-08: "Mis envíos". Junta reportes y propuestas de eventos del usuario, del más
// nuevo al más viejo. Cada rama pone en null las columnas que no tiene, así el UNION ALL
// queda con las mismas columnas. El total sale de la misma consulta (count(*) OVER) para que
// coincida con la página; solo una página vacía lo pide aparte.
// - tipo: 'reporte', 'evento' o null para los dos.
async function listarDeUsuario(usuarioId, { tipo, pagina, por_pagina: porPagina }, db = pool) {
  const filtros = [usuarioId, tipo ?? null];
  const { rows } = await db.query(
    `SELECT *, count(*) OVER ()::int AS total FROM (
       SELECT 'reporte' AS clase, id, estado::text AS estado, motivo_rechazo, creado_en, actualizado_en,
              tipo, descripcion, direccion, barrio, lat, lng,
              NULL AS nombre, NULL AS categoria, NULL AS modalidad, NULL AS lugar_nombre,
              NULL::bigint AS lugar_id, NULL::timestamptz AS inicio, NULL::timestamptz AS fin,
              NULL AS flyer_url, NULL::text[] AS etiquetas
       FROM reportes WHERE usuario_id = $1 AND ($2::text IS NULL OR $2 = 'reporte')
       UNION ALL
       SELECT 'evento', id, estado::text, motivo_rechazo, creado_en, actualizado_en,
              NULL, descripcion, direccion, barrio, lat, lng,
              nombre, categoria, modalidad, lugar_nombre, lugar_id, inicio, fin, flyer_url, etiquetas
       FROM eventos WHERE propuesto_por = $1 AND ($2::text IS NULL OR $2 = 'evento')
     ) envios
     ORDER BY creado_en DESC, clase, id DESC
     LIMIT $3 OFFSET $4`,
    [...filtros, porPagina, (pagina - 1) * porPagina],
  );
  if (rows.length === 0) {
    const conteo = await db.query(
      `SELECT (SELECT count(*) FROM reportes WHERE usuario_id = $1 AND ($2::text IS NULL OR $2 = 'reporte'))
            + (SELECT count(*) FROM eventos WHERE propuesto_por = $1 AND ($2::text IS NULL OR $2 = 'evento'))
              AS total`,
      filtros,
    );
    return { datos: [], total: Number(conteo.rows[0].total) };
  }
  return { datos: rows.map(armarEnvio), total: rows[0].total };
}

// RF-16: al bloquear a un usuario, sus reportes y propuestas pendientes pasan a rechazado con
// el motivo dado, registrados como revisados por el admin que lo bloqueó.
async function rechazarPendientesDe(usuarioId, adminId, motivo, db) {
  for (const [tabla, autor] of Object.entries(AUTOR)) {
    await db.query(
      `UPDATE ${tabla} SET estado = 'rechazado', motivo_rechazo = $3, revisado_por = $2, revisado_en = now(),
         actualizado_en = now()
       WHERE ${autor} = $1 AND estado = 'pendiente'`,
      [usuarioId, adminId, motivo],
    );
  }
}

module.exports = { contarRecientes, bloquearEnvio, listarDeUsuario, rechazarPendientesDe };
