import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSubscriptionsTable1700000000018 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "subscriptions_plan_enum" AS ENUM ('basic', 'premium')
    `);

    await queryRunner.query(`
      CREATE TABLE "subscriptions" (
        "id" SERIAL PRIMARY KEY,
        "user_id" integer NOT NULL,
        "stripe_subscription_id" varchar(255) NOT NULL,
        "stripe_customer_id" varchar(255) NOT NULL,
        "plan" "subscriptions_plan_enum" NOT NULL,
        "status" varchar(50) NOT NULL DEFAULT 'incomplete',
        "current_period_start" date NOT NULL,
        "current_period_end" date NOT NULL,
        "cancel_at_period_end" boolean NOT NULL DEFAULT false,
        "discount_percent" integer NOT NULL,
        "free_tickets_per_month" integer NOT NULL,
        "free_tickets_remaining" integer NOT NULL,
        "free_tickets_used" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "FK_subscriptions_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "subscriptions"`);
    await queryRunner.query(`DROP TYPE "subscriptions_plan_enum"`);
  }
}
