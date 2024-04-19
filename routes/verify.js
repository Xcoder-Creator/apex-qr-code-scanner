const express = require('express');
const router = express.Router();
const cors = require('cors');

const verify_qr_code = require('../controllers/verify_qr_code.controller');

//Verify QR Code POST handler
router.post('/verify-qr-code', verify_qr_code);

module.exports = router;