import { Injectable } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bull";
import type { Queue } from "bull";
import { MATCHING_JOB_NAME, MATCHING_QUEUE_NAME } from "./jobs.matching.constants";

@Injectable()
export class JobsMatchingQueueService {
  constructor(@InjectQueue(MATCHING_QUEUE_NAME) private readonly queue: Queue) {}

  async enqueue(jobId: string): Promise<void> {
    await this.queue.add(
      MATCHING_JOB_NAME,
      { jobId },
      {
        attempts: 3,
        backoff: { type: "exponential", delay: 1000 },
        removeOnComplete: true,
        removeOnFail: false
      }
    );
  }
}
