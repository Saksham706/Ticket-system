import type { ImapAttributeList } from '../handler/types.js';
import type { ESearchResult } from '../types.js';
/**
 * Parses the key-value attributes from an ESEARCH untagged response.
 *
 * Receives the attribute list AFTER stripping the leading (TAG "X") list
 * and the UID atom, i.e. only the result keyword/value pairs remain.
 *
 * ALL and PARTIAL.messages are kept as compact sequence-set strings.
 * Use expandRange() from tools.ts if you need to expand them.
 * MODSEQ (RFC 7162, sent when the search used a MODSEQ criterion) is
 * returned as a BigInt.
 *
 * @param attrs - Attribute array from the IMAP parser
 * @returns ESearchResult object
 */
export declare function parseEsearchResponse(attrs: ImapAttributeList): ESearchResult;
