import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey
} from 'typeorm';

export class CreateCastTable1700000000003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'cast',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment'
          },
          {
            name: 'movie_id',
            type: 'integer',
            isNullable: false
          },
          {
            name: 'actor_id',
            type: 'integer',
            isNullable: false
          },
          {
            name: 'role',
            type: 'varchar',
            isNullable: false
          },
          {
            name: 'characters',
            type: 'text',
            isArray: true,
            isNullable: false
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

    // Foreign keys
    await queryRunner.createForeignKey(
      'cast',
      new TableForeignKey({
        columnNames: ['movie_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'movies',
        onDelete: 'CASCADE'
      })
    );

    await queryRunner.createForeignKey(
      'cast',
      new TableForeignKey({
        columnNames: ['actor_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'actors',
        onDelete: 'CASCADE'
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('cast');
    const foreignKeyMovie = table.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('movie_id') !== -1
    );
    const foreignKeyActor = table.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('actor_id') !== -1
    );

    if (foreignKeyMovie) {
      await queryRunner.dropForeignKey('cast', foreignKeyMovie);
    }
    if (foreignKeyActor) {
      await queryRunner.dropForeignKey('cast', foreignKeyActor);
    }

    await queryRunner.dropTable('cast');
  }
}
