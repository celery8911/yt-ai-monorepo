import { Injectable, HttpException } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { catchError } from "rxjs/operators";
import { AxiosError } from "axios";

@Injectable()
export class AgentProxyService {
	private readonly agentServiceUrl: string;

	constructor(private readonly httpService: HttpService) {
		this.agentServiceUrl =
			process.env.AI_AGENT_SERVICE_URL || "http://localhost:4111";
	}

	async proxyRequest(
		method: "GET" | "POST" | "PUT" | "DELETE",
		endpoint: string,
		data?: any,
		headers?: any,
	) {
		const url = `${this.agentServiceUrl}${endpoint}`;

		// 过滤掉 host header，避免转发错误
		const {
			host,
			"content-length": contentLength,
			...forwardHeaders
		} = headers || {};

		const request$ = this.httpService
			.request({
				method,
				url,
				data,
				headers: forwardHeaders,
			})
			.pipe(
				catchError((error: AxiosError) => {
					const status = error.response?.status || 500;
					const responseData = error.response?.data || error.message;
					throw new HttpException(responseData, status);
				}),
			);

		const response = await firstValueFrom<{ data: any }>(request$);
		return response.data;
	}
}
