"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const id_js_1 = __importDefault(require("./commands/id.js"));
const capability_js_1 = __importDefault(require("./commands/capability.js"));
const namespace_js_1 = __importDefault(require("./commands/namespace.js"));
const login_js_1 = __importDefault(require("./commands/login.js"));
const logout_js_1 = __importDefault(require("./commands/logout.js"));
const starttls_js_1 = __importDefault(require("./commands/starttls.js"));
const list_js_1 = __importDefault(require("./commands/list.js"));
const enable_js_1 = __importDefault(require("./commands/enable.js"));
const select_js_1 = __importDefault(require("./commands/select.js"));
const fetch_js_1 = __importDefault(require("./commands/fetch.js"));
const create_js_1 = __importDefault(require("./commands/create.js"));
const delete_js_1 = __importDefault(require("./commands/delete.js"));
const rename_js_1 = __importDefault(require("./commands/rename.js"));
const close_js_1 = __importDefault(require("./commands/close.js"));
const subscribe_js_1 = __importDefault(require("./commands/subscribe.js"));
const unsubscribe_js_1 = __importDefault(require("./commands/unsubscribe.js"));
const store_js_1 = __importDefault(require("./commands/store.js"));
const search_js_1 = __importDefault(require("./commands/search.js"));
const noop_js_1 = __importDefault(require("./commands/noop.js"));
const expunge_js_1 = __importDefault(require("./commands/expunge.js"));
const append_js_1 = __importDefault(require("./commands/append.js"));
const status_js_1 = __importDefault(require("./commands/status.js"));
const copy_js_1 = __importDefault(require("./commands/copy.js"));
const move_js_1 = __importDefault(require("./commands/move.js"));
const compress_js_1 = __importDefault(require("./commands/compress.js"));
const quota_js_1 = __importDefault(require("./commands/quota.js"));
const idle_js_1 = __importDefault(require("./commands/idle.js"));
const authenticate_js_1 = __importDefault(require("./commands/authenticate.js"));
/**
 * IMAP command registry. Maps IMAP command names (uppercase strings) to their
 * corresponding implementation modules from the `commands/` directory.
 *
 * Each entry maps a command name (e.g., "FETCH", "SELECT", "IDLE") to a function
 * that builds the command request and processes the server response. This Map is
 * used by the main ImapFlow client to look up and execute IMAP commands.
 */
const imapCommands = new Map([
    ['ID', id_js_1.default],
    ['CAPABILITY', capability_js_1.default],
    ['NAMESPACE', namespace_js_1.default],
    ['LOGIN', login_js_1.default],
    ['LOGOUT', logout_js_1.default],
    ['STARTTLS', starttls_js_1.default],
    ['LIST', list_js_1.default],
    ['ENABLE', enable_js_1.default],
    ['SELECT', select_js_1.default],
    ['FETCH', fetch_js_1.default],
    ['CREATE', create_js_1.default],
    ['DELETE', delete_js_1.default],
    ['RENAME', rename_js_1.default],
    ['CLOSE', close_js_1.default],
    ['SUBSCRIBE', subscribe_js_1.default],
    ['UNSUBSCRIBE', unsubscribe_js_1.default],
    ['STORE', store_js_1.default],
    ['SEARCH', search_js_1.default],
    ['NOOP', noop_js_1.default],
    ['EXPUNGE', expunge_js_1.default],
    ['APPEND', append_js_1.default],
    ['STATUS', status_js_1.default],
    ['COPY', copy_js_1.default],
    ['MOVE', move_js_1.default],
    ['COMPRESS', compress_js_1.default],
    ['QUOTA', quota_js_1.default],
    ['IDLE', idle_js_1.default],
    ['AUTHENTICATE', authenticate_js_1.default]
]);
exports.default = imapCommands;
module.exports = exports.default;
Object.defineProperty(module.exports, 'default', { value: exports.default, enumerable: false, writable: true, configurable: true });
