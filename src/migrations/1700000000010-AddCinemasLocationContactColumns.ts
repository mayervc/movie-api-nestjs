import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds location/contact columns to cinemas. Uses IF NOT EXISTS so re-runs /
 * DBs that already have some columns (e.g. manual changes) do not fail.
 */
export class AddCinemasLocationContactColumns1700000000010 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "cinemas" ADD COLUMN IF NOT EXISTS "address" varchar(500);
      ALTER TABLE "cinemas" ADD COLUMN IF NOT EXISTS "city" varchar(255);
      ALTER TABLE "cinemas" ADD COLUMN IF NOT EXISTS "country" varchar(255);
      ALTER TABLE "cinemas" ADD COLUMN IF NOT EXISTS "phone_number" varchar(50);
      ALTER TABLE "cinemas" ADD COLUMN IF NOT EXISTS "country_code" varchar(10);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "cinemas" DROP COLUMN IF EXISTS "country_code";
      ALTER TABLE "cinemas" DROP COLUMN IF EXISTS "phone_number";
      ALTER TABLE "cinemas" DROP COLUMN IF EXISTS "country";
      ALTER TABLE "cinemas" DROP COLUMN IF EXISTS "city";
      ALTER TABLE "cinemas" DROP COLUMN IF EXISTS "address";
    `);
  }
}
