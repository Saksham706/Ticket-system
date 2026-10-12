"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = starttls;
/**
 * Initiates STARTTLS connection upgrade.
 *
 * @param connection - IMAP connection instance
 * @returns True if STARTTLS was initiated, false if not supported or already secure
 */
async function starttls(connection) {
    if (!connection.capabilities.has('STARTTLS') || connection.secureConnection) {
        // nothing to do here
        return false;
    }
    let response;
    try {
        response = await connection.exec('STARTTLS');
        // Whether the server sent anything after the STARTTLS OK and before the TLS
        // handshake. upgradeToSTARTTLS() uses this to reject a plaintext injection.
        connection._starttlsHadTrailingData = !!(response && response.hasTrailingData);
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
