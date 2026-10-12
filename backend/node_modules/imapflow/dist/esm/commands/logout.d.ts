import type { ImapFlow } from '../imap-flow.js';
/**
 * Logs out the user and closes the connection.
 *
 * @param connection - IMAP connection instance
 * @returns True if logout command succeeded, false otherwise
 */
export default function logout(connection: ImapFlow): Promise<boolean>;
