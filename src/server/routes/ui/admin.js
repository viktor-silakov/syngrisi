const express = require('express');
const path = require('path');
const httpStatus = require('http-status');

const catchAsync = require('../../utils/catchAsync');
const { ensureLoggedIn } = require('../../../../lib/ensureLogin/ensureLoggedIn');
const { authorization } = require('../../middlewares/authorization');

const router = express.Router();

const adminController = catchAsync(async (req, res) => {
    res.status(httpStatus.OK)
        .sendFile(path.normalize(path.join(`${__dirname}./../../../../mvc/views/react/admin/index.html`)));
});

router.get('*', ensureLoggedIn(),
    authorization('admin'),
    adminController);

module.exports = router;
