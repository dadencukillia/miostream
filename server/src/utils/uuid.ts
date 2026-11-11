const UUID_REGEX = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|[0-9a-f]{32})$/i;

export const isUuid = (value: string): boolean => {
	return UUID_REGEX.test(value);
};

//  Normalizes a UUID string to its canonical hyphenated, lowercase form.
//  Returns null if the input is not a valid UUID.

export const normalizeUuid = (value: string): string | null => {
	if (!isUuid(value)) return null;
	const hex = value.replace(/-/g, "").toLowerCase();
	return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};