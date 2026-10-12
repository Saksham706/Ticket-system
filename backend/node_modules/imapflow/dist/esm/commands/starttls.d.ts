import type { ImapFlow } from '../imap-flow.js';
/**
 * Initiates STARTTLS connection upgrade.
 *
 * @param connection - IMAP connection instance
 * @returns True if STARTTLS was initiated, false if not supported or already secure
 */
export default function starttls(connection: ImapFlow): Promise<boolean>;
