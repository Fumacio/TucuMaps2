// PostgreSQL devuelve BIGINT y NUMERIC como texto: se pasan a número para el mapa.
const aNumeros = (fila) => ({ ...fila, id: Number(fila.id), lat: Number(fila.lat), lng: Number(fila.lng) });

// Un usuario como { id, nombre } para el panel, o null si no hay (o si borró su cuenta, RF-24).
const persona = (id, nombre) => (id === null ? null : { id: Number(id), nombre });

module.exports = { aNumeros, persona };
