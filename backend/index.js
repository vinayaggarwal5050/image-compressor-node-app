const express = require('express');
const path = require('path');
const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs');

const app = express();

// Set up Multer to store the uploaded files temporarily
const upload = multer({ dest: 'uploads/' });

// Serve the frontend directory (static files like index.html)
app.use(express.static(path.join(__dirname, '../frontend')));

// Serve the index.html file when accessing the root URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Post route to handle image compression
app.post('/upload', upload.single('image'), async (req, res) => {
    try {
        const { width, format, quality } = req.body;
        const inputFilePath = req.file.path;
        
        // Define the directory for processed images in the main project folder
        const processedDir = path.join(__dirname, '../processed');

        // Ensure the processed directory exists
        if (!fs.existsSync(processedDir)) {
            fs.mkdirSync(processedDir);
        }

        // Set the output file path with the selected format
        const outputFilePath = path.join(processedDir, `compressed-${Date.now()}.${format}`);

        // Validate and process image
        const resizeWidth = parseInt(width, 10) || null;
        const imageQuality = parseInt(quality, 10) || 80;

        const transformer = sharp(inputFilePath)
            .resize({ width: resizeWidth })
            .toFormat(format, { quality: imageQuality });

        await transformer.toFile(outputFilePath);

        // Remove the original uploaded file
        fs.unlinkSync(inputFilePath);

        // Send the processed file URL (relative to the processed folder)
        const filename = path.basename(outputFilePath);
        res.status(200).json({ message: 'Image processed successfully', file: filename });
    } catch (error) {
        res.status(500).json({ message: 'Image processing failed', error });
    }
});

// Endpoint to download processed file
app.get('/download/:filename', (req, res) => {
    // Serve the compressed file from the main project folder's "processed" directory
    const file = path.join(__dirname, '../processed', req.params.filename);
    if (fs.existsSync(file)) {
        res.download(file);
    } else {
        res.status(404).send('File not found');
    }
});

const PORT = process.env.PORT || 80;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
