const env = require('./config/env');
const app = require('./app');
const retencion = require('./jobs/retencion');

app.listen(env.PORT, () => {
  console.log(`TucuMaps API escuchando en http://localhost:${env.PORT}/api`);
  // RF-24: retención de datos al iniciar y cada 24 horas.
  retencion.programar();
});
