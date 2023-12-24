"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const utils_1 = require("../utils/utils");
const fs_1 = __importDefault(require("fs"));
const canvas_1 = require("canvas");
// const isImageURL = require('image-url-validator').default;
// import isImageURL from 'image-url-validator';
const router = express_1.default.Router();
const projectRoot = process.cwd();
const upload = (0, multer_1.default)({ dest: `${projectRoot}/uploads/` });
router.post('/', upload.array('files'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const compressedFiles = [];
        // Loop through each uploaded file
        for (let i = 0; i < req.files.length; i++) {
            const file = req.files[i];
            // Compress the uploaded image
            const compressedFile = yield (0, utils_1.compressImage)(file.path);
            const stats = fs_1.default.statSync(compressedFile);
            const fileSizeInBytes = stats.size;
            const fileSizeInKilobytes = fileSizeInBytes;
            //  / 1024;
            compressedFiles.push({ size: fileSizeInKilobytes, compressedFile });
            // Delete the file
            fs_1.default.unlink(file.path, err => {
                if (err) {
                    console.error(err);
                }
            });
        }
        // All images are compressed, return a success response with the compressed file paths
        res.status(200).json({ oldFiles: req.files, files: compressedFiles });
        // 4. deletes any files on the server on finish of the response      
        //  setTimeout(()=>deleteLocalFiles(compressedFiles), 2000) 
    }
    catch (error) {
        console.log("error", error.message);
        // If there's an error, delete all uploaded files and return an error response
        req.files.forEach((file) => fs_1.default.unlinkSync(file.path));
        res.status(500).send('Internal server error');
    }
}));
// Reusable function for converting image data to grayscale
function applyGrayscale(ctx, width, height) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const pixels = imageData.data;
    for (let i = 0; i < pixels.length; i += 4) {
        const avg = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
        pixels[i] = avg;
        pixels[i + 1] = avg;
        pixels[i + 2] = avg;
    }
    ctx.putImageData(imageData, 0, 0);
}
// Recursive function to process uploaded files
function processUploadedFiles(files, currentIndex, dimensionInfo, manipulatedCanvases, // Pass the array as an argument
callback) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (currentIndex >= files.length) {
                // All files processed, invoke the callback
                callback(manipulatedCanvases); // Pass the manipulatedCanvases array
                return;
            }
            const file = files[currentIndex];
            // Load the uploaded file
            const image = yield (0, canvas_1.loadImage)(file.path);
            const originalHeight = image.height;
            const originalWidth = image.width;
            let desiredWidth = dimensionInfo.width || originalWidth;
            let desiredHeight = dimensionInfo.height || originalHeight;
            // Calculate the aspect ratio of the image
            // const aspectRatio = image.width / image.height;
            // Set the desired width for resizing (e.g., 800 pixels)
            // const desiredWidth = dimensionInfo.width;
            console.log("dimensionInfo.width", dimensionInfo);
            // Calculate the corresponding height to maintain aspect ratio
            // const desiredHeight = Math.round(desiredWidth / aspectRatio);
            if (dimensionInfo.maintainAspect && desiredWidth > 0) {
                const aspectRatio = desiredWidth / originalWidth;
                // const aspectRatio = (originalHeight*desiredWidth)/originalWidth; //(oldHeight * newWidth) / oldWidth
                desiredHeight = Math.round(originalHeight * aspectRatio);
            }
            // Create a canvas with the desired dimensions
            const resizedCanvas = (0, canvas_1.createCanvas)(desiredWidth, desiredHeight);
            const ctx = resizedCanvas.getContext('2d');
            // Set high-quality image rendering for better sharpness
            // ctx.imageSmoothingEnabled = true;
            // ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(image, 0, 0, originalWidth, originalHeight);
            // Sharpen image
            // ctx.filter = 'sharpen(1.5)';
            // Set the blur effect
            ctx.filter = 'blur(10px)'; // Adjust the blur radius as needed
            // Draw the image onto the resized canvas to resize it
            // ctx.drawImage(image, 0, 0, desiredWidth, desiredHeight);
            ctx.drawImage(image, 0, 0, originalWidth, originalHeight, 0, 0, desiredWidth, desiredHeight);
            // Apply color transformation based on colorParam
            if (dimensionInfo.colorParam === 'grayscale') {
                applyGrayscale(ctx, desiredWidth, desiredHeight);
            }
            // Store the manipulated canvas in the array
            manipulatedCanvases.push(resizedCanvas);
            // Delete the file
            fs_1.default.unlink(file.path, err => {
                if (err) {
                    console.error(err);
                }
            });
            // Continue processing the next file
            processUploadedFiles(files, currentIndex + 1, dimensionInfo, manipulatedCanvases, callback);
        }
        catch (error) {
            console.error('Error processing uploaded files:', error);
            // Handle the error or rethrow it if you want the route handler to catch it
            throw error;
        }
    });
}
const upload1 = (0, multer_1.default)({ dest: `${projectRoot}/uploads/manipulate-images` });
router.post('/manipulate-images', upload1.array('files'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const uploadedFiles = req.files;
        // Get the quality parameter from the request query, default to 90 if not specified
        const qualityParam = req.query.quality;
        const imageFormatParam = req.query.imageFormat;
        const aspectParam = req.query.aspect;
        const widthParam = req.query.width;
        const heightParam = req.query.height;
        const colorParam = req.query.color;
        const quality = qualityParam ? parseInt(qualityParam, 10) : 90;
        const imageFormat = (0, utils_1.getValidImageFormat)(imageFormatParam);
        const dimensionInfo = {
            maintainAspect: aspectParam === 'true',
            width: parseInt(widthParam),
            height: parseInt(heightParam),
            colorParam,
            imageFormatParam
        };
        // An array to store manipulated canvases
        const manipulatedCanvases = [];
        // Process all uploaded files using a loop
        processUploadedFiles(uploadedFiles, 0, dimensionInfo, manipulatedCanvases, (manipulatedCanvases) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const savedImages = yield Promise.all(manipulatedCanvases.map((canvas, i) => {
                    const fileName = `filtered.${Math.floor(Math.random() * 2000)}.${imageFormat}`;
                    const filePath = `/tmp/${fileName}`;
                    return (0, utils_1.saveCanvasToImage)(canvas, filePath, quality, imageFormat);
                }));
                res.status(200).json({ files: savedImages });
            }
            catch (error) {
                console.log(error);
                res.status(400).send('Error manipulating images');
            }
        }));
    }
    catch (error) {
        console.error('Error in route handling logic:', error);
        // If there's an error, delete all uploaded files and return an error response
        req.files.forEach((file) => fs_1.default.unlinkSync(file.path));
        res.status(500).json({ error: 'Internal Server Error' });
    }
}));
exports.default = router;
//# sourceMappingURL=uploads.js.map