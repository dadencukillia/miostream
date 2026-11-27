export const normalizeScore10toIncluding0 = (score10: number) => Math.max(0, score10 - 1) / 9;
export const convScore10toSymetric5 = (score10: number) => {
  const normalized = normalizeScore10toIncluding0(score10);

  const tL = Math.pow(normalized, 1.35);
  const invtL = Math.pow(1 - normalized, 1.35);

  return 10 * tL / (tL + invtL * 1.85) - 5;
};
