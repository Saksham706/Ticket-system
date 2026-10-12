import { Transform, type TransformCallback } from 'node:stream';
export declare class JPDecoder extends Transform {
    charset: string;
    chunks: Buffer[];
    chunklen: number;
    maxBytes: number;
    limited: boolean;
    constructor(charset: string, maxBytes?: number | undefined);
    _transform(chunk: Buffer | string, encoding: BufferEncoding, done: TransformCallback): void;
    _flush(done: TransformCallback): void;
    _destroy(err: Error | null, callback: (error: Error | null) => void): void;
}
