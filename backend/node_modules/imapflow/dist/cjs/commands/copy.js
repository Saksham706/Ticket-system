"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = copy;
const tools_js_1 = require("../tools.js");
const copyuid_parser_js_1 = require("./copyuid-parser.js");
/**
 * Copies messages from the current mailbox to another mailbox.
 *
 * @param connection - IMAP connection instance
 * @param range - Message sequence number or UID range
 * @param destination - Destination mailbox path
 * @param options - Copy options
 * @param options.uid - If true, use UID COPY instead of COPY
 * @returns Copy result with UID mapping if available, false on failure, or undefined if preconditions not met
 */
async function copy(connection, range, destination, options) {
    let mailbox = (0, tools_js_1.getSelectedMailbox)(connection);
    if (!mailbox || !range || !destination) {
        // nothing to do here
        return;
    }
    options = options || {};
    destination = (0, tools_js_1.normalizePath)(connection, destination);
    let attributes = [
        { type: 'SEQUENCE', value: range },
        { type: 'ATOM', value: (0, tools_js_1.encodePath)(connection, destination) }
    ];
    let response;
    try {
        response = await connection.exec(options.uid ? 'UID COPY' : 'COPY', attributes);
        response.next();
        let map = { path: mailbox.path, destination };
        // UIDPLUS (RFC 4315): the server may include a COPYUID response code in the
        // tagged OK response, providing a mapping from source UIDs to destination UIDs.
        (0, copyuid_parser_js_1.parseCopyUid)(response.response, map);
        return map;
    }
    catch (err) {
        await (0, tools_js_1.reportCommandError)(connection, err);
        return false;
    }
}
module.exports = exports.default;
Object.defineProperty(module.exports, 'default', { value: exports.default, enumerable: false, writable: true, configurable: true });
