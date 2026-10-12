import type { ImapFlow } from '../imap-flow.js';
import type { MailboxCreateResponse } from '../types.js';
/**
 * Creates a new mailbox and subscribes to it.
 *
 * @param connection - IMAP connection instance
 * @param path - Mailbox path to create
 * @returns Object with path and creation status, or undefined if preconditions not met
 * @throws If the CREATE command fails (except when mailbox already exists)
 */
export default function create(connection: ImapFlow, path: string | string[]): Promise<MailboxCreateResponse | undefined>;
