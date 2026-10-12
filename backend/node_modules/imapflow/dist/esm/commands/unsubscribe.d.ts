import type { ImapFlow } from '../imap-flow.js';
/**
 * Unsubscribes from a mailbox.
 *
 * @param connection - IMAP connection instance
 * @param path - Mailbox path to unsubscribe from
 * @returns True on success, false on failure, or undefined if preconditions not met
 */
export default function unsubscribe(connection: ImapFlow, path: string | string[]): Promise<boolean | undefined>;
