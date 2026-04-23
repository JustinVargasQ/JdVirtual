const router      = require('express').Router();
const ctrl        = require('../controllers/productReviewController');
const requireAuth = require('../middleware/auth');

router.get('/admin/all',           requireAuth, ctrl.adminGetAll);
router.patch('/admin/:id/approve', requireAuth, ctrl.approve);
router.delete('/admin/:id',        requireAuth, ctrl.remove);
router.get('/:productId',          ctrl.getByProduct);
router.post('/',                   ctrl.create);

module.exports = router;
