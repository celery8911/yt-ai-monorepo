import { Injectable } from "@nestjs/common";
import type { Bill as PrismaBill } from "@prisma/client";
import { Bill } from "../common/types";
import { generateId, nowIso, toNumber } from "../common/utils";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class BillsService {
  private readonly useDatabase = Boolean(process.env.DATABASE_URL);
  private readonly bills: Bill[] = [];

  constructor(private readonly prisma: PrismaService) {}

  private mapBill(bill: PrismaBill): Bill {
    return {
      id: bill.id,
      jobId: bill.jobId,
      agentId: bill.agentId,
      amount: toNumber(bill.amount) ?? 0,
      currency: bill.currency,
      status: bill.status as Bill["status"],
      escrowId: bill.escrowId ?? undefined,
      payeeAddress: bill.payeeAddress,
      payerAddress: bill.payerAddress,
      createdAt: bill.createdAt.toISOString(),
      paidAt: bill.paidAt ? bill.paidAt.toISOString() : undefined
    };
  }

  async list(role?: "payee" | "payer", address?: string): Promise<Bill[]> {
    if (this.useDatabase) {
      const where: Record<string, string> = {};
      if (role && address) {
        if (role === "payee") where.payeeAddress = address;
        if (role === "payer") where.payerAddress = address;
      }
      const items = await this.prisma.bill.findMany({ where });
      return items.map((item) => this.mapBill(item));
    }
    if (!role || !address) return this.bills;
    if (role === "payee") {
      return this.bills.filter((bill) => bill.payeeAddress === address);
    }
    return this.bills.filter((bill) => bill.payerAddress === address);
  }

  async getById(id: string): Promise<Bill | undefined> {
    if (this.useDatabase) {
      const bill = await this.prisma.bill.findUnique({ where: { id } });
      return bill ? this.mapBill(bill) : undefined;
    }
    return this.bills.find((bill) => bill.id === id);
  }

  async createSeed(data: Omit<Bill, "id" | "createdAt">): Promise<Bill> {
    if (this.useDatabase) {
      const created = await this.prisma.bill.create({
        data: {
          id: generateId("bill"),
          jobId: data.jobId,
          agentId: data.agentId,
          amount: data.amount,
          currency: data.currency,
          status: data.status,
          escrowId: data.escrowId,
          payeeAddress: data.payeeAddress,
          payerAddress: data.payerAddress,
          paidAt: data.paidAt ? new Date(data.paidAt) : undefined
        }
      });
      return this.mapBill(created);
    }
    const bill: Bill = {
      id: generateId("bill"),
      createdAt: nowIso(),
      ...data
    };
    this.bills.push(bill);
    return bill;
  }
}
