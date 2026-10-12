export declare const flags: string[];
export declare const names: {
    [flag: string]: string[];
};
/**
 * The parts of a listed folder that special-use detection reads
 */
export interface SpecialUseFolder {
    /** Flags reported for the folder by LIST */
    flags: Set<string>;
    /** Folder name, the last path component */
    name: string;
}
/** How a special-use flag was determined */
export type SpecialUseSource = 'extension' | 'name' | 'name-guess';
export interface SpecialUseResult {
    /** The special-use flag, or null when the folder is not a special-use folder */
    flag: string | null;
    /** Set when a flag was found */
    source?: SpecialUseSource | undefined;
}
export declare const specialUse: (hasSpecialUseExtension: boolean, folder: SpecialUseFolder) => SpecialUseResult;
