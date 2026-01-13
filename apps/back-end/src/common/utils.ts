export const nowIso = (): string => new Date().toISOString();

export const generateId = (prefix: string): string => {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now().toString(36)}_${rand}`;
};

export const normalizeTags = (tags?: string | string[]): string[] => {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags.map((tag) => tag.trim()).filter(Boolean);
  return tags.split(",").map((tag) => tag.trim()).filter(Boolean);
};

type NumericValue = number | { toNumber?: () => number };

export const toNumber = (value?: NumericValue | null): number | undefined => {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "number") return value;
  if (typeof value.toNumber === "function") return value.toNumber();
  return Number(value);
};
