import type { ImapResponse } from '../handler/types.js';
import type { CopyResponseObject } from '../types.js';
/**
 * Parses COPYUID response code from an IMAP response (RFC 4315).
 * Used by both COPY and MOVE commands to extract the UID mapping
 * from source mailbox to destination mailbox.
 *
 * @param response - IMAP response object with attributes
 * @param map - Result map to populate with uidValidity and uidMap
 */
export declare function parseCopyUid(response: ImapResponse, map: CopyResponseObject): void;
