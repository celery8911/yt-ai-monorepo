import { Module } from "@nestjs/common";
import { EngagementsService } from "./engagements.service";
import { EngagementsController } from "./engagements.controller";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
	imports: [PrismaModule],
	controllers: [EngagementsController],
	providers: [EngagementsService],
	exports: [EngagementsService],
})
export class EngagementsModule {}
