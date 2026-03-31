import { DataSource } from 'typeorm';

type BlockConfig = {
  rowSeats: number;
  columnsSeats: number;
};

type RoomConfig = {
  name: string;
  rowsBlocks: number;
  columnsBlocks: number;
  blockConfig: BlockConfig;
  details?: string;
};

type CinemaLayout = {
  cinemaName: string;
  rooms: RoomConfig[];
};

const STANDARD: RoomConfig = {
  name: 'Sala Estandar',
  rowsBlocks: 2,
  columnsBlocks: 2,
  blockConfig: { rowSeats: 5, columnsSeats: 6 }
};

const LARGE: RoomConfig = {
  name: 'Sala Grande',
  rowsBlocks: 3,
  columnsBlocks: 2,
  blockConfig: { rowSeats: 6, columnsSeats: 7 }
};

const SMALL: RoomConfig = {
  name: 'Sala Pequeña',
  rowsBlocks: 1,
  columnsBlocks: 2,
  blockConfig: { rowSeats: 4, columnsSeats: 4 }
};

const VIP: RoomConfig = {
  name: 'Sala VIP',
  rowsBlocks: 1,
  columnsBlocks: 2,
  blockConfig: { rowSeats: 3, columnsSeats: 4 },
  details: 'VIP room with reclining seats'
};

const PREMIUM: RoomConfig = {
  name: 'Sala Premium',
  rowsBlocks: 2,
  columnsBlocks: 3,
  blockConfig: { rowSeats: 4, columnsSeats: 5 }
};

const CINEMA_LAYOUTS: CinemaLayout[] = [
  {
    cinemaName: 'Cinema Aurora',
    rooms: [STANDARD, LARGE, VIP]
  },
  {
    cinemaName: 'Cinema Central',
    rooms: [STANDARD, SMALL]
  },
  {
    cinemaName: 'Cinema Plaza',
    rooms: [LARGE, PREMIUM, STANDARD]
  },
  {
    cinemaName: 'Cinema River',
    rooms: [STANDARD, PREMIUM]
  },
  {
    cinemaName: 'Cinema Grand',
    rooms: [LARGE, STANDARD, VIP, SMALL]
  }
];

export async function seedRooms(dataSource: DataSource): Promise<void> {
  for (const cinemaLayout of CINEMA_LAYOUTS) {
    const cinemaRows = await dataSource.query<{ id: number }[]>(
      `SELECT id FROM cinemas WHERE name = $1 LIMIT 1`,
      [cinemaLayout.cinemaName]
    );

    if (cinemaRows.length === 0) {
      console.log(`  Cinema not found, skipping: ${cinemaLayout.cinemaName}`);
      continue;
    }

    const cinemaId = cinemaRows[0].id;

    for (const room of cinemaLayout.rooms) {
      const { rowsBlocks, columnsBlocks, blockConfig, details } = room;
      const { rowSeats, columnsSeats } = blockConfig;

      const existing = await dataSource.query<{ id: number }[]>(
        `SELECT id FROM rooms WHERE name = $1 AND cinema_id = $2 LIMIT 1`,
        [room.name, cinemaId]
      );

      if (existing.length > 0) {
        console.log(
          `  Room already exists, skipping: ${cinemaLayout.cinemaName} -> ${room.name}`
        );
        continue;
      }

      const roomRows = await dataSource.query<{ id: number }[]>(
        `INSERT INTO rooms (name, rows_blocks, columns_blocks, details, cinema_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, now(), now())
         RETURNING id`,
        [room.name, rowsBlocks, columnsBlocks, details ?? null, cinemaId]
      );

      const roomId = roomRows[0].id;
      const totalSeats = rowsBlocks * columnsBlocks * rowSeats * columnsSeats;
      console.log(
        `  Room created: ${cinemaLayout.cinemaName} -> ${room.name} (${rowsBlocks}x${columnsBlocks} blocks, ${totalSeats} seats)`
      );

      for (let blockRow = 0; blockRow < rowsBlocks; blockRow++) {
        for (let blockColumn = 0; blockColumn < columnsBlocks; blockColumn++) {
          const blockRows = await dataSource.query<{ id: number }[]>(
            `INSERT INTO room_blocks (row_seats, columns_seats, block_row, block_column, room_id, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, now(), now())
             RETURNING id`,
            [rowSeats, columnsSeats, blockRow, blockColumn, roomId]
          );

          const blockId = blockRows[0].id;

          const seatValues: string[] = [];
          for (let seatRow = 0; seatRow < rowSeats; seatRow++) {
            const seatRowLabel = String.fromCharCode(65 + seatRow);
            for (let seatColumn = 0; seatColumn < columnsSeats; seatColumn++) {
              const seatColumnLabel = seatColumn + 1;
              seatValues.push(
                `('${seatRowLabel}', ${seatRow}, ${seatColumnLabel}, ${seatColumn}, ${roomId}, ${blockId}, now(), now())`
              );
            }
          }

          await dataSource.query(
            `INSERT INTO room_seats (seat_row_label, seat_row, seat_column_label, seat_column, room_id, room_block_id, created_at, updated_at)
             VALUES ${seatValues.join(', ')}`
          );

          console.log(
            `    Block [${blockRow},${blockColumn}]: ${rowSeats}x${columnsSeats} seats inserted`
          );
        }
      }
    }
  }
}
