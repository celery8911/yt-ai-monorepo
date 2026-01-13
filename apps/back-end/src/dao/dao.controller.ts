import { Body, Controller, Get, NotFoundException, Param, Post } from "@nestjs/common";
import { DaoService } from "./dao.service";
import { InitiateDisputeDto, VoteDto } from "./dao.dto";

@Controller("dao")
export class DaoController {
  constructor(private readonly daoService: DaoService) {}

  @Post("initiate")
  async initiate(@Body() payload: InitiateDisputeDto) {
    return this.daoService.initiate(payload);
  }

  @Post("vote")
  async vote(@Body() payload: VoteDto) {
    const dispute = await this.daoService.vote(payload);
    if (!dispute) {
      throw new NotFoundException("Dispute not found");
    }
    return dispute;
  }

  @Get(":id")
  async detail(@Param("id") id: string) {
    const detail = await this.daoService.getDetail(id);
    if (!detail.dispute) {
      throw new NotFoundException("Dispute not found");
    }
    return detail;
  }
}
