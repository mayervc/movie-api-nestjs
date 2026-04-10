import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn
} from 'typeorm';

@Entity('stripe_events')
export class StripeEvent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: 'stripe_event_id',
    type: 'varchar',
    length: 255,
    unique: true
  })
  stripeEventId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
