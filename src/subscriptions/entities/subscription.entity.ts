import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { SubscriptionPlan } from '../enums/subscription-plan.enum';

const SUBSCRIPTION_STATUS_DEFAULT = 'incomplete';

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id', type: 'integer' })
  userId: number;

  @Column({ name: 'stripe_subscription_id', type: 'varchar', length: 255 })
  stripeSubscriptionId: string;

  @Column({ name: 'stripe_customer_id', type: 'varchar', length: 255 })
  stripeCustomerId: string;

  @Column({
    name: 'plan',
    type: 'enum',
    enum: SubscriptionPlan
  })
  plan: SubscriptionPlan;

  @Column({
    name: 'status',
    type: 'varchar',
    length: 50,
    default: SUBSCRIPTION_STATUS_DEFAULT
  })
  status: string;

  @Column({ name: 'current_period_start', type: 'date' })
  currentPeriodStart: Date;

  @Column({ name: 'current_period_end', type: 'date' })
  currentPeriodEnd: Date;

  @Column({ name: 'cancel_at_period_end', type: 'boolean', default: false })
  cancelAtPeriodEnd: boolean;

  @Column({ name: 'discount_percent', type: 'integer' })
  discountPercent: number;

  @Column({ name: 'free_tickets_per_month', type: 'integer' })
  freeTicketsPerMonth: number;

  @Column({ name: 'free_tickets_remaining', type: 'integer' })
  freeTicketsRemaining: number;

  @Column({ name: 'free_tickets_used', type: 'integer', default: 0 })
  freeTicketsUsed: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
