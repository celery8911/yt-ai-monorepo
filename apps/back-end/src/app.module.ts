import { Module } from "@nestjs/common";
import { GraphQLModule } from "@nestjs/graphql";
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

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      sortSchema: true,
      playground: true
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
    DashboardModule
  ]
})
export class AppModule {}
