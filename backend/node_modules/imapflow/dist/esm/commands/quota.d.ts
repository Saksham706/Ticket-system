import type { ImapFlow } from '../imap-flow.js';
import type { QuotaResponse } from '../types.js';
/**
 * Requests quota information for a mailbox.
 *
 * @param connection - IMAP connection instance
 * @param path - Mailbox path to query quota for
 * @returns Quota information object, false if QUOTA not supported or on failure, or undefined if preconditions not met
 */
export default function quota(connection: ImapFlow, path: string | string[]): Promise<QuotaResponse | false | undefined>;
