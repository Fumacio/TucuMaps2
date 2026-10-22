const { Router } = require('express');
const { requerirSesion, requerirRol } = require('../middlewares/auth');
const adminLugaresRoutes = require('./admin-lugares');
const adminReportesRoutes = require('./admin-reportes');

const router = Router();

// Todo /api/admin es nivel "Admin": sin sesión 401, con otro rol 403.
router.use(requerirSesion, requerirRol('admin'));
router.use('/lugares', adminLugaresRoutes);
router.use('/reportes', adminReportesRoutes);

module.exports = router;
