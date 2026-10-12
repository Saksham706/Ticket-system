import type { ImapFlow } from './imap-flow.js';
import type { DownloadManyOptions, DownloadManyResult, DownloadNotFound, DownloadObject, DownloadOptions, SequenceString } from './types.js';
/**
 * Implements ImapFlow.download(), see its documentation
 *
 * @param client - Connection to download from
 * @param range - UID or sequence number of the message
 * @param part - Body part to download, the whole message when not set
 * @param options - Download options
 * @returns The download, or an empty object when there is nothing to download
 */
export declare function downloadMessage(client: ImapFlow, range: SequenceString, part?: string | undefined, options?: DownloadOptions | undefined): Promise<DownloadObject | DownloadNotFound>;
/**
 * Implements ImapFlow.downloadMany(), see its documentation
 *
 * @param client - Connection to download from
 * @param range - UID or sequence number of the message
 * @param parts - Body parts to download
 * @param options - Download options
 * @returns Downloaded parts keyed by part number
 */
export declare function downloadMessageParts(client: ImapFlow, range: SequenceString, parts: string[], options?: DownloadManyOptions | undefined): Promise<DownloadManyResult>;
