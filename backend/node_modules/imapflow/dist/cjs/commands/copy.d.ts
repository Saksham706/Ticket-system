import type { ImapFlow } from '../imap-flow.js';
import type { CopyResponseObject, MessageRangeOptions } from '../types.js';
/**
 * Copies messages from the current mailbox to another mailbox.
 *
 * @param connection - IMAP connection instance
 * @param range - Message sequence number or UID range
 * @param destination - Destination mailbox path
 * @param options - Copy options
 * @param options.uid - If true, use UID COPY instead of COPY
 * @returns Copy result with UID mapping if available, false on failure, or undefined if preconditions not met
 */
export default function copy(connection: ImapFlow, range: string, destination: string | string[], options?: MessageRangeOptions | undefined): Promise<CopyResponseObject | false | undefined>;
