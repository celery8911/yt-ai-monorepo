import { Module } from "@nestjs/common";
import { AgentsModule } from "../agents/agents.module";
import { JobsModule } from "../jobs/jobs.module";
import { WalletModule } from "../wallet/wallet.module";
import { DashboardController } from "./dashboard.controller";
import { DashboardResolver } from "./dashboard.resolver";
import { DashboardService } from "./dashboard.service";

@Module({
  imports: [JobsModule, AgentsModule, WalletModule],
  controllers: [DashboardController],
  providers: [DashboardService, DashboardResolver]
})
export class DashboardModule {}
