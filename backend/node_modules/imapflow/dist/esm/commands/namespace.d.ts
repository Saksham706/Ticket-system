import type { ImapFlow } from '../imap-flow.js';
import type { NamespaceObject } from '../types.js';
/**
 * Returned instead of a namespace when the NAMESPACE command failed
 */
export interface NamespaceErrorResult {
    error: true;
    status: string | undefined;
    text: string | undefined;
}
/**
 * Prefix and delimiter derived from `LIST "" ""`
 */
export interface ListPrefixInfo {
    flags?: Set<string> | undefined;
    delimiter?: string | null | undefined;
    prefix?: string | undefined;
}
/**
 * Requests NAMESPACE info from the server.
 *
 * @param connection - IMAP connection instance
 * @returns The primary personal namespace, or an error object on failure
 */
export default function namespace(connection: ImapFlow): Promise<NamespaceObject | NamespaceErrorResult | undefined>;
