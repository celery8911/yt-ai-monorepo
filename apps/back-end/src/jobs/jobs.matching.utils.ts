const hashToSeed = (value: string): number => {
	let hash = 2166136261;
	for (let index = 0; index < value.length; index += 1) {
		hash ^= value.charCodeAt(index);
		hash = Math.imul(hash, 16777619);
	}
	return hash >>> 0;
};

const mulberry32 = (seed: number) => {
	let t = seed + 0x6d2b79f5;
	return () => {
		t += 0x6d2b79f5;
		let next = Math.imul(t ^ (t >>> 15), t | 1);
		next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
		return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
	};
};

const getRng = (seed?: string) =>
	seed ? mulberry32(hashToSeed(seed)) : Math.random;

export const shuffleWithSeed = <T>(items: T[], seed?: string): T[] => {
	const list = [...items];
	const rng = getRng(seed);
	for (let index = list.length - 1; index > 0; index -= 1) {
		const swapIndex = Math.floor(rng() * (index + 1));
		[list[index], list[swapIndex]] = [list[swapIndex], list[index]];
	}
	return list;
};

export const pickRandomItems = <T>(
	items: T[],
	count: number,
	seed?: string,
): T[] => shuffleWithSeed(items, seed).slice(0, count);

export const pickRandomCount = (
	min: number,
	max: number,
	seed?: string,
): number => {
	if (max <= min) return min;
	const rng = getRng(seed);
	return min + Math.floor(rng() * (max - min + 1));
};

export const buildMatchSelection = <T>(
	items: T[],
	seed: string,
	options?: {
		minCandidates?: number;
		maxCandidates?: number;
		selectedCount?: number;
	},
): { candidates: T[]; selected: T[] } => {
	const minCandidates = options?.minCandidates ?? 5;
	const maxCandidates = options?.maxCandidates ?? 8;
	const selectedCount = options?.selectedCount ?? 3;
	const capped = items.slice(0, maxCandidates);
	if (!capped.length) return { candidates: [], selected: [] };
	const count =
		capped.length >= minCandidates
			? Math.min(maxCandidates, capped.length)
			: capped.length;
	const candidates = capped.slice(0, count);
	const selected = pickRandomItems(
		candidates,
		selectedCount,
		`${seed}:selected`,
	);
	return { candidates, selected };
};
