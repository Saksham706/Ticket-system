import type { ImapFlow } from '../imap-flow.js';
/**
 * Authenticates user using the IMAP LOGIN command.
 *
 * @param connection - IMAP connection instance
 * @param username - The username to authenticate with
 * @param password - The password to authenticate with
 * @returns The authenticated username, or undefined if already authenticated
 * @throws If authentication fails, with authenticationFailed and serverResponseCode properties set
 */
export default function login(connection: ImapFlow, username: string, password: string): Promise<string | undefined>;
