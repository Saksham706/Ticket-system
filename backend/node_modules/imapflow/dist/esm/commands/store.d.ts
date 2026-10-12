import type { ImapFlow } from '../imap-flow.js';
import type { StoreOptions } from '../types.js';
/**
 * Options for the STORE command
 */
export interface StoreCommandOptions extends StoreOptions {
    /** Operation type: 'set', 'add', or 'remove' */
    operation?: string | undefined;
}
/**
 * Updates flags or labels for messages in the selected mailbox.
 *
 * @param connection - IMAP connection instance
 * @param range - Message sequence number or UID range
 * @param flags - Flag(s) to set, add, or remove
 * @param options - Store options
 * @returns True on success, false on failure or if nothing to do
 */
export default function store(connection: ImapFlow, range: string, flags: string | string[], options?: StoreCommandOptions | undefined): Promise<boolean>;
