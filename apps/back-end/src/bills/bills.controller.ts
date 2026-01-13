import { BadRequestException, Controller, Get, NotFoundException, Param, Query } from "@nestjs/common";
import { BillsService } from "./bills.service";

@Controller("bills")
export class BillsController {
  constructor(private readonly billsService: BillsService) {}

  @Get()
  async list(@Query("role") role?: "payee" | "payer", @Query("address") address?: string) {
    if (role && !address) {
      throw new BadRequestException("address is required when role is provided");
    }
    return this.billsService.list(role, address);
  }

  @Get(":id")
  async detail(@Param("id") id: string) {
    const bill = await this.billsService.getById(id);
    if (!bill) {
      throw new NotFoundException("Bill not found");
    }
    return bill;
  }
}
