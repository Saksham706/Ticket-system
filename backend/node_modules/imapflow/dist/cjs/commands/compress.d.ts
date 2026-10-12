import type { ImapFlow } from '../imap-flow.js';
/**
 * Requests DEFLATE compression from the server.
 *
 * @param connection - IMAP connection instance
 * @returns True if compression was enabled, false otherwise
 */
export default function compress(connection: ImapFlow): Promise<boolean>;
