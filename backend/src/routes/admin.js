const { Router } = require('express');
const { requerirSesion, requerirRol } = require('../middlewares/auth');
const adminLugaresRoutes = require('./admin-lugares');
const adminReportesRoutes = require('./admin-reportes');
const adminEventosRoutes = require('./admin-eventos');
const adminUsuariosRoutes = require('./admin-usuarios');
const adminUsuarios = require('../controllers/admin-usuarios');

const router = Router();

// Todo /api/admin es nivel "Admin": sin sesión 401, con otro rol 403.
router.use(requerirSesion, requerirRol('admin'));
router.use('/lugares', adminLugaresRoutes);
router.use('/reportes', adminReportesRoutes);
router.use('/eventos', adminEventosRoutes);
router.use('/usuarios', adminUsuariosRoutes);
// RF-15: contadores de la portada del panel.
router.get('/resumen', adminUsuarios.resumen);

module.exports = router;
