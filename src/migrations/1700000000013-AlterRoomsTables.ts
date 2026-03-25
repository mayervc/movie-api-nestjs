import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey
} from 'typeorm';

export class AlterRoomsTables1700000000013 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Clear seeded data before altering columns — schema changes are not
    // backwards-compatible with existing rows
    await queryRunner.query(
      `TRUNCATE TABLE room_seats, room_blocks, rooms RESTART IDENTITY CASCADE`
    );

    // ── rooms ──────────────────────────────────────────────────────────────
    await queryRunner.dropColumn('rooms', 'capacity');

    await queryRunner.addColumns('rooms', [
      new TableColumn({
        name: 'rows_blocks',
        type: 'integer',
        isNullable: false,
        default: 1
      }),
      new TableColumn({
        name: 'columns_blocks',
        type: 'integer',
        isNullable: false,
        default: 1
      }),
      new TableColumn({
        name: 'details',
        type: 'text',
        isNullable: true
      })
    ]);

    // Remove the temporary defaults (column constraints, not row defaults)
    await queryRunner.query(
      `ALTER TABLE rooms ALTER COLUMN rows_blocks DROP DEFAULT`
    );
    await queryRunner.query(
      `ALTER TABLE rooms ALTER COLUMN columns_blocks DROP DEFAULT`
    );

    // ── room_blocks ────────────────────────────────────────────────────────
    await queryRunner.dropColumn('room_blocks', 'name');
    await queryRunner.dropColumn('room_blocks', 'row_label');

    await queryRunner.addColumns('room_blocks', [
      new TableColumn({
        name: 'row_seats',
        type: 'integer',
        isNullable: false,
        default: 1
      }),
      new TableColumn({
        name: 'columns_seats',
        type: 'integer',
        isNullable: false,
        default: 1
      }),
      new TableColumn({
        name: 'block_row',
        type: 'integer',
        isNullable: false,
        default: 0
      }),
      new TableColumn({
        name: 'block_column',
        type: 'integer',
        isNullable: false,
        default: 0
      })
    ]);

    await queryRunner.query(
      `ALTER TABLE room_blocks ALTER COLUMN row_seats DROP DEFAULT`
    );
    await queryRunner.query(
      `ALTER TABLE room_blocks ALTER COLUMN columns_seats DROP DEFAULT`
    );
    await queryRunner.query(
      `ALTER TABLE room_blocks ALTER COLUMN block_row DROP DEFAULT`
    );
    await queryRunner.query(
      `ALTER TABLE room_blocks ALTER COLUMN block_column DROP DEFAULT`
    );

    // ── room_seats ─────────────────────────────────────────────────────────
    await queryRunner.dropColumn('room_seats', 'seat_number');

    await queryRunner.addColumns('room_seats', [
      new TableColumn({
        name: 'seat_row_label',
        type: 'varchar',
        isNullable: false,
        default: "'A'"
      }),
      new TableColumn({
        name: 'seat_row',
        type: 'integer',
        isNullable: false,
        default: 0
      }),
      new TableColumn({
        name: 'seat_column_label',
        type: 'integer',
        isNullable: false,
        default: 1
      }),
      new TableColumn({
        name: 'seat_column',
        type: 'integer',
        isNullable: false,
        default: 0
      }),
      new TableColumn({
        name: 'room_id',
        type: 'integer',
        isNullable: false,
        default: 0
      })
    ]);

    await queryRunner.query(
      `ALTER TABLE room_seats ALTER COLUMN seat_row_label DROP DEFAULT`
    );
    await queryRunner.query(
      `ALTER TABLE room_seats ALTER COLUMN seat_row DROP DEFAULT`
    );
    await queryRunner.query(
      `ALTER TABLE room_seats ALTER COLUMN seat_column_label DROP DEFAULT`
    );
    await queryRunner.query(
      `ALTER TABLE room_seats ALTER COLUMN seat_column DROP DEFAULT`
    );
    await queryRunner.query(
      `ALTER TABLE room_seats ALTER COLUMN room_id DROP DEFAULT`
    );

    await queryRunner.createForeignKey(
      'room_seats',
      new TableForeignKey({
        columnNames: ['room_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'rooms',
        onDelete: 'CASCADE'
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // ── room_seats ─────────────────────────────────────────────────────────
    const roomSeatsTable = await queryRunner.getTable('room_seats');
    const fkRoom = roomSeatsTable.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('room_id') !== -1
    );
    if (fkRoom) {
      await queryRunner.dropForeignKey('room_seats', fkRoom);
    }

    await queryRunner.dropColumns('room_seats', [
      'room_id',
      'seat_row_label',
      'seat_row',
      'seat_column_label',
      'seat_column'
    ]);

    await queryRunner.addColumn(
      'room_seats',
      new TableColumn({
        name: 'seat_number',
        type: 'varchar',
        isNullable: false,
        default: "''"
      })
    );
    await queryRunner.query(
      `ALTER TABLE room_seats ALTER COLUMN seat_number DROP DEFAULT`
    );

    // ── room_blocks ────────────────────────────────────────────────────────
    await queryRunner.dropColumns('room_blocks', [
      'row_seats',
      'columns_seats',
      'block_row',
      'block_column'
    ]);

    await queryRunner.addColumns('room_blocks', [
      new TableColumn({
        name: 'name',
        type: 'varchar',
        isNullable: false,
        default: "''"
      }),
      new TableColumn({
        name: 'row_label',
        type: 'varchar',
        isNullable: true
      })
    ]);
    await queryRunner.query(
      `ALTER TABLE room_blocks ALTER COLUMN name DROP DEFAULT`
    );

    // ── rooms ──────────────────────────────────────────────────────────────
    await queryRunner.dropColumns('rooms', [
      'rows_blocks',
      'columns_blocks',
      'details'
    ]);

    await queryRunner.addColumn(
      'rooms',
      new TableColumn({
        name: 'capacity',
        type: 'integer',
        isNullable: true
      })
    );
  }
}
