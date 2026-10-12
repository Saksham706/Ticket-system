import { emitSafe, hasCapability } from '../tools.js';
/**
 * Closes the currently selected mailbox.
 *
 * @param connection - IMAP connection instance
 * @param options - Close options
 * @returns True on success, false on failure, or undefined if not in SELECTED state
 */
export default async function close(connection, options) {
    if (connection.state !== connection.states.SELECTED) {
        // nothing to do here
        return;
    }
    let response;
    try {
        // IMAP CLOSE (RFC 3501 6.4.2): permanently removes all messages flagged \Deleted
        // from the currently selected mailbox (implicit expunge) and deselects it.
        // Unlike EXPUNGE, CLOSE does not send individual untagged EXPUNGE responses.
        // UNSELECT deselects the same way without removing anything.
        response = await connection.exec(options?.unselect && hasCapability(connection, 'UNSELECT') ? 'UNSELECT' : 'CLOSE');
        response.next();
        // Transition from SELECTED back to AUTHENTICATED state.
        // Clear mailbox metadata so subsequent operations know no mailbox is selected.
        let currentMailbox = connection.mailbox;
        connection.mailbox = false;
        connection.currentSelectCommand = false;
        connection.state = connection.states.AUTHENTICATED;
        if (currentMailbox) {
            emitSafe(connection, 'mailboxClose', currentMailbox);
        }
        return true;
    }
    catch (err) {
        connection.log.warn({ err, cid: connection.id });
        return false;
    }
}
