import axios, { type AxiosInstance, type AxiosRequestConfig } from "axios";

export type HttpClientOptions = {
	baseURL?: string;
	timeout?: number;
	headers?: Record<string, string>;
};

let defaultOptions: HttpClientOptions = {};
let defaultClient: AxiosInstance | null = null;

export const createHttpClient = (
	options: HttpClientOptions = {},
): AxiosInstance => {
	const { baseURL, timeout = 10000, headers } = options;

	return axios.create({
		baseURL,
		timeout,
		headers,
	});
};

export const setHttpClientOptions = (options: HttpClientOptions) => {
	defaultOptions = { ...defaultOptions, ...options };
	defaultClient = null;
};

export const getHttpClient = (options?: HttpClientOptions): AxiosInstance => {
	if (options) {
		return createHttpClient({ ...defaultOptions, ...options });
	}

	if (!defaultClient) {
		defaultClient = createHttpClient(defaultOptions);
	}

	return defaultClient;
};

export const request = async <T>(
	config: AxiosRequestConfig,
	options?: HttpClientOptions,
): Promise<T> => {
	const client = getHttpClient(options);
	const response = await client.request<T>(config);
	return response.data;
};
