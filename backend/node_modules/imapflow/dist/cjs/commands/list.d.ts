import type { ImapFlow } from '../imap-flow.js';
import type { ListOptions, ListResponse } from '../types.js';
/**
 * Lists mailboxes from the server, including subscription status and special-use flags.
 *
 * @param connection - IMAP connection instance
 * @param reference - Reference name (namespace prefix)
 * @param mailbox - Mailbox name pattern with possible wildcards
 * @param options - List options
 * @param options.listOnly - If true, return entries after LIST without LSUB or status queries
 * @param options.statusQuery - Status data items to query for each listed mailbox
 * @param options.specialUseHints - Hints mapping mailbox paths to special-use types (sent, junk, trash, drafts, archive)
 * @returns Array of mailbox entries sorted by special-use flags and name
 * @throws If the LIST command fails
 */
export default function list(connection: ImapFlow, reference: string | undefined, mailbox: string | undefined, options?: ListOptions | undefined): Promise<ListResponse[]>;
