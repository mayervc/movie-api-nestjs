import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateMoviesTable1700000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'movies',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment'
          },
          {
            name: 'title',
            type: 'varchar',
            isUnique: true,
            isNullable: false
          },
          {
            name: 'release_date',
            type: 'date',
            isNullable: false
          },
          {
            name: 'genres',
            type: 'text',
            isArray: true,
            isNullable: true
          },
          {
            name: 'duration',
            type: 'integer',
            isNullable: false
          },
          {
            name: 'trending',
            type: 'boolean',
            default: false,
            isNullable: false
          },
          {
            name: 'rating',
            type: 'decimal',
            precision: 3,
            scale: 1,
            isNullable: true
          },
          {
            name: 'image_url',
            type: 'varchar',
            isNullable: true
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true
          },
          {
            name: 'clasification',
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

    await queryRunner.createIndex(
      'movies',
      new TableIndex({
        name: 'IDX_MOVIES_TITLE',
        columnNames: ['title']
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('movies');
  }
}
