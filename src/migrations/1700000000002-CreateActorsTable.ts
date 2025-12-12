import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateActorsTable1700000000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'actors',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment'
          },
          {
            name: 'first_name',
            type: 'varchar',
            isNullable: true
          },
          {
            name: 'last_name',
            type: 'varchar',
            isNullable: true
          },
          {
            name: 'nick_name',
            type: 'varchar',
            isNullable: true
          },
          {
            name: 'birthdate',
            type: 'date',
            isNullable: true
          },
          {
            name: 'popularity',
            type: 'decimal',
            precision: 5,
            scale: 2,
            default: 0,
            isNullable: true
          },
          {
            name: 'profile_image',
            type: 'varchar',
            isNullable: true
          },
          {
            name: 'character',
            type: 'varchar',
            isNullable: true
          },
          {
            name: 'tmdb_id',
            type: 'integer',
            isUnique: true,
            isNullable: true
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
            isNullable: false
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
            isNullable: false
          }
        ]
      }),
      true
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('actors');
  }
}
