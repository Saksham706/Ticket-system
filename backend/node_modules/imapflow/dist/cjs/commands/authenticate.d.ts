import type { ImapFlow } from '../imap-flow.js';
import type { AuthOptions } from '../types.js';
/**
 * Credentials for the AUTHENTICATE command: the auth options, with the password passed as `password`
 */
export interface AuthenticateCredentials extends Omit<AuthOptions, 'user' | 'pass'> {
    /** Password for PLAIN or LOGIN authentication */
    password?: string | undefined;
}
/**
 * Authenticates user using the best available method.
 *
 * @param connection - IMAP connection instance
 * @param username - The username to authenticate with
 * @param credentials - Authentication credentials
 * @returns The authenticated username, or undefined if already authenticated
 * @throws {Error} If no supported authentication mechanism is available or if authentication fails
 */
export default function authenticate(connection: ImapFlow, username: string, { accessToken, password, loginMethod, authzid }: AuthenticateCredentials): Promise<string | undefined>;
