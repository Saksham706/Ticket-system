import type { ImapFlow } from '../imap-flow.js';
/**
 * Runs SUBSCRIBE or UNSUBSCRIBE for a mailbox, the shared body of the two commands.
 *
 * @param connection - IMAP connection instance
 * @param command - SUBSCRIBE or UNSUBSCRIBE
 * @param path - Mailbox path
 * @returns True on success, false on failure, or undefined if preconditions not met
 */
export declare function setSubscription(connection: ImapFlow, command: 'SUBSCRIBE' | 'UNSUBSCRIBE', path: string | string[]): Promise<boolean | undefined>;
