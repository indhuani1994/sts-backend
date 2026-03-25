const express = require('express');
const router = express.Router();
const sendReceiptController = require('../controller/sendReceiptController');

// Route to send receipt via email
router.post('/send', sendReceiptController.generateAndSendReceipt);

module.exports = router;