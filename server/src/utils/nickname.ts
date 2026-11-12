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