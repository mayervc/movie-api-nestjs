import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateShowtimeTicketsTable1700000000015 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "showtime_tickets_status_enum" AS ENUM ('reserved', 'confirmed', 'cancelled')
    `);

    await queryRunner.query(`
      CREATE TABLE "showtime_tickets" (
        "id" SERIAL PRIMARY KEY,
        "user_id" integer NOT NULL,
        "showtime_id" integer NOT NULL,
        "room_seat_id" integer NOT NULL,
        "status" "showtime_tickets_status_enum" NOT NULL DEFAULT 'reserved',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "FK_showtime_tickets_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_showtime_tickets_showtime_id" FOREIGN KEY ("showtime_id") REFERENCES "showtimes"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_showtime_tickets_room_seat_id" FOREIGN KEY ("room_seat_id") REFERENCES "room_seats"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "showtime_tickets"`);
    await queryRunner.query(`DROP TYPE "showtime_tickets_status_enum"`);
  }
}
