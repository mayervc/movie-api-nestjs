import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey
} from 'typeorm';

export class CreateCinemaUsersTable1700000000011 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'cinema_users',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment'
          },
          { name: 'cinema_id', type: 'integer', isNullable: false },
          { name: 'user_id', type: 'integer', isNullable: false },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
            isNullable: false
          }
        ],
        uniques: [
          {
            name: 'UQ_cinema_users_cinema_id_user_id',
            columnNames: ['cinema_id', 'user_id']
          }
        ],
        foreignKeys: [
          new TableForeignKey({
            columnNames: ['cinema_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'cinemas',
            onDelete: 'CASCADE'
          }),
          new TableForeignKey({
            columnNames: ['user_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'users',
            onDelete: 'CASCADE'
          })
        ]
      }),
      true
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('cinema_users', true);
  }
}
