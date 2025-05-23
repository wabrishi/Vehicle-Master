const cds = require('@sap/cds');
const tesseract = require('node-tesseract-ocr');
const fs = require('fs');
const path = require('path');
const os = require('os');

module.exports = cds.service.impl(async function() {
    const { VehicleEntries } = this.entities;

    // Default READ handler (can be kept or removed if not explicitly needed for customization)
    this.on('READ', VehicleEntries, async (req) => {
        return SELECT.from(VehicleEntries);
    });

    // Custom action to process an image and perform OCR
    this.on('processImage', async (req) => {
        const { imageData } = req.data; // Expecting imageData as a base64 string

        if (!imageData) {
            req.error(400, 'Image data is required');
            return;
        }

        let tempImagePath; // Define here to be accessible in catch/finally for cleanup
        let tempDir;       // Define here for the same reason


        try {
            // Convert base64 to an image file
            const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
            const buffer = Buffer.from(base64Data, 'base64');
            
            // Create a temporary file for OCR processing
            // Tesseract often works best with file paths
            tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ocr-'));
            tempImagePath = path.join(tempDir, 'image.png'); // Assuming png, adjust if needed
            fs.writeFileSync(tempImagePath, buffer);

            console.log('Temporary image saved to:', tempImagePath);

            const config = {
                lang: 'eng', // Language
                oem: 1,      // OCR Engine Mode
                psm: 3,      // Page Segmentation Mode
            };

            console.log('Starting OCR process...');
            const extractedText = await tesseract.recognize(tempImagePath, config);
            console.log('OCR Result:', extractedText.trim());

            // Clean up the temporary file
            fs.unlinkSync(tempImagePath);
            fs.rmdirSync(tempDir);
            
            const vehicleNumber = extractedText.trim().replace(/\n/g, ' ').replace(/\s+/g, ' '); // Basic cleanup

            if (!vehicleNumber) {
                // Return a message if OCR did not find any text, but don't treat as a server error necessarily.
                // The UI can decide how to handle an empty result.
                return { vehicleNumber: '', message: 'OCR did not detect any text or failed to extract a vehicle number.' };
            }

            // Store the extracted number and timestamp
            const entry = {
                vehicleNumber: vehicleNumber,
                timestamp: new Date().toISOString() 
            };
            const result = await INSERT.into(VehicleEntries).entries(entry);
            
            console.log('Entry created:', result.results[0]);
            return { vehicleNumber: vehicleNumber, ID: result.results[0].ID, timestamp: result.results[0].timestamp, message: 'Successfully processed.' };

        } catch (error) {
            console.error('OCR Error:', error);
            // Clean up temp file in case of error too, if it exists
            // This part needs to be careful as tempImagePath might not be defined if error is early
            try {
                if (tempImagePath && fs.existsSync(tempImagePath)) {
                    fs.unlinkSync(tempImagePath);
                }
                if (tempDir && fs.existsSync(tempDir)) {
                   fs.rmdirSync(tempDir);
                }
            } catch (cleanupError) {
                console.error('Cleanup Error:', cleanupError);
            }
            req.error(500, `Error processing image: ${error.message}`);
        }
    });
});
