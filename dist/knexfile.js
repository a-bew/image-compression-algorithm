"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const config = {
    client: 'sqlite3',
    connection: {
        filename: path_1.default.join(__dirname, './data/mydatabase.sqlite'),
    },
    useNullAsDefault: true,
    migrations: {
        directory: path_1.default.join(__dirname, './migrations'),
    },
    seeds: {
        directory: path_1.default.join(__dirname, './seeds'),
    },
};
exports.default = config;
//# sourceMappingURL=knexfile.js.map