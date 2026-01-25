import { Module } from "@nestjs/common";
import { AgentsController } from "./agents.controller";
import { AgentsResolver } from "./agents.resolver";
import { AgentsService } from "./agents.service";
import { MastraService } from "./mastra.service";

@Module({
	controllers: [AgentsController],
	providers: [AgentsService, AgentsResolver, MastraService],
	exports: [AgentsService, MastraService],
})
export class AgentsModule {}
