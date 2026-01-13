import { setHttpClientOptions } from "@yt/libs/http";

setHttpClientOptions({
	baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api",
});
