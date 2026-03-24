import { Controller, Post, Get, Body, Param, BadRequestException } from '@nestjs/common';
import { QuoteService, Quote } from './quote.service';

@Controller('quote')
export class QuoteController {
  constructor(private readonly quoteService: QuoteService) {}

  @Post()
  async submitQuote(@Body() body: Omit<Quote, 'id' | 'createdAt'>) {
    if (!body.signature || !body.owner || !body.agentId) {
      throw new BadRequestException('Missing required quote fields');
    }
    const quote = await this.quoteService.verifyAndStoreQuote(body);
    return { success: true, quote };
  }

  @Get(':agentId')
  getQuotes(@Param('agentId') agentId: string) {
    const quotes = this.quoteService.getQuotesByAgent(agentId);
    return { success: true, quotes };
  }
}
