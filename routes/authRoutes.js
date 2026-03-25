const express = require('express');
const router = express.Router();
const { loginHR } = require('../controller/authController');

router.post('/', loginHR);

module.exports = router;
