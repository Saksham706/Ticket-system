"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = noop;
/**
 * Sends a NOOP command to the server.
 *
 * @param connection - IMAP connection instance
 * @returns True on success, false on failure
 */
async function noop(connection) {
    try {
        let response = await connection.exec('NOOP', false, { comment: 'Requested by command' });
        response.next();
        return true;
    }
    catch (err) {
        connection.log.warn({ err, cid: connection.id });
        return false;
    }
}
module.exports = exports.default;
Object.defineProperty(module.exports, 'default', { value: exports.default, enumerable: false, writable: true, configurable: true });
