import type { ImapFlow } from '../imap-flow.js';
import type { StatusObject, StatusQuery } from '../types.js';
/**
 * Requests status information about a mailbox.
 *
 * @param connection - IMAP connection instance
 * @param path - Mailbox path to query
 * @param query - Status data items to request (e.g., {messages: true, uidNext: true, unseen: true})
 * @returns Status information object, or false if preconditions not met or on failure
 * @throws {Error} If the mailbox does not exist
 */
export default function status(connection: ImapFlow, path: string | string[], query: StatusQuery | undefined): Promise<StatusObject | false>;
