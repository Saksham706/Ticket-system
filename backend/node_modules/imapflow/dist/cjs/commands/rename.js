"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = rename;
const tools_js_1 = require("../tools.js");
/**
 * Renames an existing mailbox.
 *
 * @param connection - IMAP connection instance
 * @param path - Current mailbox path
 * @param newPath - New mailbox path
 * @returns Object with old and new paths, or undefined if preconditions not met
 * @throws If the RENAME command fails
 */
async function rename(connection, path, newPath) {
    if (!(0, tools_js_1.isAuthenticatedState)(connection)) {
        // nothing to do here
        return;
    }
    // Normalize both paths (resolve special names, apply namespace prefix) and encode
    // them for the IMAP wire format (modified UTF-7 for non-ASCII characters).
    path = (0, tools_js_1.normalizePath)(connection, path);
    newPath = (0, tools_js_1.normalizePath)(connection, newPath);
    // Must close/deselect the mailbox before renaming if it's currently selected,
    // as IMAP servers will not rename an active mailbox.
    let selected = (0, tools_js_1.getSelectedMailbox)(connection);
    if (selected && selected.path === path) {
        // UNSELECT where possible, CLOSE would expunge messages flagged \Deleted
        await connection.run('CLOSE', { unselect: true });
    }
    let response;
    try {
        let map = {
            path,
            newPath
        };
        response = await connection.exec('RENAME', [
            { type: 'ATOM', value: (0, tools_js_1.encodePath)(connection, path) },
            { type: 'ATOM', value: (0, tools_js_1.encodePath)(connection, newPath) }
        ]);
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
