import type { ImapFlow } from '../imap-flow.js';
/**
 * Sends a NOOP command to the server.
 *
 * @param connection - IMAP connection instance
 * @returns True on success, false on failure
 */
export default function noop(connection: ImapFlow): Promise<boolean>;
