import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStripePaymentIntentToShowtimeTickets1700000000016 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "showtime_tickets"
      ADD COLUMN "stripe_payment_intent_id" character varying(255)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "showtime_tickets" DROP COLUMN "stripe_payment_intent_id"
    `);
  }
}
