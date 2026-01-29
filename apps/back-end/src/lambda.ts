import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ExpressAdapter } from "@nestjs/platform-express";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";
import serverlessExpress from "@codegenie/serverless-express";
import type {
	Handler,
	Context,
	APIGatewayProxyEvent,
	Callback,
} from "aws-lambda";
import express from "express";

let cachedServer: Handler;

async function bootstrap() {
	if (!cachedServer) {
		const expressApp = express();
		const adapter = new ExpressAdapter(expressApp);

		const app = await NestFactory.create(AppModule, adapter, {
			cors: true,
			logger: ["error", "warn", "log"],
		});

		app.setGlobalPrefix("api");
		app.useGlobalPipes(
			new ValidationPipe({
				whitelist: true,
				transform: true,
				forbidNonWhitelisted: false,
			}),
		);

		await app.init();

		cachedServer = serverlessExpress({ app: expressApp });
	}

	return cachedServer;
}

export const handler: Handler = async (
	event: APIGatewayProxyEvent,
	context: Context,
	callback: Callback,
) => {
	// 复用容器，避免冷启动
	context.callbackWaitsForEmptyEventLoop = false;

	const server = await bootstrap();
	return server(event, context, callback);
};
