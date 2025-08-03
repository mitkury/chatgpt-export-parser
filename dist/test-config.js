"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TEST_CONFIG = void 0;
exports.getTestArchivePath = getTestArchivePath;
exports.testArchiveExists = testArchiveExists;
const path = __importStar(require("path"));
// Test data configuration
exports.TEST_CONFIG = {
    // Default test archive path
    defaultArchive: path.join(process.cwd(), 'data', 'chatgpt-august-2-2025.zip'),
    // Alternative test archives (for future use)
    archives: {
        default: path.join(process.cwd(), 'data', 'chatgpt-august-2-2025.zip'),
        // Add more archives here as needed:
        // large: path.join(process.cwd(), 'data', 'large-export.zip'),
        // small: path.join(process.cwd(), 'data', 'small-export.zip'),
    }
};
// Helper function to get test archive path
function getTestArchivePath(archiveName = 'default') {
    return exports.TEST_CONFIG.archives[archiveName];
}
// Helper function to check if test archive exists
function testArchiveExists(archiveName = 'default') {
    const fs = require('fs');
    return fs.existsSync(getTestArchivePath(archiveName));
}
//# sourceMappingURL=test-config.js.map