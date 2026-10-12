import type { ImapFlow } from '../imap-flow.js';
import type { MailboxObject, MailboxOpenOptions } from '../types.js';
/** SELECT/EXAMINE options, the QRESYNC parameters are part of the public mailboxOpen() options */
export type SelectOptions = MailboxOpenOptions;
/**
 * Selects or examines a mailbox, making it the current mailbox for subsequent operations.
 *
 * @param connection - IMAP connection instance
 * @param path - Mailbox path to select
 * @param options - Select options, see MailboxOpenOptions
 * @returns Mailbox info object with path, flags, exists, uidNext, uidValidity, highestModseq, etc., or undefined if preconditions not met
 * @throws If the SELECT/EXAMINE command fails
 */
export default function select(connection: ImapFlow, pathInput: string | string[], options?: SelectOptions | undefined): Promise<MailboxObject | undefined>;
