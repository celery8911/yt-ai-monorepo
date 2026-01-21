import { Module, forwardRef } from "@nestjs/common";
import { JobsModule } from "../jobs/jobs.module";
import { WalletModule } from "../wallet/wallet.module";
import { DaoController } from "./dao.controller";
import { DaoResolver } from "./dao.resolver";
import { DaoService } from "./dao.service";

@Module({
  imports: [forwardRef(() => JobsModule), WalletModule],
  controllers: [DaoController],
  providers: [DaoService, DaoResolver],
  exports: [DaoService]
})
export class DaoModule {}
