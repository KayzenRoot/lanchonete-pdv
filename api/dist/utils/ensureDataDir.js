"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureDataDirectoryExists = ensureDataDirectoryExists;
/**
 * Utility to ensure the data directory exists for SQLite database
 */
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function ensureDataDirectoryExists() {
    const dataDir = process.env.NODE_ENV === 'production'
        ? '/opt/render/project/src/data'
        : path_1.default.join(__dirname, '../../data');
    if (!fs_1.default.existsSync(dataDir)) {
        console.log(`Creating data directory at ${dataDir}`);
        fs_1.default.mkdirSync(dataDir, { recursive: true });
    }
    else {
        console.log(`Data directory exists at ${dataDir}`);
    }
}
