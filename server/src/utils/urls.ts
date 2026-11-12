/**
 * Checks if a string is a valid HTTP or HTTPS URL.
 */
export const isSafeHttpUrl = (urlString: string): boolean => {
    try {
        const url = new URL(urlString);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
};

export const joinUrls = (a: string, b: string): string => {
  return a.replace(/\/$/, "") + "/" + b.replace(/^\//, "");
}
