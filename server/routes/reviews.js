const router      = require('express').Router();
const ctrl        = require('../controllers/reviewsController');
const requireAuth = require('../middleware/auth');

router.get('/',          ctrl.get);
router.post('/refresh',  requireAuth, ctrl.refresh);

module.exports = router;
