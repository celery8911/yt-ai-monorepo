"use client";

import { useCallback, useEffect, useState } from "react";
import {
	fetchDashboardStats,
	fetchDisputes,
	fetchPublishedAgents,
	fetchPublishedJobs,
	fetchSignedAgents,
} from "../apis/dashboard";
import type {
	DashboardStatsResponse,
	DisputeItem,
	PaginatedResponse,
	PublishedAgentItem,
	PublishedJobItem,
	SignedAgentItem,
} from "../apis/dashboard.types";

type DashboardState<T> = {
	data: T | null;
	loading: boolean;
	error: string | null;
};

const useRequestState = <T>(address: string | undefined) => {
	const [state, setState] = useState<DashboardState<T>>({
		data: null,
		loading: Boolean(address),
		error: null,
	});

	const setLoading = useCallback(
		() => setState((prev) => ({ ...prev, loading: true, error: null })),
		[],
	);
	const setData = useCallback(
		(data: T) => setState({ data, loading: false, error: null }),
		[],
	);
	const setError = useCallback(
		(error: string) => setState({ data: null, loading: false, error }),
		[],
	);
	const reset = useCallback(
		() => setState({ data: null, loading: false, error: null }),
		[],
	);

	return { state, setLoading, setData, setError, reset };
};

export const useDashboardStats = (address: string | undefined) => {
	const { state, setLoading, setData, setError, reset } =
		useRequestState<DashboardStatsResponse>(address);

	useEffect(() => {
		let isActive = true;

		if (!address) {
			reset();
			return () => {
				isActive = false;
			};
		}

		setLoading();

		fetchDashboardStats(address)
			.then((data) => {
				if (!isActive) return;
				setData(data);
			})
			.catch((error: unknown) => {
				if (!isActive) return;
				const message = error instanceof Error ? error.message : "请求失败";
				setError(message);
			});

		return () => {
			isActive = false;
		};
	}, [address, reset, setData, setError, setLoading]);

	return state;
};

export const usePublishedJobs = (address: string | undefined, page: number) => {
	const { state, setLoading, setData, setError, reset } =
		useRequestState<PaginatedResponse<PublishedJobItem>>(address);

	useEffect(() => {
		let isActive = true;

		if (!address) {
			reset();
			return () => {
				isActive = false;
			};
		}

		setLoading();

		fetchPublishedJobs(address, { page })
			.then((data) => {
				if (!isActive) return;
				setData(data);
			})
			.catch((error: unknown) => {
				if (!isActive) return;
				const message = error instanceof Error ? error.message : "请求失败";
				setError(message);
			});

		return () => {
			isActive = false;
		};
	}, [address, page, reset, setData, setError, setLoading]);

	return state;
};

export const usePublishedAgents = (
	address: string | undefined,
	page: number,
) => {
	const { state, setLoading, setData, setError, reset } =
		useRequestState<PaginatedResponse<PublishedAgentItem>>(address);

	useEffect(() => {
		let isActive = true;

		if (!address) {
			reset();
			return () => {
				isActive = false;
			};
		}

		setLoading();

		fetchPublishedAgents(address, { page })
			.then((data) => {
				if (!isActive) return;
				setData(data);
			})
			.catch((error: unknown) => {
				if (!isActive) return;
				const message = error instanceof Error ? error.message : "请求失败";
				setError(message);
			});

		return () => {
			isActive = false;
		};
	}, [address, page, reset, setData, setError, setLoading]);

	return state;
};

export const useSignedAgents = (address: string | undefined, page: number) => {
	const { state, setLoading, setData, setError, reset } =
		useRequestState<PaginatedResponse<SignedAgentItem>>(address);

	useEffect(() => {
		let isActive = true;

		if (!address) {
			reset();
			return () => {
				isActive = false;
			};
		}

		setLoading();

		fetchSignedAgents(address, { page })
			.then((data) => {
				if (!isActive) return;
				setData(data);
			})
			.catch((error: unknown) => {
				if (!isActive) return;
				const message = error instanceof Error ? error.message : "请求失败";
				setError(message);
			});

		return () => {
			isActive = false;
		};
	}, [address, page, reset, setData, setError, setLoading]);

	return state;
};

export const useDisputes = (address: string | undefined, page: number) => {
	const { state, setLoading, setData, setError, reset } =
		useRequestState<PaginatedResponse<DisputeItem>>(address);

	useEffect(() => {
		let isActive = true;

		if (!address) {
			reset();
			return () => {
				isActive = false;
			};
		}

		setLoading();

		fetchDisputes(address, { page })
			.then((data) => {
				if (!isActive) return;
				setData(data);
			})
			.catch((error: unknown) => {
				if (!isActive) return;
				const message = error instanceof Error ? error.message : "请求失败";
				setError(message);
			});

		return () => {
			isActive = false;
		};
	}, [address, page, reset, setData, setError, setLoading]);

	return state;
};
