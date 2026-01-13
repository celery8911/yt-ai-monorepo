import { Module } from "@nestjs/common";
import { WalletController } from "./wallet.controller";
import { WalletResolver } from "./wallet.resolver";
import { WalletService } from "./wallet.service";

@Module({
  controllers: [WalletController],
  providers: [WalletService, WalletResolver],
  exports: [WalletService]
})
export class WalletModule {}
