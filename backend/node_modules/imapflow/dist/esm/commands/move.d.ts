import type { ImapFlow } from '../imap-flow.js';
import type { CopyResponseObject, MessageRangeOptions } from '../types.js';
/**
 * Moves messages from the current mailbox to another mailbox.
 *
 * @param connection - IMAP connection instance
 * @param range - Message sequence number or UID range
 * @param destination - Destination mailbox path
 * @param options - Move options
 * @param options.uid - If true, use UID MOVE instead of MOVE
 * @returns Move result with UID mapping if available, false on failure, or undefined if preconditions not met
 */
export default function move(connection: ImapFlow, range: string, destination: string | string[], options?: MessageRangeOptions | undefined): Promise<CopyResponseObject | false | undefined>;
