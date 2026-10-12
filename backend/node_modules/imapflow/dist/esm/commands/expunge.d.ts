import type { ImapFlow } from '../imap-flow.js';
import type { MessageRangeOptions } from '../types.js';
/**
 * Deletes specified messages by flagging them as Deleted and expunging.
 *
 * @param connection - IMAP connection instance
 * @param range - Message sequence number or UID range
 * @param options - Expunge options
 * @param options.uid - If true, use UID EXPUNGE when UIDPLUS is available
 * @returns True on success, false on failure, or undefined if preconditions not met
 */
export default function expunge(connection: ImapFlow, range: string, options?: MessageRangeOptions | undefined): Promise<boolean | undefined>;
