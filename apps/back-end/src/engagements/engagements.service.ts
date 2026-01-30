import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Engagement, EngagementStatus, EngagementType } from "../common/types";
import { generateId, toNumber } from "../common/utils";
import { CreateEngagementDto } from "./engagements.dto";

@Injectable()
export class EngagementsService {
	constructor(private readonly prisma: PrismaService) {}

	private mapEngagement(engagement: any): Engagement {
		return {
			id: engagement.id,
			engagementId: engagement.engagementId ?? undefined,
			escrowId: engagement.escrowId,
			userId: engagement.userId,
			agentId: engagement.agentId,
			jobId: engagement.jobId ?? undefined,
			agentOwner: engagement.agentOwner,
			price: toNumber(engagement.price) ?? 0,
			type: engagement.type as EngagementType,
			status: engagement.status as EngagementStatus,
			startTime: engagement.startTime.toISOString(),
			endTime: engagement.endTime?.toISOString(),
		};
	}

	async create(dto: CreateEngagementDto): Promise<Engagement> {
		const engagement = await this.prisma.engagement.create({
			data: {
				id: generateId("eng"),
				escrowId: dto.escrowId,
				userId: dto.userId,
				agentId: dto.agentId,
				jobId: dto.jobId,
				agentOwner: dto.agentOwner,
				price: dto.price,
				type: dto.type,
				status: "ACTIVE",
			},
		});

		// If it's JOB_BASED, we might want to update the job status as well
		if (dto.type === "JOB_BASED" && dto.jobId) {
			await this.prisma.job.update({
				where: { id: dto.jobId },
				data: { status: "IN_PROGRESS", selectedAgentId: dto.agentId },
			});
		}

		return this.mapEngagement(engagement);
	}

	async findByEscrowId(escrowId: string): Promise<Engagement | undefined> {
		const engagement = await this.prisma.engagement.findUnique({
			where: { escrowId },
		});
		return engagement ? this.mapEngagement(engagement) : undefined;
	}

	async updateStatus(
		id: string,
		status: EngagementStatus,
	): Promise<Engagement> {
		const engagement = await this.prisma.engagement.update({
			where: { id },
			data: {
				status,
				endTime:
					status === "COMPLETED" || status === "CANCELLED"
						? new Date()
						: undefined,
			},
		});
		return this.mapEngagement(engagement);
	}

	async listByUser(userId: string): Promise<Engagement[]> {
		const items = await this.prisma.engagement.findMany({
			where: { userId },
			orderBy: { startTime: "desc" },
		});
		return items.map((item: any) => this.mapEngagement(item));
	}

	async listByAgent(agentId: string): Promise<Engagement[]> {
		const items = await this.prisma.engagement.findMany({
			where: { agentId },
			orderBy: { startTime: "desc" },
		});
		return items.map((item: any) => this.mapEngagement(item));
	}
}
