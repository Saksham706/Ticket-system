/**
 * Sends a NOOP command to the server.
 *
 * @param connection - IMAP connection instance
 * @returns True on success, false on failure
 */
export default async function noop(connection) {
    try {
        let response = await connection.exec('NOOP', false, { comment: 'Requested by command' });
        response.next();
        return true;
    }
    catch (err) {
        connection.log.warn({ err, cid: connection.id });
        return false;
    }
}
