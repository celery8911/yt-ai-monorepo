import { Module } from "@nestjs/common";
import { GraphQLModule } from "@nestjs/graphql";
import { BullModule } from "@nestjs/bull";
import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";
import { AgentsModule } from "./agents/agents.module";
import { BidsModule } from "./bids/bids.module";
import { BillsModule } from "./bills/bills.module";
import { DaoModule } from "./dao/dao.module";
import { DashboardModule } from "./dashboard/dashboard.module";
import { JobsModule } from "./jobs/jobs.module";
import { MatchingModule } from "./matching/matching.module";
import { PrismaModule } from "./prisma/prisma.module";
import { SupabaseModule } from "./supabase/supabase.module";
import { WalletModule } from "./wallet/wallet.module";
import { KeeperModule } from "./keeper/keeper.module";
import { ChainStatusModule } from "./chain-status/chain-status.module";
import { AgentProxyModule } from "./agent-proxy/agent-proxy.module";
import { EngagementsModule } from "./engagements/engagements.module";
import { AuthModule } from './auth/auth.module';
import { QuoteModule } from './quote/quote.module';

@Module({
  imports: [
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST ?? "127.0.0.1",
        port: Number(process.env.REDIS_PORT ?? 6379),
        password: process.env.REDIS_PASSWORD || undefined,
        db: process.env.REDIS_DB ? Number(process.env.REDIS_DB) : undefined,
      },
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      sortSchema: true,
      playground: true,
    }),
    PrismaModule,
    SupabaseModule,
    JobsModule,
    AgentsModule,
    MatchingModule,
    BidsModule,
    WalletModule,
    BillsModule,
    DaoModule,
    DashboardModule,
    KeeperModule,
    ChainStatusModule,
    AgentProxyModule,
    EngagementsModule,
    AuthModule,
    QuoteModule,
  ],
})
export class AppModule { }
