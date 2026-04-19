const router      = require('express').Router();
const ctrl        = require('../controllers/orderController');
const requireAuth = require('../middleware/auth');

/* Public */
router.post('/',                    ctrl.create);
router.get('/track/:number',        ctrl.getByNumber);

/* Admin */
router.get('/admin/all',            requireAuth, ctrl.adminGetAll);
router.get('/admin/stats',          requireAuth, ctrl.stats);
router.get('/admin/:id',            requireAuth, ctrl.adminGetOne);
router.patch('/admin/:id/status',   requireAuth, ctrl.updateStatus);

module.exports = router;
