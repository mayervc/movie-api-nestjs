import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Subscription } from './entities/subscription.entity';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionPurchasesService } from './subscription-purchases.service';

@Module({
  imports: [TypeOrmModule.forFeature([Subscription]), ConfigModule],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, SubscriptionPurchasesService],
  exports: [SubscriptionsService, SubscriptionPurchasesService]
})
export class SubscriptionsModule {}
