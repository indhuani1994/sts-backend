const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { sendReceiptMail } = require('../controller/sendReceiptController');

// Route to send email
router.post('/', upload.single('receipt'), sendReceiptMail);

module.exports = router;
