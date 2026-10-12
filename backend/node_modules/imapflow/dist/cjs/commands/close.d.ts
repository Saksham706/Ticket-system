import type { ImapFlow } from '../imap-flow.js';
/**
 * Options for the CLOSE command
 */
export interface CloseCommandOptions {
    /**
     * Only deselect the mailbox: use UNSELECT (RFC 3691, folded into IMAP4rev2) when the server
     * supports it, so messages flagged \Deleted are not expunged as a side effect. Falls back to CLOSE
     */
    unselect?: boolean | undefined;
}
/**
 * Closes the currently selected mailbox.
 *
 * @param connection - IMAP connection instance
 * @param options - Close options
 * @returns True on success, false on failure, or undefined if not in SELECTED state
 */
export default function close(connection: ImapFlow, options?: CloseCommandOptions | undefined): Promise<boolean | undefined>;
