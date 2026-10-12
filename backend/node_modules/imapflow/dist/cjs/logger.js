"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDefaultLogger = getDefaultLogger;
exports.createConnectionLogger = createConnectionLogger;
const pino_1 = __importDefault(require("pino"));
let logger = null;
/**
 * Returns the shared default logger, used when a connection is given no logger of its own.
 * Created on first use, so importing the library does not set up a stdout logger nobody asked
 * for. Level info: a caller that asks for raw socket data (logRaw) lowers its own child logger
 * to trace.
 *
 * @returns The default pino logger
 */
function getDefaultLogger() {
    if (!logger) {
        logger = (0, pino_1.default)({ level: 'info' });
    }
    return logger;
}
/**
 * Returns the child of the default logger a connection logs through when it was given no
 * logger of its own.
 *
 * @param options - cid is the connection id to stamp on entries, logRaw asks for raw socket data
 * @returns A child logger of the default logger
 */
function createConnectionLogger(options) {
    let child = getDefaultLogger().child({
        component: 'imap-connection',
        cid: options.cid
    });
    // Raw socket data is logged at trace level, so asking for it lowers the threshold
    if (options.logRaw) {
        child.level = 'trace';
    }
    return child;
}
