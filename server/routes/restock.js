const router      = require('express').Router();
const ctrl        = require('../controllers/restockController');
const requireAuth = require('../middleware/auth');

router.post('/',              ctrl.request);
router.get('/admin/all',      requireAuth, ctrl.adminGetAll);
router.patch('/admin/:id',    requireAuth, ctrl.markNotified);
router.delete('/admin/:id',   requireAuth, ctrl.remove);

module.exports = router;
