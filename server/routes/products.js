const router      = require('express').Router();
const ctrl        = require('../controllers/productController');
const requireAuth = require('../middleware/auth');
const upload      = require('../middleware/upload');

/* Public */
router.get('/',             ctrl.getAll);
router.get('/top-sellers',  ctrl.topSellers);
router.get('/categories',   ctrl.getCategories);
router.get('/brands',       ctrl.getBrands);
router.get('/:slug',        ctrl.getBySlug);

/* Admin */
router.get('/admin/all',              requireAuth, ctrl.adminGetAll);
router.post('/',                      requireAuth, ctrl.create);
router.put('/:id',                    requireAuth, ctrl.update);
router.delete('/:id',                 requireAuth, ctrl.remove);
router.patch('/:id/toggle',           requireAuth, ctrl.toggleActive);
router.post('/:id/images', requireAuth, upload.array('images', 8), ctrl.uploadImages);

module.exports = router;
