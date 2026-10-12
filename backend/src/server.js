const env = require('./config/env');
const app = require('./app');

app.listen(env.PORT, () => {
  console.log(`TucuMaps API escuchando en http://localhost:${env.PORT}/api`);
});
