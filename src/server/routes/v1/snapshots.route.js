const express = require('express');
const { snapshotController } = require('../../controllers');
const { ensureLoggedIn } = require('../../../../lib/ensureLogin/ensureLoggedIn');

const router = express.Router();

router
    .route('/')
    .get(ensureLoggedIn(), snapshotController.get);

module.exports = router;
