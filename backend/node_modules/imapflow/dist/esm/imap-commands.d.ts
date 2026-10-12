import type { ImapFlow } from './imap-flow.js';
/**
 * A command implementation: receives the connection and the arguments passed to
 * `ImapFlow#run()` for that command
 */
export type CommandHandler = (connection: ImapFlow, ...args: any[]) => Promise<any>;
/**
 * IMAP command registry. Maps IMAP command names (uppercase strings) to their
 * corresponding implementation modules from the `commands/` directory.
 *
 * Each entry maps a command name (e.g., "FETCH", "SELECT", "IDLE") to a function
 * that builds the command request and processes the server response. This Map is
 * used by the main ImapFlow client to look up and execute IMAP commands.
 */
declare const imapCommands: Map<string, CommandHandler>;
export default imapCommands;
