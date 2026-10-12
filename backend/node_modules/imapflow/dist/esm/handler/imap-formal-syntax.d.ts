/**
 * Verifies that every character in the given string is within the set of allowed characters.
 *
 * @param str - The string to validate.
 * @param allowedChars - A string containing all allowed characters.
 * @returns The index of the first disallowed character, or -1 if all characters are valid.
 */
declare function verify(str: string, allowedChars: string): number;
declare const imapFormalSyntax: {
    CHAR: () => string;
    CHAR8: () => string;
    SP: () => string;
    CTL: () => string;
    DQUOTE: () => string;
    ALPHA: () => string;
    DIGIT: () => string;
    'ATOM-CHAR': () => string;
    'ASTRING-CHAR': () => string;
    'TEXT-CHAR': () => string;
    'atom-specials': () => string;
    'list-wildcards': () => string;
    'quoted-specials': () => string;
    'resp-specials': () => string;
    tag: () => string;
    command: () => string;
    verify: typeof verify;
};
export default imapFormalSyntax;
