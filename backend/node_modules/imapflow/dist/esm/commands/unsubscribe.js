import { setSubscription } from './subscription.js';
/**
 * Unsubscribes from a mailbox.
 *
 * @param connection - IMAP connection instance
 * @param path - Mailbox path to unsubscribe from
 * @returns True on success, false on failure, or undefined if preconditions not met
 */
export default async function unsubscribe(connection, path) {
    return await setSubscription(connection, 'UNSUBSCRIBE', path);
}
