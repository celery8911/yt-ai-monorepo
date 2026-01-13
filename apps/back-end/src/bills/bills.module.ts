import { Module } from "@nestjs/common";
import { BillsController } from "./bills.controller";
import { BillsResolver } from "./bills.resolver";
import { BillsService } from "./bills.service";

@Module({
  controllers: [BillsController],
  providers: [BillsService, BillsResolver],
  exports: [BillsService]
})
export class BillsModule {}
