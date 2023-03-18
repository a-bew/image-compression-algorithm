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
const isImageURL = require('image-url-validator').default;
// import isImageURL from 'image-url-validator';
const router = express_1.default.Router();
// const storage = multer.diskStorage({
//   destination: (req: any, file: any, cb: (arg0: null, arg1: string) => void) => {
//     cb(null, './uploads');
//   },
//   filename: (req: any, file: { originalname: any; }, cb: (arg0: null, arg1: string) => void) => {
//     const fileName = `${Date.now()}-${file.originalname}`;
//     cb(null, fileName);
//   }
// });
// const upload = multer({ storage });
// router.post('/', upload.array('images'), (req, res) => {
//   console.log(req.files);
//   res.send('Images uploaded successfully');
// });
const projectRoot = process.cwd();
const upload = (0, multer_1.default)({ dest: `${projectRoot}/uploads/` });
router.post('/', upload.array('files'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // console.log(req.files);
    // res.send('Images uploaded successfully');
    console.log("we are here");
    try {
        const compressedFiles = [];
        // Loop through each uploaded file
        for (let i = 0; i < req.files.length; i++) {
            const file = req.files[i];
            // Check if the uploaded file is an image
            // const isImage = await isImageURL(file.path);
            // if (!isImage) {
            //   // If the file is not an image, delete it and return an error response
            //   fs.unlinkSync(file.path);
            //   res.status(400).send(`File ${i + 1} is not an image`);
            //   return;
            // }
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
exports.default = router;
//# sourceMappingURL=uploads.js.map