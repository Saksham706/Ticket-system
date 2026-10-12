import { encodePath, normalizePath, isAuthenticatedState, reportCommandError } from '../tools.js';
/**
 * Runs SUBSCRIBE or UNSUBSCRIBE for a mailbox, the shared body of the two commands.
 *
 * @param connection - IMAP connection instance
 * @param command - SUBSCRIBE or UNSUBSCRIBE
 * @param path - Mailbox path
 * @returns True on success, false on failure, or undefined if preconditions not met
 */
export async function setSubscription(connection, command, path) {
    if (!isAuthenticatedState(connection)) {
        // nothing to do here
        return;
    }
    path = normalizePath(connection, path);
    let response;
    try {
        response = await connection.exec(command, [{ type: 'ATOM', value: encodePath(connection, path) }]);
        response.next();
        return true;
    }
    catch (err) {
        await reportCommandError(connection, err);
        return false;
    }
}
