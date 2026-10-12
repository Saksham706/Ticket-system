import type { ImapFlow } from '../imap-flow.js';
/**
 * Refreshes capabilities from server.
 *
 * @param connection - IMAP connection instance
 * @returns Server capabilities map, or false on failure
 */
export default function capability(connection: ImapFlow): Promise<Map<string, boolean | number> | false>;
