import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOrdersAndStripeEventsTable1700000000017 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "orders_status_enum" AS ENUM ('pending', 'completed', 'failed', 'refunded')
    `);

    await queryRunner.query(`
      CREATE TABLE "orders" (
        "id" SERIAL PRIMARY KEY,
        "user_id" integer NOT NULL,
        "showtime_id" integer NOT NULL,
        "stripe_session_id" varchar(255) NOT NULL,
        "stripe_payment_intent_id" varchar(255) NULL,
        "status" "orders_status_enum" NOT NULL DEFAULT 'pending',
        "total_cents" integer NOT NULL,
        "seat_ids" integer[] NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "FK_orders_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_orders_showtime_id" FOREIGN KEY ("showtime_id") REFERENCES "showtimes"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "stripe_events" (
        "id" SERIAL PRIMARY KEY,
        "stripe_event_id" varchar(255) NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_stripe_events_stripe_event_id" UNIQUE ("stripe_event_id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "stripe_events"`);
    await queryRunner.query(`DROP TABLE "orders"`);
    await queryRunner.query(`DROP TYPE "orders_status_enum"`);
  }
}
