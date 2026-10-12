import { normalizePath, encodePath, hasCapability, reportCommandError, getSelectedMailbox } from '../tools.js';
import { parseCopyUid } from './copyuid-parser.js';
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
export default async function move(connection, range, destination, options) {
    let mailbox = getSelectedMailbox(connection);
    if (!mailbox || !range || !destination) {
        // nothing to do here
        return;
    }
    options = options || {};
    destination = normalizePath(connection, destination);
    let attributes = [
        { type: 'SEQUENCE', value: range },
        { type: 'ATOM', value: encodePath(connection, destination) }
    ];
    let map = { path: mailbox.path, destination };
    // Fallback for servers without the MOVE extension (RFC 6851):
    // emulate MOVE using COPY + flag as \Deleted + EXPUNGE.
    if (!hasCapability(connection, 'MOVE')) {
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
                    parseCopyUid(untagged, map);
                }
            }
        });
        response.next();
        parseCopyUid(response.response, map);
        return map;
    }
    catch (err) {
        await reportCommandError(connection, err);
        return false;
    }
}
