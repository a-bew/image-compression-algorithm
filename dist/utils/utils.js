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
exports.downloadImage = exports.getValidImageFormat = exports.saveCanvasToImage = exports.deleteFile = exports.getFilename = exports.deleteLocalFiles = exports.compressImage = void 0;
const fs_1 = __importDefault(require("fs"));
const Jimp = require("jimp");
const path_1 = __importDefault(require("path"));
const util_1 = require("util");
const stream_1 = require("stream");
const sharp = require("sharp");
// filterImageFromURL
// helper function to download, filter, and save the filtered image locally
// returns the absolute path to the local image
// INPUTS
//    inputURL: string - a publicly accessible url to an image file
// RETURNS
//    an absolute path to a filtered image locally saved file
function compressImage(inputURL) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            try {
                const photo = yield Jimp.read(inputURL);
                const outpath = "/tmp/filtered." + Math.floor(Math.random() * 2000) + ".jpg";
                yield photo
                    .resize(256, 256) // resize
                    .quality(60) // set JPEG quality
                    .greyscale() // set greyscale
                    .write(__dirname + outpath, (img) => {
                    resolve(__dirname + outpath);
                });
                // Set a timeout to delete the file after 30 minutes
                setTimeout(() => {
                    deleteFile(outpath);
                }, 4 * 60 * 1000);
            }
            catch (error) {
                reject(error);
            }
        }));
    });
}
exports.compressImage = compressImage;
// deleteLocalFiles
// helper function to delete files on the local disk
// useful to cleanup after tasks
// INPUTS
//    files: Array<string> an array of absolute paths to files
function deleteLocalFiles(files) {
    return __awaiter(this, void 0, void 0, function* () {
        for (let file of files) {
            fs_1.default.unlinkSync(file);
        }
    });
}
exports.deleteLocalFiles = deleteLocalFiles;
function getFilename() {
    const timestamp = Date.now();
    return `filtered.${timestamp}.png`;
}
exports.getFilename = getFilename;
// Function to delete the file
function deleteFile(filename) {
    const filepath = path_1.default.join(__dirname, filename);
    fs_1.default.unlink(filepath, (err) => {
        if (err) {
            console.error(`Error deleting file ${filename}:`, err);
        }
        else {
            console.log(`File ${filename} deleted successfully`);
        }
    });
}
exports.deleteFile = deleteFile;
const pipelineAsync = (0, util_1.promisify)(stream_1.pipeline);
function saveCanvasToImage(canvas, filePath, quality, imageFormatParam) {
    return __awaiter(this, void 0, void 0, function* () {
        const fullPath = path_1.default.join(__dirname, filePath);
        // const fullPath = `${__dirname}/${filePath}`;
        // Get the directory path without the filename
        const directoryPath = path_1.default.dirname(fullPath);
        try {
            // Check if the directory exists, and create it if it doesn't
            yield fs_1.default.promises.mkdir(directoryPath, { recursive: true });
            if (imageFormatParam === 'webp') {
                const buffer = yield canvas.toBuffer('image/jpeg', { quality }); // Assuming the canvas is in JPEG format
                // Convert the buffer to WebP using sharp
                const webpBuffer = yield sharp(buffer).toFormat('webp', { quality: quality === 100 ? 54 : quality }).toBuffer();
                // Write WebP buffer to the final file
                yield fs_1.default.promises.writeFile(fullPath, webpBuffer);
                return {
                    size: webpBuffer.length,
                    compressedFile: fullPath
                };
            }
            const buffer = yield canvas.toBuffer(`image/${imageFormatParam}`, { quality });
            const uint8Array = new Uint8Array(buffer);
            // Write to file first
            yield fs_1.default.promises.writeFile(fullPath, uint8Array);
            // Then get a read stream
            const readStream = fs_1.default.createReadStream(fullPath);
            const stats = fs_1.default.statSync(fullPath);
            const size = stats.size;
            // Set a timeout to delete the file after 30 minutes
            setTimeout(() => {
                deleteFile(filePath);
            }, 4 * 60 * 1000);
            return {
                size,
                compressedFile: fullPath
            };
        }
        catch (error) {
            // Handle errors here
            console.error('Error saving canvas to image:', error);
            throw error; // Re-throw the error for further handling or logging
        }
    });
}
exports.saveCanvasToImage = saveCanvasToImage;
function getValidImageFormat(format) {
    let validFormat;
    switch (format.toLowerCase()) {
        case 'png':
            validFormat = 'png';
            break;
        case 'jpeg':
        case 'jpg':
            validFormat = 'jpeg';
            break;
        case 'webp':
            validFormat = 'webp';
            break;
        default:
            // If the format is not recognized, return the default format (jpg)
            validFormat = 'jpeg';
            break;
    }
    return validFormat;
}
exports.getValidImageFormat = getValidImageFormat;
function downloadImage(res, fileName) {
    try {
        // const image = req.params.image;
        const filePath = `/tmp/${fileName}`;
        // const imagePath = `${__dirname}/tmp/${image}`;
        const imagePath = path_1.default.join(__dirname, filePath);
        // const fullPath = path.join(__dirname, filePath);
        res.download(imagePath, fileName);
    }
    catch (error) {
        console.error(error);
        throw new Error(error.message);
    }
}
exports.downloadImage = downloadImage;
//# sourceMappingURL=utils.js.map