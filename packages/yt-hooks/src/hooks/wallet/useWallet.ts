import { useAccount, useBalance, useConnect, useDisconnect } from "wagmi";

export const useWallet = () => {
	const { address, isConnected, status } = useAccount();
	const { connectors, connectAsync, error, isPending } = useConnect();
	const { disconnectAsync } = useDisconnect();
	const { data: balance } = useBalance({
		address,
		query: {
			enabled: Boolean(address),
		},
	});

	const connect = async () => {
		const connector = connectors[0];
		if (!connector) {
			throw new Error("No wallet connector available.");
		}
		return connectAsync({ connector });
	};

	const disconnect = async () => {
		await disconnectAsync();
	};

	return {
		address,
		isConnected,
		status,
		balance,
		connectors,
		connect,
		disconnect,
		isConnecting: isPending,
		error,
	};
};
