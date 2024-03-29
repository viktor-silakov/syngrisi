const express = require('express');
const path = require('path');
const httpStatus = require('http-status');

const catchAsync = require('../../utils/catchAsync');

const router = express.Router();

const authController = catchAsync(async (req, res) => {
    res.status(httpStatus.OK).sendFile(path.normalize(path.join(__dirname + './../../../../mvc/views/react/auth/index.html')));
});

router.get('*', authController);

module.exports = router;
