"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = move;
const tools_js_1 = require("../tools.js");
const copyuid_parser_js_1 = require("./copyuid-parser.js");
/**
 * Moves messages from the current mailbox to another mailbox.
 *
 * @param connection - IMAP connection instance
 * @param range - Message sequence number or UID range
 * @param destination - Destination mailbox path
 * @param options - Move options
 * @param options.uid - If true, use UID MOVE instead of MOVE
 * @returns Move result with UID mapping if available, false on failure, or undefined if preconditions not met
 */
async function move(connection, range, destination, options) {
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
    let map = { path: mailbox.path, destination };
    // Fallback for servers without the MOVE extension (RFC 6851):
    // emulate MOVE using COPY + flag as \Deleted + EXPUNGE.
    if (!(0, tools_js_1.hasCapability)(connection, 'MOVE')) {
        let result = await connection.messageCopy(range, destination, options);
        if (!result) {
            // The source must stay untouched when the copy failed, otherwise the messages are lost
            return result;
        }
        let deleted = await connection.messageDelete(range, Object.assign({ silent: true }, options));
        // Messages that were copied but not removed from the source mean the move did not complete
        return deleted ? result : false;
    }
    let response;
    try {
        // Some servers send COPYUID in an untagged OK before the tagged response,
        // others include it in the tagged OK. We check both to be safe.
        response = await connection.exec(options.uid ? 'UID MOVE' : 'MOVE', attributes, {
            untagged: {
                OK: async (untagged) => {
                    (0, copyuid_parser_js_1.parseCopyUid)(untagged, map);
                }
            }
        });
        response.next();
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
