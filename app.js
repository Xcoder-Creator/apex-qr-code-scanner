require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const Excel = require('exceljs');
const fs = require('fs');
const path = require('path'); // Add this line to utilize the path module
const QRCode = require('qrcode');
const Cryptr = require('cryptr');
const cryptr = new Cryptr('sk7jNmsk790Pmmd3JXaxv');
const verify = require('./routes/verify');

const app = express();

// Set the view engine and views directory
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static('public'));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use('/verify-qr-code', verify); //Customer authentication api module

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

app.get('/', (req, res) => {
    res.render('index', { title: 'Welcome to My App' });
});

//404 Error handler
app.use((req, res) => {
    res.statusCode = 404;
    res.render('error', { title: '404 Error Page' });
});
//-----------------------

app.listen(process.env.PORT || 8000); // Adjusted to listen on process.env.PORT or default to 8000