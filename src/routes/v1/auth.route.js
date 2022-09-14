const express = require('express');
const authController = require('../../controllers/auth.controller');
const { ensureLoggedIn } = require('../../../lib/ensureLogin/ensureLoggedIn');

const router = express.Router();

router.get('/logout', authController.logout);
router.post('/login', authController.login);
router.post('/change', ensureLoggedIn(), authController.changePassword);
router.post('/change_first_run', authController.changePasswordFirstRun);

module.exports = router;
