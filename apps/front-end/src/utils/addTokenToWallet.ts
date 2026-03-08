/**
 * 添加 ERC20 Token 到钱包显示 (EIP-747 wallet_watchAsset)
 *
 * 面试要点 (Q6: Token 不显示):
 * - ERC20 Token 只是合约中的余额记录，钱包需要知道合约地址才能显示
 * - wallet_watchAsset 是 EIP-747 标准方法，提示用户将 Token 添加到钱包
 * - 常见原因：用户在错误的链上、钱包未添加该 Token、Token 合约未验证
 * - 解决方案：交易成功后自动调用 wallet_watchAsset 提示添加
 */

type AddTokenParams = {
	address: string;
	symbol: string;
	decimals: number;
	image?: string;
};

/**
 * 调用 wallet_watchAsset 将 Token 添加到钱包
 * @returns true if user accepted, false if rejected or not supported
 */
export async function addTokenToWallet(
	params: AddTokenParams,
): Promise<boolean> {
	if (typeof window === "undefined" || !window.ethereum) {
		console.warn("No ethereum provider found");
		return false;
	}

	try {
		const wasAdded = await window.ethereum.request({
			method: "wallet_watchAsset",
			params: {
				type: "ERC20",
				options: {
					address: params.address,
					symbol: params.symbol,
					decimals: params.decimals,
					image: params.image || "",
				},
			},
		});

		return Boolean(wasAdded);
	} catch (error) {
		console.error("Failed to add token to wallet:", error);
		return false;
	}
}
