"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = quota;
const tools_js_1 = require("../tools.js");
/**
 * Requests quota information for a mailbox.
 *
 * @param connection - IMAP connection instance
 * @param path - Mailbox path to query quota for
 * @returns Quota information object, false if QUOTA not supported or on failure, or undefined if preconditions not met
 */
async function quota(connection, path) {
    if (!(0, tools_js_1.isAuthenticatedState)(connection) || !path) {
        // nothing to do here
        return;
    }
    // An RFC 9208 server advertises its QUOTA=RES-* resource types and does not have to list
    // the bare RFC 2087 QUOTA token as well
    if (!connection.capabilities.has('QUOTA') && ![...connection.capabilities.keys()].some(capability => capability.startsWith('QUOTA=RES-'))) {
        return false;
    }
    path = (0, tools_js_1.normalizePath)(connection, path);
    let map = { path };
    // Parse a QUOTA response. The resource list uses a repeating triplet pattern (i % 3):
    //   position 0: resource name (e.g., "STORAGE", "MESSAGE")
    //   position 1: current usage
    //   position 2: limit
    // Storage values are in KB on the wire; multiply by 1024 to report bytes.
    let processQuotaResponse = (untagged) => {
        let attributes = untagged.attributes && untagged.attributes[1];
        if (!attributes || !Array.isArray(attributes) || !attributes.length) {
            return false;
        }
        let key = false;
        attributes.forEach((attribute, i) => {
            const position = i % 3;
            if (position === 0) {
                key = attribute && typeof attribute.value === 'string' ? attribute.value.toLowerCase() : false;
                return;
            }
            if (!key) {
                return;
            }
            // isNaN() also passes '1e5', ' 12 ' and 'Infinity', none of which is a usable octet count
            let value = (0, tools_js_1.parseUintValue)(attribute && attribute.value);
            if (value === false) {
                return;
            }
            // Resource names are server-controlled. This object is returned to the caller, so it
            // keeps a normal prototype and unsafe names are dropped instead; the fixed fields
            // must keep their values too.
            if ((0, tools_js_1.isUnsafeKey)(key) || key === 'path' || key === 'quotaroot') {
                return;
            }
            let resource = map[key];
            if (typeof resource !== 'object') {
                resource = {};
                map[key] = resource;
            }
            // Storage quota is reported in KB by IMAP; convert to bytes for consistency
            const multiplier = key === 'storage' ? 1024 : 1;
            if (position === 1) {
                resource.usage = value * multiplier;
            }
            else if (position === 2) {
                resource.limit = value * multiplier;
                // Calculate usage percentage for convenient display
                if (resource.limit) {
                    resource.status = Math.round(((resource.usage || 0) / resource.limit) * 100) + '%';
                }
            }
        });
    };
    let quotaFound = false;
    let response;
    try {
        // Two-step quota lookup: GETQUOTAROOT identifies the quota root for a mailbox,
        // and the server usually sends the QUOTA response inline. Some servers only
        // send the root name and require a separate GETQUOTA command.
        response = await connection.exec('GETQUOTAROOT', [{ type: 'ATOM', value: (0, tools_js_1.encodePath)(connection, path) }], {
            untagged: {
                // QUOTAROOT response tells us which quota root applies to this mailbox.
                // A mailbox may have zero or one quota root.
                QUOTAROOT: async (untagged) => {
                    // the root name is an astring, which may come as a literal
                    let quotaRoot = (0, tools_js_1.getStringValue)(untagged.attributes && untagged.attributes[1]);
                    if (quotaRoot) {
                        map.quotaRoot = quotaRoot;
                    }
                },
                // QUOTA response provides the actual resource usage and limits
                QUOTA: async (untagged) => {
                    quotaFound = true;
                    processQuotaResponse(untagged);
                }
            }
        });
        response.next();
        // Fallback: if we got a quota root but no QUOTA response inline,
        // explicitly request quota for that root.
        if (map.quotaRoot && !quotaFound) {
            response = await connection.exec('GETQUOTA', [{ type: 'ATOM', value: map.quotaRoot }], {
                untagged: {
                    QUOTA: async (untagged) => {
                        processQuotaResponse(untagged);
                    }
                }
            });
            // Release the parser: without this the connection stalls, because the reader loop
            // waits for the response to be handed back before parsing any further input.
            response.next();
        }
        return map;
    }
    catch (err) {
        await (0, tools_js_1.reportCommandError)(connection, err);
        return false;
    }
}
module.exports = exports.default;
Object.defineProperty(module.exports, 'default', { value: exports.default, enumerable: false, writable: true, configurable: true });
