/**
 * 智能合约类型定义
 */

export type ContractAddress = `0x${string}`;
export type JobId = `0x${string}`;

/**
 * Escrow 状态枚举（与合约一致）
 */
export enum EscrowStatus {
	NONE = 0,
	LOCKED = 1,
	RELEASED = 2,
	FROZEN = 3,
	REFUNDED = 4,
}

/**
 * Escrow 信息结构
 */
export interface EscrowInfo {
	payer: ContractAddress;
	agent: ContractAddress;
	amount: bigint;
	status: EscrowStatus;
	releaseAt: bigint;
}

/**
 * Dispute 原因枚举
 */
export enum DisputeReason {
	QUALITY_ISSUE = 0,
	DEADLINE_MISS = 1,
	FRAUD = 2,
	OTHER = 3,
}
