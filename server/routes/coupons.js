const router      = require('express').Router();
const ctrl        = require('../controllers/couponController');
const requireAuth = require('../middleware/auth');

/* Public */
router.post('/validate', ctrl.validate);

/* Admin */
router.get('/admin/all',      requireAuth, ctrl.adminGetAll);
router.post('/',              requireAuth, ctrl.create);
router.put('/:id',            requireAuth, ctrl.update);
router.delete('/:id',         requireAuth, ctrl.remove);
router.patch('/:id/toggle',   requireAuth, ctrl.toggleActive);

module.exports = router;
