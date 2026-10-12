import type { ImapFlow } from '../imap-flow.js';
/**
 * Enables IMAP extensions on the server.
 *
 * @param connection - IMAP connection instance
 * @param extensionList - List of extension names to enable
 * @returns Set of enabled extensions, false on failure, or undefined if not applicable
 */
export default function enable(connection: ImapFlow, extensionList: string[]): Promise<Set<string> | false | undefined>;
