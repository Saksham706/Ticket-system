import net from 'node:net';
import { ConnectionDeadline } from './connection-deadline.js';
import type { InternalLogger } from './types.js';
/**
 * A socket handed out by the proxy helpers, carrying the early error handler installed by
 * attachEarlyErrorHandler() until the caller takes ownership
 */
export type ProxySocket = net.Socket & {
    _earlyErrorHandler?: ((err: Error) => void) | null | undefined;
};
export interface ProxyConnectionOptions {
    /**
     * Shared connection deadline. Proxy DNS and negotiation run inside it, so a stalled proxy
     * cannot exceed the configured connectionTimeout.
     */
    deadline?: ConnectionDeadline | undefined;
    /** Used to build a deadline when none was passed */
    connectionTimeout?: number | undefined;
}
declare const detachEarlyErrorHandler: (socket: ProxySocket | false | null | undefined) => void;
/**
 * Opens a socket to `host`:`port` through the configured proxy.
 *
 * @param logger Logger instance.
 * @param connectionUrl Proxy URL (http, https, socks, socks4, socks4a, socks5).
 * @param host Destination host, passed through unresolved wherever the proxy protocol
 *   can resolve it itself.
 * @param port Destination port.
 * @param options Deadline options, see ProxyConnectionOptions.
 * @returns The tunnelled socket, or undefined for an unknown protocol.
 */
declare const proxyConnection: (logger: InternalLogger, connectionUrl: string, host: string, port: number, options?: ProxyConnectionOptions | undefined) => Promise<ProxySocket | undefined>;
export { proxyConnection, detachEarlyErrorHandler };
