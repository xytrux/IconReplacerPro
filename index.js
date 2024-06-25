const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs');
const archiver = require('archiver');
const path = require('path');
const os = require('os');
const { pipeline } = require('stream');

const app = express();
const upload = multer({ dest: os.tmpdir() })

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

app.post('/iconify', upload.single('image'), (req, res) => {
    const inputFile = req.file.path;
    // Assuming "colorable" is sent as a part of the form data and is a boolean
    const isColorable = req.body.colorable === 'true'; // Convert string to boolean

    const archive = archiver('zip');
    res.attachment('icons.zip');

    archive.pipe(res);

    const sizes = [
        { size: 32, name: 'player_107', layer: 'layer.png', top: 34, left: 0 },
        { size: 60, name: 'player_107-hd', layer: 'layerHd.png', top: 2, left: 68 },
        { size: 120, name: 'player_107-uhd', layer: 'layerUhd.png', top: 132, left: 2 },
    ];

    const promises = sizes.map(({ size, name, layer, top, left }) => {
        let sharpProcess = sharp(inputFile).resize(size, size);
        if (isColorable) {
            // Only modify the image if isColorable is true
            sharpProcess = sharpProcess.modulate({ brightness: 2 }).toColourspace('b-w');
        }
        return sharpProcess.toBuffer()
            .then((inputBuffer) => {
                return sharp(layer)
                    .composite([
                        {
                            input: inputBuffer,
                            top: top,
                            left: left,
                        },
                    ])
                    .toBuffer()
                    .then((outputBuffer) => {
                        archive.append(outputBuffer, { name: `${name}.png` });
                    });
            });
    });

    Promise.all(promises)
        .then(() => {
            archive.finalize();
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('An error occurred while processing the image.');
        })
        .finally(() => {
            fs.unlink(inputFile, err => {
                if (err) console.error(`Error deleting file ${inputFile}:`, err);
            });
        });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server listening on port ${port}`));