import type { ImapFlow } from '../imap-flow.js';
import type { FetchMessageObject, FetchOptions, FetchQueryObject } from '../types.js';
/**
 * Options for the FETCH command
 */
export interface FetchCommandOptions extends Omit<FetchOptions, 'changedSince'> {
    /** Only fetch messages changed since this modseq value */
    changedSince?: bigint | number | string | undefined;
    /** Callback for processing each fetched message individually. Call `next()` to release the next message */
    onUntaggedFetch?: ((message: FetchMessageObject, next: (err?: Error | null | undefined) => void) => void) | undefined;
}
/**
 * Result of the FETCH command
 */
export interface FetchCommandResult {
    /** Number of untagged FETCH responses received */
    count: number;
    /** Formatted messages, empty when `onUntaggedFetch` consumed them */
    list: FetchMessageObject[];
}
/**
 * Fetches emails from the server.
 *
 * @param connection - IMAP connection instance
 * @param range - Message sequence number or UID range
 * @param query - Fetch query specifying which data to retrieve (e.g., flags, envelope, bodyStructure, headers, source, bodyParts)
 * @param options - Fetch options
 * @returns Object with message count and list, or undefined if not in SELECTED state
 */
export default function fetch(connection: ImapFlow, range: string, query: FetchQueryObject, options?: FetchCommandOptions | undefined): Promise<FetchCommandResult | undefined>;
