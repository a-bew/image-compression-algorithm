"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').config(); // Load environment variables from .env file
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
// import db from './database';
const uploads_1 = __importDefault(require("./routes/uploads"));
const downloads_1 = __importDefault(require("./routes/downloads"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
let srcPath = 'src';
if (process.env.NODE_ENV === 'production') {
    srcPath = 'dist';
}
// console.log("process.env.NODE_ENV", process.env.NODE_ENV);
app.use(express_1.default.static(`${srcPath}/utils/tmp`));
// Body parser middleware
app.use(body_parser_1.default.urlencoded({ extended: false }));
app.use(body_parser_1.default.json());
// Cors middleware
app.use((0, cors_1.default)());
// // Define your routes here
// app.get('/', async (req, res) => {
//   const data = await db.select().from('my_table');
//   res.send(data);
// });
app.use('/upload', uploads_1.default);
app.use('/download', downloads_1.default);
// Start the server
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
//# sourceMappingURL=index.js.map