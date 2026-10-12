"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = create;
const tools_js_1 = require("../tools.js");
/**
 * Creates a new mailbox and subscribes to it.
 *
 * @param connection - IMAP connection instance
 * @param path - Mailbox path to create
 * @returns Object with path and creation status, or undefined if preconditions not met
 * @throws If the CREATE command fails (except when mailbox already exists)
 */
async function create(connection, path) {
    if (!(0, tools_js_1.isAuthenticatedState)(connection)) {
        // nothing to do here
        return;
    }
    path = (0, tools_js_1.normalizePath)(connection, path);
    let response;
    try {
        let map = {
            path
        };
        response = await connection.exec('CREATE', [{ type: 'ATOM', value: (0, tools_js_1.encodePath)(connection, path) }]);
        // Parse the response code section (e.g., [MAILBOXID (<id>)]) from the tagged OK response.
        // IMAP response code attributes are structured as alternating key-value pairs.
        let section = response.response.attributes &&
            response.response.attributes[0] &&
            response.response.attributes[0].section &&
            response.response.attributes[0].section.length
            ? response.response.attributes[0].section
            : false;
        if (section) {
            let key;
            section.forEach((attribute, i) => {
                // IMAP key-value pairs: even indices (i % 2 === 0) are keys, odd indices are values
                if (i % 2 === 0) {
                    key = attribute && typeof attribute.value === 'string' ? attribute.value : false;
                    return;
                }
                if (!key) {
                    return;
                }
                let value;
                switch (key.toLowerCase()) {
                    case 'mailboxid':
                        key = 'mailboxId';
                        value = Array.isArray(attribute) && attribute[0] && typeof attribute[0].value === 'string' ? attribute[0].value : false;
                        break;
                }
                if (key && value) {
                    map[key] = value;
                }
            });
        }
        map.created = true;
        response.next();
        // Auto-subscribe after creation so the new mailbox appears in LSUB listings
        // and is visible to clients that only show subscribed folders.
        await connection.run('SUBSCRIBE', path);
        return map;
    }
    catch (err) {
        let errorCode = (0, tools_js_1.getStatusCode)(err.response);
        // ALREADYEXISTS (RFC 5530) means the mailbox already exists on the server.
        // This is not a true error, we return created:false to indicate nothing was created.
        if (errorCode === 'ALREADYEXISTS') {
            // no need to do anything, mailbox already exists
            return {
                path,
                created: false
            };
        }
        await (0, tools_js_1.reportCommandError)(connection, err);
        throw err;
    }
}
module.exports = exports.default;
Object.defineProperty(module.exports, 'default', { value: exports.default, enumerable: false, writable: true, configurable: true });
