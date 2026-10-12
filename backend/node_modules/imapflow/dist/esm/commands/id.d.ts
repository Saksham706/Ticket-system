import type { ImapFlow } from '../imap-flow.js';
import type { IdInfoObject } from '../types.js';
/**
 * Sends ID info to the server and updates server info data based on the response.
 *
 * @param connection - IMAP connection instance
 * @param clientInfo - Client identification key-value pairs to send to the server
 * @returns Server information map, false on failure, or undefined if ID not supported
 */
export default function id(connection: ImapFlow, clientInfo?: IdInfoObject | null | undefined): Promise<IdInfoObject | false | undefined>;
