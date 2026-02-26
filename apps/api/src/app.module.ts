import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ImportsModule } from './imports/imports.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { InsightsModule } from './insights/insights.module';
import { PlansModule } from './plans/plans.module';
import { PropModule } from './prop/prop.module';
import { JournalModule } from './journal/journal.module';
import { AccountsModule } from './accounts/accounts.module';

@Module({
    imports: [
        PrismaModule,
        AuthModule,
        ImportsModule,
        AnalyticsModule,
        InsightsModule,
        PlansModule,
        PropModule,
        JournalModule,
        AccountsModule,
    ],
})
export class AppModule { }
