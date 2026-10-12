import type { ImapFlow } from '../imap-flow.js';
/**
 * Listens for changes in the selected mailbox using IDLE or NOOP polling fallback.
 *
 * @param connection - IMAP connection instance
 * @param maxIdleTime - Maximum time in milliseconds to stay in IDLE before restarting
 * @returns Void on success, false on failure, or undefined if not in SELECTED state
 */
export default function idle(connection: ImapFlow, maxIdleTime?: number | false | undefined): Promise<void | false | undefined>;
