const router = require('express').Router();
const ctrl   = require('../controllers/reviewsController');

router.get('/', ctrl.get);

module.exports = router;
