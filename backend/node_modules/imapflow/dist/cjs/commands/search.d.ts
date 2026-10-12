import type { ImapFlow } from '../imap-flow.js';
import type { ESearchResult, SearchObject, SearchOptions } from '../types.js';
/**
 * Searches for messages matching the specified criteria.
 *
 * @param connection - IMAP connection instance
 * @param query - Search query object, or true/empty object to match all messages
 * @param options - Search options
 * @param options.uid - If true, use UID SEARCH instead of SEARCH
 * @param options.returnOptions - ESEARCH RETURN options. When present AND the
 *   server advertises ESEARCH capability, triggers ESEARCH and returns an ESearchResult.
 *   Items are strings ('MIN','MAX','COUNT','ALL') or objects ({ partial: '1:100' }).
 *   When server lacks ESEARCH, falls back to plain SEARCH and returns number[].
 */
export default function search(connection: ImapFlow, query: SearchObject | boolean | null | undefined, options?: SearchOptions | undefined): Promise<number[] | ESearchResult | false>;
