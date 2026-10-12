import { Transform, type TransformCallback } from 'node:stream';
import type { Logger, InternalLogger } from '../types.js';
export interface ImapStreamOptions {
    /** Connection identifier used for logging */
    cid?: string | undefined;
    /** A pino-compatible logger instance. If not provided, a default child logger is created */
    logger?: Logger | InternalLogger | false | undefined;
    /** If true, logs raw socket data at trace level */
    logRaw?: boolean | undefined;
    /** Whether the connection uses TLS */
    secureConnection?: boolean | undefined;
    /**
     * Maximum allowed length (in bytes) of a single line (a response without a literal). Defaults
     * to MAX_LITERAL_SIZE (1GB). Guards against a malicious or broken server that never sends a
     * line terminator, which would otherwise grow the internal line buffer without bound. The line
     * terminator counts toward the limit, and a line exactly at the limit is accepted. Exceeding it
     * is terminal: the stream is destroyed with a `LineTooLarge` error and no further input is parsed.
     */
    maxLineLength?: number | undefined;
    /**
     * Maximum allowed size (in bytes) of a single literal block. Defaults to MAX_LITERAL_SIZE
     * (1GB). Lower it to bound peak memory allocation against a malicious or broken server
     * announcing an oversized literal. A literal exactly at the limit is accepted. Exceeding it is
     * terminal: the stream is destroyed with a `LiteralTooLarge` error, the marker line is not
     * emitted, and no byte of the rejected literal body is parsed as protocol.
     */
    maxLiteralSize?: number | undefined;
    /**
     * Maximum allowed total size (in bytes) of a single assembled response: every line segment and
     * literal of one response combined. Defaults to MAX_RESPONSE_SIZE (2GB), which leaves room
     * above the literal cap for a maximum-size literal plus its marker line. The per-line and
     * per-literal caps alone cannot stop a server that spreads attacker-controlled bytes across an
     * unbounded number of tokens of a single response. Declared literal sizes count when their
     * marker is parsed, so an oversized total is rejected before the literal bytes arrive, and a
     * line still being assembled counts against whatever budget is left. Exceeding the limit is
     * terminal: the stream is destroyed with a `ResponseTooLarge` error and no further input is
     * parsed.
     */
    maxResponseSize?: number | undefined;
}
/**
 * A queued input chunk with the transform callback that releases it
 */
export interface ImapStreamInputItem {
    chunk: Buffer;
    next: () => void;
    released?: boolean | undefined;
}
/**
 * A Transform stream that parses raw IMAP protocol data from a socket into structured
 * command/response objects. Reads binary input, splits it into lines delimited by LF,
 * extracts literal data blocks based on IMAP literal size markers (e.g., "{123}\r\n"),
 * and emits each complete command as a readable object containing the payload Buffer
 * and any associated literal Buffers. Enforces a maximum literal size of 1GB.
 */
export declare class ImapStream extends Transform {
    options: ImapStreamOptions;
    cid: string | undefined;
    log: InternalLogger;
    readBytesCounter: number;
    maxLineLength: number;
    maxLiteralSize: number;
    maxResponseSize: number;
    state: number;
    literalWaiting: number;
    inputBuffer: Buffer[];
    lineBuffer: Buffer[];
    lineBytes: number;
    literalBuffer: Buffer[];
    literals: Buffer[];
    responseBytes: number;
    compress: boolean;
    secureConnection: boolean | undefined;
    processingInput: boolean;
    inputQueue: ImapStreamInputItem[];
    activeInput: ImapStreamInputItem | null;
    pendingPush: (() => void) | null;
    /**
     * Creates a new ImapStream instance.
     *
     * @param options - Stream options, see ImapStreamOptions.
     */
    constructor(options?: ImapStreamOptions | undefined);
    /**
     * Terminally fails the stream. Used for response limit violations and for any other
     * error raised while parsing.
     *
     * The stream is destroyed instead of only emitting `error`: emitting on a Transform leaves
     * it running, so the caller would keep scanning the rejected payload and could emit it as
     * protocol (an oversized literal body contains attacker-chosen CRLF delimited lines).
     * Destroying stops all parsing, drops the offending line, and releases every queued
     * transform callback exactly once (see `_destroy()`).
     *
     * `destroyed` (set synchronously by destroy()) is the single liveness flag every other path
     * checks, so a second failure attempt is a no-op and nothing is parsed after the first.
     *
     * @param err - The error to destroy the stream with.
     * @returns Always false, so callers can `return this.failStream(err)`.
     */
    failStream(err: Error): false;
    /**
     * Releases a queued input chunk's transform callback exactly once, signalling the writable
     * side that the chunk was consumed. The mirror image of ImapFlow's releaseStreamData(), which
     * releases the readable items this stream pushes downstream.
     *
     * @param item - Queue entry holding the chunk and its transform callback.
     */
    releaseInput(item: ImapStreamInputItem | null | undefined): void;
    /**
     * Checks whether the given line buffer ends with an IMAP literal size marker
     * (e.g., "{123}\r\n"). If a valid marker is found and the literal size is within
     * the allowed maximum, switches the stream state to LITERAL mode and records
     * the expected number of literal bytes.
     *
     * @param line - The line buffer to check for a trailing literal marker.
     * @returns True if a valid literal marker was found and literal state was activated, false otherwise.
     */
    checkLiteralMarker(line: Buffer): boolean;
    /**
     * Enforces the configured line-length cap for a projected line length. The projected length
     * covers every byte of the line, the line terminator included, whether or not the line was
     * split across input chunks. A line exactly at the limit is accepted.
     *
     * @param lineLength - Total length the current line would reach.
     * @returns True if the line is within the limit, false if the stream was failed.
     */
    checkLineLength(lineLength: number): boolean;
    /**
     * Enforces the configured per-response size cap: the cumulative bytes of every line
     * segment and declared literal of the response currently being assembled. Counting
     * declared literal sizes at marker time means an oversized total is rejected before
     * the literal bytes even arrive. The counter is reset when a response is emitted.
     *
     * @param additionalBytes - Bytes the next token would add to the response.
     * @param peek - Measure only, without committing the bytes to the counter.
     *   Used for a line that is still being assembled: its bytes are committed once, when the
     *   line completes.
     * @returns True if within the limit, false if the stream was failed.
     */
    checkResponseSize(additionalBytes: number, peek?: boolean | undefined): boolean;
    /**
     * Processes a single input chunk of raw data. In LINE state, scans for LF-terminated
     * lines and checks for literal markers. In LITERAL state, collects the expected number
     * of literal bytes. When a complete command (with all its literals) is assembled, it is
     * pushed downstream as a readable object.
     *
     * @param chunk - The raw data chunk to process.
     */
    processInputChunk(chunk: Buffer): Promise<void>;
    /**
     * Processes the chunk from `startPos` until the parser state changes or the chunk ends.
     *
     * @returns The offset to continue from after a state switch, or `null` when done with the chunk.
     */
    processChunkSegment(chunk: Buffer, startPos: number): Promise<number | null>;
    /**
     * Drains the input queue by processing each queued chunk sequentially.
     * Yields to the event loop every 10 chunks to prevent CPU blocking on
     * large bursts of incoming data.
     *
     * The `processingInput` guard is cleared in the same synchronous step that finds the queue
     * empty. Clearing it later (in a promise handler) leaves a gap of a few microtasks where a
     * chunk delivered by the writable side is queued but no loop is started for it, so its
     * transform callback is never called and the socket is never read again. Workers deliver
     * the next chunk inside that gap.
     */
    processInput(): Promise<void>;
    /**
     * Transform stream implementation. Receives raw data chunks from the writable side,
     * converts strings to Buffers, tracks total bytes read, optionally logs raw data,
     * and queues the chunk for asynchronous processing.
     *
     * @param chunk - The incoming data chunk.
     * @param encoding - The encoding if chunk is a string.
     * @param next - Callback to signal that this chunk has been consumed.
     */
    _transform(chunk: Buffer | string, encoding: BufferEncoding, next: TransformCallback): void;
    /**
     * Flush implementation called when the writable side ends. Signals completion immediately.
     *
     * @param next - Callback to signal flush completion.
     */
    _flush(next: TransformCallback): void;
    /**
     * Destroy implementation for cleanup. Clears all internal buffers, drains the input queue
     * by invoking pending callbacks, and forwards the error (if any) to the callback.
     *
     * @param err - The error that caused destruction, or null.
     * @param callback - Callback to signal destruction completion.
     */
    _destroy(err: Error | null, callback: (error?: Error | null) => void): void;
}
