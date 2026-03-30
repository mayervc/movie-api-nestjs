import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateShowtimesTable1700000000014 implements MigrationInterface {
  name = 'CreateShowtimesTable1700000000014';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "showtimes" (
        "id" SERIAL NOT NULL,
        "movie_id" integer NOT NULL,
        "room_id" integer NOT NULL,
        "start_time" TIMESTAMP WITH TIME ZONE NOT NULL,
        "ticket_price" numeric(10,2) NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_showtimes" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "showtimes"
        ADD CONSTRAINT "FK_showtimes_movie_id"
        FOREIGN KEY ("movie_id") REFERENCES "movies"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "showtimes"
        ADD CONSTRAINT "FK_showtimes_room_id"
        FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "showtimes" DROP CONSTRAINT "FK_showtimes_room_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "showtimes" DROP CONSTRAINT "FK_showtimes_movie_id"`
    );
    await queryRunner.query(`DROP TABLE "showtimes"`);
  }
}
