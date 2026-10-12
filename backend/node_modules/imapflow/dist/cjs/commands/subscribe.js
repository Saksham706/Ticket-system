"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = subscribe;
const subscription_js_1 = require("./subscription.js");
/**
 * Subscribes to a mailbox.
 *
 * @param connection - IMAP connection instance
 * @param path - Mailbox path to subscribe to
 * @returns True on success, false on failure, or undefined if preconditions not met
 */
async function subscribe(connection, path) {
    return await (0, subscription_js_1.setSubscription)(connection, 'SUBSCRIBE', path);
}
module.exports = exports.default;
Object.defineProperty(module.exports, 'default', { value: exports.default, enumerable: false, writable: true, configurable: true });
