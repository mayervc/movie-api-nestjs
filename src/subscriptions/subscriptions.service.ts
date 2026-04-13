import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from './entities/subscription.entity';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionsRepository: Repository<Subscription>
  ) {}

  async getMySubscription(userId: number): Promise<Subscription | null> {
    return this.subscriptionsRepository.findOne({
      where: { userId },
      order: { createdAt: 'DESC' }
    });
  }
}
