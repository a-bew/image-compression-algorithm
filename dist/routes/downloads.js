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
const utils_1 = require("../utils/utils");
const router = express_1.default.Router();
router.get('/:image', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const fileName = req.params.image;
    const url = `${process.env.VITE_APP_BACKEND_URL}/${fileName}`;
    console.log('url', url);
    try {
        (0, utils_1.downloadImage)(res, fileName);
    }
    catch (error) {
        console.error('Failed to fetch and forward the file:', error);
        res.status(500).send('Internal Server Error');
    }
}));
function getFileNameFromUrl(url) {
    return url.substring(url.lastIndexOf('/') + 1);
}
exports.default = router;
//# sourceMappingURL=downloads.js.map