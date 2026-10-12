"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setSubscription = setSubscription;
const tools_js_1 = require("../tools.js");
/**
 * Runs SUBSCRIBE or UNSUBSCRIBE for a mailbox, the shared body of the two commands.
 *
 * @param connection - IMAP connection instance
 * @param command - SUBSCRIBE or UNSUBSCRIBE
 * @param path - Mailbox path
 * @returns True on success, false on failure, or undefined if preconditions not met
 */
async function setSubscription(connection, command, path) {
    if (!(0, tools_js_1.isAuthenticatedState)(connection)) {
        // nothing to do here
        return;
    }
    path = (0, tools_js_1.normalizePath)(connection, path);
    let response;
    try {
        response = await connection.exec(command, [{ type: 'ATOM', value: (0, tools_js_1.encodePath)(connection, path) }]);
        response.next();
        return true;
    }
    catch (err) {
        await (0, tools_js_1.reportCommandError)(connection, err);
        return false;
    }
}
