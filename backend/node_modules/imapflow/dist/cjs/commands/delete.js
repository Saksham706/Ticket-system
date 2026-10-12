"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = deleteMailbox;
const tools_js_1 = require("../tools.js");
/**
 * Deletes an existing mailbox.
 *
 * @param connection - IMAP connection instance
 * @param path - Mailbox path to delete
 * @returns Object with the deleted path, or undefined if preconditions not met
 * @throws If the DELETE command fails
 */
async function deleteMailbox(connection, path) {
    if (!(0, tools_js_1.isAuthenticatedState)(connection)) {
        // nothing to do here
        return;
    }
    path = (0, tools_js_1.normalizePath)(connection, path);
    // If the mailbox to delete is currently selected, we must close/deselect it first.
    // IMAP servers reject DELETE on the currently selected mailbox (RFC 3501 6.3.4).
    let selected = (0, tools_js_1.getSelectedMailbox)(connection);
    if (selected && selected.path === path) {
        // UNSELECT where possible, CLOSE would expunge messages flagged \Deleted
        await connection.run('CLOSE', { unselect: true });
    }
    let response;
    try {
        let map = {
            path
        };
        response = await connection.exec('DELETE', [{ type: 'ATOM', value: (0, tools_js_1.encodePath)(connection, path) }]);
        response.next();
        return map;
    }
    catch (err) {
        await (0, tools_js_1.reportCommandError)(connection, err);
        throw err;
    }
}
module.exports = exports.default;
Object.defineProperty(module.exports, 'default', { value: exports.default, enumerable: false, writable: true, configurable: true });
