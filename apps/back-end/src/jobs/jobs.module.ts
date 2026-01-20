import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bull";
import { AgentsModule } from "../agents/agents.module";
import { DaoModule } from "../dao/dao.module";
import { MatchingModule } from "../matching/matching.module";
import { PrismaModule } from "../prisma/prisma.module";
import { JobsController } from "./jobs.controller";
import { MATCHING_QUEUE_NAME } from "./jobs.matching.constants";
import { JobsMatchingProcessor } from "./jobs.matching.processor";
import { JobsMatchingQueueService } from "./jobs.matching.queue";
import { JobsResolver } from "./jobs.resolver";
import { JobsService } from "./jobs.service";

@Module({
  imports: [
    AgentsModule,
    MatchingModule,
    DaoModule,
    PrismaModule,
    BullModule.registerQueue({ name: MATCHING_QUEUE_NAME })
  ],
  controllers: [JobsController],
  providers: [JobsService, JobsResolver, JobsMatchingQueueService, JobsMatchingProcessor],
  exports: [JobsService]
})
export class JobsModule {}
