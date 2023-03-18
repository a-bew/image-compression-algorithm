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
exports.getFilename = exports.deleteLocalFiles = exports.compressImage = void 0;
const fs_1 = __importDefault(require("fs"));
const Jimp = require("jimp");
const path_1 = __importDefault(require("path"));
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
                }, 1 * 60 * 1000);
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
    return `filtered.${timestamp}.jpg`;
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
//# sourceMappingURL=utils.js.map