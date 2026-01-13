import { Module } from "@nestjs/common";
import { DaoController } from "./dao.controller";
import { DaoResolver } from "./dao.resolver";
import { DaoService } from "./dao.service";

@Module({
  controllers: [DaoController],
  providers: [DaoService, DaoResolver],
  exports: [DaoService]
})
export class DaoModule {}
