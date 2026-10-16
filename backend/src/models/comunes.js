// PostgreSQL devuelve BIGINT y NUMERIC como texto: se pasan a número para el mapa.
const aNumeros = (fila) => ({ ...fila, id: Number(fila.id), lat: Number(fila.lat), lng: Number(fila.lng) });

module.exports = { aNumeros };
