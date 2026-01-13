import { Module } from "@nestjs/common";
import { AgentsController } from "./agents.controller";
import { AgentsResolver } from "./agents.resolver";
import { AgentsService } from "./agents.service";

@Module({
  controllers: [AgentsController],
  providers: [AgentsService, AgentsResolver],
  exports: [AgentsService]
})
export class AgentsModule {}
