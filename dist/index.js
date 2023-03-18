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
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const database_1 = __importDefault(require("./database"));
const uploads_1 = __importDefault(require("./routes/uploads"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
let srcPath = 'src';
if (process.env.NODE_ENV === 'production') {
    srcPath = 'dist';
}
app.use(express_1.default.static(`${srcPath}/utils/tmp`));
// Body parser middleware
app.use(body_parser_1.default.urlencoded({ extended: false }));
app.use(body_parser_1.default.json());
// Cors middleware
app.use((0, cors_1.default)());
// Define your routes here
app.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield database_1.default.select().from('my_table');
    res.send(data);
}));
app.use('/upload', uploads_1.default);
// Start the server
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
//# sourceMappingURL=index.js.map