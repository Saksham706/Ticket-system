"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = login;
const tools_js_1 = require("../tools.js");
/**
 * Authenticates user using the IMAP LOGIN command.
 *
 * @param connection - IMAP connection instance
 * @param username - The username to authenticate with
 * @param password - The password to authenticate with
 * @returns The authenticated username, or undefined if already authenticated
 * @throws If authentication fails, with authenticationFailed and serverResponseCode properties set
 */
async function login(connection, username, password) {
    if (connection.state !== connection.states.NOT_AUTHENTICATED) {
        // nothing to do here
        return;
    }
    try {
        let response = await connection.exec('LOGIN', [
            { type: 'STRING', value: username },
            // sensitive: true prevents the password from appearing in debug logs
            { type: 'STRING', value: password, sensitive: true }
        ]);
        response.next();
        // Record that LOGIN was the method used, so the connection knows which
        // auth mechanism succeeded (used for reconnection and diagnostics).
        connection.authCapabilities.set('LOGIN', true);
        return username;
    }
    catch (err) {
        let errorCode = (0, tools_js_1.getStatusCode)(err.response);
        if (errorCode) {
            err.serverResponseCode = errorCode;
        }
        // Only a tagged NO/BAD is the server refusing the credentials; a lost connection or a
        // timeout during LOGIN says nothing about them, and a caller may retry it
        if ((0, tools_js_1.isServerRefusal)(err)) {
            err.authenticationFailed = true;
        }
        err.response = await (0, tools_js_1.getErrorText)(err.response);
        throw err;
    }
}
module.exports = exports.default;
Object.defineProperty(module.exports, 'default', { value: exports.default, enumerable: false, writable: true, configurable: true });
