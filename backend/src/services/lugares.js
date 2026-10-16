const { errores } = require('../errores');
const lugares = require('../models/lugares');

// RF-02: el mapa público solo ve lugares activos.
function listarPublicos(filtros) {
  return lugares.listarActivos(filtros);
}

// Un lugar inexistente o inactivo responde igual: 404 (no se revela que existe).
async function obtenerPublico(id) {
  const lugar = await lugares.buscarActivoPorId(id);
  if (!lugar) throw errores.noEncontrado();
  return lugar;
}

// ---------- Administración (RF-13) ----------

// Formato de las listas paginadas de la API: { datos, pagina, por_pagina, total }.
async function listarParaAdmin(paginacion) {
  const { datos, total } = await lugares.listarTodos(paginacion);
  return { datos, ...paginacion, total };
}

// El nombre es único (índice lugares_nombre_unico, lo usa el seed): un repetido es un error
// de validación del campo, no un 500.
async function conNombreUnico(operacion) {
  try {
    return await operacion();
  } catch (err) {
    if (err.code === '23505' && err.constraint === 'lugares_nombre_unico') {
      throw errores.datosInvalidos([{ campo: 'nombre', mensaje: 'Ya existe un lugar con ese nombre' }]);
    }
    throw err;
  }
}

function crear(datos, admin) {
  return conNombreUnico(() => lugares.crear(datos, admin.id));
}

async function actualizar(id, datos) {
  const lugar = await conNombreUnico(() => lugares.actualizar(id, datos));
  if (!lugar) throw errores.noEncontrado();
  return lugar;
}

// Desactivar oculta el lugar del mapa sin borrarlo; reactivarlo lo vuelve a mostrar.
async function cambiarActivo(id, activo) {
  const lugar = await lugares.cambiarActivo(id, activo);
  if (!lugar) throw errores.noEncontrado();
  return lugar;
}

module.exports = {
  listarPublicos,
  obtenerPublico,
  listarParaAdmin,
  crear,
  actualizar,
  cambiarActivo,
};
