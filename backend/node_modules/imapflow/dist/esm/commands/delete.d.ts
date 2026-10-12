import type { ImapFlow } from '../imap-flow.js';
import type { MailboxDeleteResponse } from '../types.js';
/**
 * Deletes an existing mailbox.
 *
 * @param connection - IMAP connection instance
 * @param path - Mailbox path to delete
 * @returns Object with the deleted path, or undefined if preconditions not met
 * @throws If the DELETE command fails
 */
export default function deleteMailbox(connection: ImapFlow, path: string | string[]): Promise<MailboxDeleteResponse | undefined>;
