export const normalizeScore10toIncluding0 = (score10: number) => Math.max(0, score10 - 1) / 9 * 10;
export const convScore10toSymetric5 = (score10: number) => Math.round((Math.pow(normalizeScore10toIncluding0(score10), 1.5) - 16) / 16 * 5 + 0.45);
