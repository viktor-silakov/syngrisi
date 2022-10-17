const express = require('express');
const { checksController } = require('../../controllers');
const { ensureLoggedIn } = require('../../../lib/ensureLogin/ensureLoggedIn');

const router = express.Router();

router
    .route('/')
    .get(ensureLoggedIn(), checksController.get);

router
    .route('/:id')
    .delete(ensureLoggedIn(), checksController.remove);

router.route('/accept/:id')
    .put(ensureLoggedIn(), checksController.accept);

module.exports = router;