const { Router } = require('express');
const { requerirSesion, requerirRol } = require('../middlewares/auth');
const adminLugaresRoutes = require('./admin-lugares');
const adminReportesRoutes = require('./admin-reportes');
const adminEventosRoutes = require('./admin-eventos');

const router = Router();

// Todo /api/admin es nivel "Admin": sin sesión 401, con otro rol 403.
router.use(requerirSesion, requerirRol('admin'));
router.use('/lugares', adminLugaresRoutes);
router.use('/reportes', adminReportesRoutes);
router.use('/eventos', adminEventosRoutes);

module.exports = router;
