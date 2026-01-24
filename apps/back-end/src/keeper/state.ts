type JobState = {
	failures: number;
	nextAttemptAt: number;
	lastAttemptAt: number;
	lastSuccessAt: number;
};

export class KeeperState {
	private readonly states = new Map<string, JobState>();

	constructor(
		private readonly cooldownMs: number,
		private readonly backoffBaseMs: number,
		private readonly maxRetries: number,
	) {}

	shouldAttempt(jobId: string, nowMs: number): boolean {
		const state = this.states.get(jobId);
		if (!state) return true;
		return nowMs >= state.nextAttemptAt;
	}

	markSuccess(jobIds: string[], nowMs: number) {
		for (const jobId of jobIds) {
			this.states.set(jobId, {
				failures: 0,
				nextAttemptAt: nowMs + this.cooldownMs,
				lastAttemptAt: nowMs,
				lastSuccessAt: nowMs,
			});
		}
	}

	markFailure(jobIds: string[], nowMs: number) {
		for (const jobId of jobIds) {
			const prev = this.states.get(jobId);
			const failures = Math.min((prev?.failures ?? 0) + 1, this.maxRetries);
			const backoffMs = this.backoffBaseMs * 2 ** (failures - 1);
			this.states.set(jobId, {
				failures,
				nextAttemptAt: nowMs + backoffMs,
				lastAttemptAt: nowMs,
				lastSuccessAt: prev?.lastSuccessAt ?? 0,
			});
		}
	}

	getSkipped(jobIds: string[], nowMs: number) {
		const skipped = [] as string[];
		for (const jobId of jobIds) {
			if (!this.shouldAttempt(jobId, nowMs)) {
				skipped.push(jobId);
			}
		}
		return skipped;
	}
}
