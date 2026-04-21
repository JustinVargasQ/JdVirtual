const router      = require('express').Router();
const ctrl        = require('../controllers/settingsController');
const requireAuth = require('../middleware/auth');

router.get('/',   ctrl.get);
router.patch('/', requireAuth, ctrl.update);

module.exports = router;
