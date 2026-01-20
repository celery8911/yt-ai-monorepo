import { type AxiosInstance, type AxiosRequestConfig } from "axios";
export type HttpClientOptions = {
    baseURL?: string;
    timeout?: number;
    headers?: Record<string, string>;
};
export declare const createHttpClient: (options?: HttpClientOptions) => AxiosInstance;
export declare const setHttpClientOptions: (options: HttpClientOptions) => void;
export declare const getHttpClient: (options?: HttpClientOptions) => AxiosInstance;
export declare const request: <T>(config: AxiosRequestConfig, options?: HttpClientOptions) => Promise<T>;
