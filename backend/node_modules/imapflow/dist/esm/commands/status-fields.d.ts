import type { ImapAttributeList } from '../handler/types.js';
/**
 * A parsed STATUS value: counts and sizes as numbers, UIDVALIDITY and HIGHESTMODSEQ as BigInts
 */
export type StatusFieldValue = number | bigint;
/**
 * Walks a STATUS data-item list - alternating item-name and item-value tokens - and reports
 * every recognized field that parsed successfully. Unknown item names and unusable values are
 * skipped, so one bad field never costs the rest of the response.
 *
 * @param list - Parsed attribute list from the untagged STATUS response.
 * @param onField - Called as (key, value) for each usable field.
 */
export declare const parseStatusList: (list: ImapAttributeList, onField: (key: string, value: StatusFieldValue) => void) => void;
