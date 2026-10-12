import type { ImapFlow } from './imap-flow.js';
import type { ImapAttributeNode } from './handler/types.js';
import type { SearchObject } from './types.js';
/**
 * A compiled search attribute: a token, or a parenthesized group of tokens
 */
export type SearchAttribute = ImapAttributeNode | SearchAttribute[];
/**
 * Compiles a JavaScript object query into IMAP search command attributes.
 * Supports standard IMAP search criteria and extensions like OBJECTID and Gmail extensions.
 *
 * @param connection - IMAP connection object (capabilities and enabled extensions are read)
 * @param query - Search query object
 * @returns Array of IMAP search attributes
 * @throws {Error} When required server extensions are not available
 *
 * @example
 * // Simple search for unseen messages from a sender
 * searchCompiler(connection, {
 *   unseen: true,
 *   from: 'sender@example.com'
 * });
 *
 * @example
 * // Complex OR search with date range
 * searchCompiler(connection, {
 *   or: [
 *     { from: 'alice@example.com' },
 *     { from: 'bob@example.com' }
 *   ],
 *   since: new Date('2024-01-01')
 * });
 */
export declare const searchCompiler: (connection: ImapFlow, query: SearchObject) => SearchAttribute[];
