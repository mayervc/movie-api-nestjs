import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey
} from 'typeorm';

export class CreateRoomsTables1700000000012 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'rooms',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment'
          },
          { name: 'name', type: 'varchar', isNullable: false },
          { name: 'capacity', type: 'integer', isNullable: true },
          { name: 'cinema_id', type: 'integer', isNullable: false },
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
        ],
        uniques: [
          {
            name: 'UQ_rooms_cinema_id_name',
            columnNames: ['cinema_id', 'name']
          }
        ],
        foreignKeys: [
          new TableForeignKey({
            columnNames: ['cinema_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'cinemas',
            onDelete: 'CASCADE'
          })
        ]
      }),
      true
    );

    await queryRunner.createTable(
      new Table({
        name: 'room_blocks',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment'
          },
          { name: 'name', type: 'varchar', isNullable: false },
          { name: 'row_label', type: 'varchar', isNullable: true },
          { name: 'room_id', type: 'integer', isNullable: false },
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
        ],
        foreignKeys: [
          new TableForeignKey({
            columnNames: ['room_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'rooms',
            onDelete: 'CASCADE'
          })
        ]
      }),
      true
    );

    await queryRunner.createTable(
      new Table({
        name: 'room_seats',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment'
          },
          { name: 'seat_number', type: 'varchar', isNullable: false },
          { name: 'room_block_id', type: 'integer', isNullable: false },
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
        ],
        foreignKeys: [
          new TableForeignKey({
            columnNames: ['room_block_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'room_blocks',
            onDelete: 'CASCADE'
          })
        ]
      }),
      true
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('room_seats', true);
    await queryRunner.dropTable('room_blocks', true);
    await queryRunner.dropTable('rooms', true);
  }
}
