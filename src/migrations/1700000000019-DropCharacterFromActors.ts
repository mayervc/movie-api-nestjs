import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropCharacterFromActors1700000000019 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('actors', 'character');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "actors" ADD COLUMN "character" character varying`
    );
  }
}
