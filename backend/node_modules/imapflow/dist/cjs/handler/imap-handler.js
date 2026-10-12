"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.compiler = exports.parser = void 0;
const imap_parser_js_1 = __importDefault(require("./imap-parser.js"));
exports.parser = imap_parser_js_1.default;
const imap_compiler_js_1 = __importDefault(require("./imap-compiler.js"));
exports.compiler = imap_compiler_js_1.default;
