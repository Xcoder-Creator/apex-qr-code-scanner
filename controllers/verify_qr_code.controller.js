const Cryptr = require('cryptr');
const cryptr = new Cryptr('sk7jNmsk790Pmmd3JXaxv');
const sanitize_data = require('../utility/sanitize_data.util');

// Verify QR Code from guest
const verify_qr_code = (req, res) => {
    // Appropriate response headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Authorization, Accept');

    // Validate the request form body data
    if (req.body){
        let form_data = req.body; // Form data from the frontend

        // Check if the appropriate request parameters are set
        if (form_data.qr_code){
            if (typeof form_data.qr_code === 'string' || form_data.qr_code instanceof string){
                try {
                    const decryptedString = cryptr.decrypt(sanitize_data(form_data.qr_code)); // Decrypt string
                    res.statusCode = 200;
                    res.json({ status: true, code: 200, msg: 'QR code is valid!', guest_details: JSON.parse(decryptedString) });
                } catch (error) {
                    res.statusCode = 200;
                    res.json({ status: false, code: 404, msg: 'QR code is invalid!', guest_details: null });
                }
            } else {
                res.statusCode = 401;
                res.json({ status: false, code: 401, msg: 'Not authurized', guest_details: null });
            }
        } else {
            res.statusCode = 401;
            res.json({ status: false, code: 401, msg: 'Not authurized', guest_details: null });
        }
    } else {
        res.statusCode = 401;
        res.json({ status: false, code: 401, msg: 'Not authurized', guest_details: null });
    }
}

module.exports = verify_qr_code;