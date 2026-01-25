import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { AgentProxyController } from "./agent-proxy.controller";
import { AgentProxyService } from "./agent-proxy.service";

@Module({
	imports: [HttpModule],
	controllers: [AgentProxyController],
	providers: [AgentProxyService],
})
export class AgentProxyModule {}
