import {
	type UseAccountReturnType,
	type UseBalanceReturnType,
	type UseConnectReturnType,
	type UseDisconnectReturnType,
	useAccount,
	useBalance,
	useConnect,
	useDisconnect,
} from "wagmi";

export type UseWalletReturn = {
	address: UseAccountReturnType["address"];
	isConnected: UseAccountReturnType["isConnected"];
	status: UseAccountReturnType["status"];
	balance: UseBalanceReturnType["data"];
	connectors: UseConnectReturnType["connectors"];
	connect: () => ReturnType<UseConnectReturnType["connectAsync"]>;
	disconnect: () => ReturnType<UseDisconnectReturnType["disconnectAsync"]>;
	isConnecting: UseConnectReturnType["isPending"];
	error: UseConnectReturnType["error"];
};

export const useWallet = (): UseWalletReturn => {
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

	const disconnect = () => disconnectAsync();

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
