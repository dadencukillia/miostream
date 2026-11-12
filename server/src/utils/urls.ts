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

/**
 * Safely joins two URL strings or path segments together, 
 * ensuring a single forward slash separates them regardless of trailing or leading slashes.
 * 
 * @param a - The base URL or first path segment.
 * @param b - The relative URL or second path segment.
 * @returns The concatenated and normalized URL string.
 */
export const joinUrls = (a: string, b: string): string => {
  return a.replace(/\/$/, "") + "/" + b.replace(/^\//, "");
}
