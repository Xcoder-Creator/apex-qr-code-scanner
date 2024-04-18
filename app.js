require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const Excel = require('exceljs');
const fs = require('fs');
const path = require('path'); // Add this line to utilize the path module
const QRCode = require('qrcode');
const Cryptr = require('cryptr');
const cryptr = new Cryptr('sk7jNmsk790Pmmd3JXaxv');
const sanitize_data = require('./utility/sanitize_data.util');

const app = express();

// Set the view engine and views directory
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static('public'));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/healthcheck', async (req, res, _next) => {
    const healthcheck = {
        uptime: process.uptime(),
        message: 'OK',
        timestamp: Date.now()
    };
    try {
        res.send(healthcheck);
    } catch (error) {
        healthcheck.message = error;
        res.status(503).send();
    }
});

app.get('/get-all-guests', async (req, res, _next) => {
    let guests_array = [];

    // Load the Excel workbook
    const workbook = new Excel.Workbook();
    workbook.xlsx.readFile('./Wedding guests.xlsx')
        .then(function() {
            // Get the first worksheet
            const worksheet = workbook.getWorksheet(1);

            // Iterate over all rows and columns
            worksheet.eachRow({ includeEmpty: true }, function(row, rowNumber) {
                console.log('Row ' + rowNumber + ' = ' + JSON.stringify(row.values));
                guests_array.push({ name: row.values[1], phone_num: row.values[2] === undefined ? null : `${row.values[2] }` });
            });

            const jsonData = JSON.stringify({ records: guests_array });

            // Write JSON string to a file
            fs.writeFile('data.json', jsonData, (err) => {
                if (err) {
                    console.error('Error writing to file:', err);
                    return;
                }
                console.log('Data saved to data.json');
            });
        })
        .catch(function(error) {
            console.error('Error reading Excel file:', error);
        });
});

app.get('/generate-qr-codes', async (req, res, _next) => {
    function dataURLtoImage(dataURL, filename) {
        // Extract base64 data from Data URL
        const base64Data = dataURL.replace(/^data:image\/\w+;base64,/, '');
        
        // Create buffer from base64 data
        const imageBuffer = Buffer.from(base64Data, 'base64');

        const folderPath = path.join(__dirname, 'qr_code_images'); // Assuming 'images' folder is in the same directory
        const outputPath = path.join(folderPath, filename);

        // Write buffer to file
        fs.writeFile(outputPath, imageBuffer, (err) => {
          if (err) {
            console.error('Error saving image:', err);
          } else {
            console.log('Image saved successfully.');
          }
        });
    }

    // Read JSON file
    fs.readFile('data.json', 'utf8', (err, data) => {
        if (err) {
        console.error('Error reading file:', err);
        return;
        }
    
        try {
            // Parse JSON data
            const jsonData = JSON.parse(data);
            
            // Convert object to an iterable of key-value pairs
            const entries = Object.entries(jsonData.records);

            // Iterate over key-value pairs using for...of loop
            for (const [key, value] of entries) {
                QRCode.toDataURL(cryptr.encrypt(JSON.stringify(value)), function (err, url) {
                    dataURLtoImage(url, `${value.name}.png`);
                })
            }
        } catch (error) {
            console.error('Error parsing JSON data:', error);
        }
    });
});

app.post('/api/verify-qr-code', async (req, res, _next) => {
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
});

app.get('/', (req, res) => {
    res.render('index', { title: 'Welcome to My App' });
});

//404 Error handler
app.use((req, res) => {
    res.statusCode = 404;
    res.render('error', { title: '404 Error Page' });
});
//-----------------------

app.listen(8000 || process.env.PORT); // Adjusted to listen on process.env.PORT or default to 8000
