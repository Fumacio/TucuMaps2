const retencion = require('../models/retencion');

const DIA_MS = 24 * 60 * 60 * 1000;

// RF-24: aplica la retención de datos una vez. Devuelve los contadores, para el log y las pruebas.
function ejecutar() {
  return retencion.aplicar();
}

// RF-24: la corre al iniciar el servidor y después cada 24 horas, dentro del propio backend (sin
// GitHub Actions). Aunque Render duerma el servidor, corre en cada arranque, y alcanza porque el
// plazo es de un año. La llama server.js, no app.js: así no corre durante las pruebas salvo que
// se la llame a mano. Un error solo va al log; se reintenta en la próxima vuelta.
function programar({ cadaMs = DIA_MS } = {}) {
  const vuelta = async () => {
    try {
      const resultado = await ejecutar();
      console.log('Retención de datos (RF-24):', JSON.stringify(resultado));
    } catch (err) {
      console.error('Falló la retención de datos (RF-24):', err.message);
    }
  };
  vuelta();
  // unref: el temporizador no impide que el proceso termine.
  return setInterval(vuelta, cadaMs).unref();
}

module.exports = { ejecutar, programar };
