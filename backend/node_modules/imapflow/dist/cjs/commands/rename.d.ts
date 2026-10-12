import type { ImapFlow } from '../imap-flow.js';
import type { MailboxRenameResponse } from '../types.js';
/**
 * Renames an existing mailbox.
 *
 * @param connection - IMAP connection instance
 * @param path - Current mailbox path
 * @param newPath - New mailbox path
 * @returns Object with old and new paths, or undefined if preconditions not met
 * @throws If the RENAME command fails
 */
export default function rename(connection: ImapFlow, path: string | string[], newPath: string | string[]): Promise<MailboxRenameResponse | undefined>;
