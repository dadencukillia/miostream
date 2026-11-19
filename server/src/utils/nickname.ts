export const RESERVED_NICKNAMES = new Set([
    "links",
    "profile",
    "avatar",
    "customization",
    "password",
    "admin",
    "administrator",
    "miostream",
    "official",
    "moderator"
]);

/**
 * Checks if nickname is in blacklist.
 * Neither case sensitive nor space sensitive.
 */
export const isReservedNickname = (nickname: string): boolean => {
    return RESERVED_NICKNAMES.has(nickname.trim().toLowerCase());
};

/**
 * TODO: write functionality for this generator
 * Generates completely unique valid nickname 
 */
export const generateNickname = (): string => {
    const suffix = Buffer.from(crypto.getRandomValues(new Uint8Array(5))).toString("hex");
    return `user_${suffix}`;
};
