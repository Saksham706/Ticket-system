import { Transform, type TransformCallback } from 'node:stream';
/**
 * Normalizes a byte budget for the download pipeline. Any finite positive number is honored and
 * floored, because byte counts are integers: with a fractional bound a counter can only ever
 * reach its floor, so a stage would never report itself full and a loop polling that flag would
 * keep pulling forever. Anything else - 0, NaN, a non-numeric value - means "no limit".
 *
 * Lives here rather than in tools.ts because tools.ts imports jp-decoder.ts, which needs this.
 *
 * @param value - The configured budget.
 * @returns The normalized budget, or Infinity when unbounded.
 */
export declare const normalizeByteLimit: (value: unknown) => number;
export interface LimitedPassthroughOptions {
    /** Maximum number of bytes to pass through. Anything else means "no limit" */
    maxBytes?: number | undefined;
}
export declare class LimitedPassthrough extends Transform {
    options: LimitedPassthroughOptions;
    maxBytes: number;
    processed: number;
    limited: boolean;
    constructor(options?: LimitedPassthroughOptions | undefined);
    _transform(chunk: Buffer, encoding: BufferEncoding, done: TransformCallback): void;
}
