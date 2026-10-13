const { Router } = require('express');
const { catalogos } = require('../catalogos');

const router = Router();

// RF-10: valores y etiquetas para armar formularios y filtros. Cambian solo con
// una migración, así que el navegador puede guardarlos un rato.
router.get('/', (req, res) => {
  res.set('Cache-Control', 'public, max-age=3600');
  res.json(catalogos);
});

module.exports = router;
