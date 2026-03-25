import { DataSource } from 'typeorm';

type BlockLayout = {
  name: string;
  rowLabel: string;
  seatCount: number;
};

type RoomLayout = {
  name: string;
  blocks: BlockLayout[];
};

type CinemaLayout = {
  cinemaName: string;
  rooms: RoomLayout[];
};

const STANDARD: RoomLayout = {
  name: 'Sala Estandar',
  blocks: [
    { name: 'Frontal', rowLabel: 'A', seatCount: 12 },
    { name: 'Central Izquierda', rowLabel: 'B', seatCount: 16 },
    { name: 'Central Derecha', rowLabel: 'C', seatCount: 16 },
    { name: 'Posterior', rowLabel: 'D', seatCount: 12 }
  ]
};

const LARGE: RoomLayout = {
  name: 'Sala Grande',
  blocks: [
    { name: 'Platea Frontal', rowLabel: 'A', seatCount: 20 },
    { name: 'Platea Central', rowLabel: 'B', seatCount: 25 },
    { name: 'Platea Central', rowLabel: 'C', seatCount: 25 },
    { name: 'Nivel Superior', rowLabel: 'D', seatCount: 20 },
    { name: 'Nivel Superior Posterior', rowLabel: 'E', seatCount: 15 }
  ]
};

const SMALL: RoomLayout = {
  name: 'Sala Pequeña',
  blocks: [
    { name: 'Frontal', rowLabel: 'A', seatCount: 8 },
    { name: 'Posterior', rowLabel: 'B', seatCount: 8 }
  ]
};

const VIP: RoomLayout = {
  name: 'Sala VIP',
  blocks: [
    { name: 'VIP Frontal', rowLabel: 'A', seatCount: 4 },
    { name: 'VIP Posterior', rowLabel: 'B', seatCount: 6 }
  ]
};

const PREMIUM: RoomLayout = {
  name: 'Sala Premium',
  blocks: [
    { name: 'Premium', rowLabel: 'A', seatCount: 8 },
    { name: 'Estandar', rowLabel: 'B', seatCount: 12 },
    { name: 'Economica', rowLabel: 'C', seatCount: 10 }
  ]
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

    for (const roomLayout of cinemaLayout.rooms) {
      const totalCapacity = roomLayout.blocks.reduce(
        (sum, b) => sum + b.seatCount,
        0
      );

      const roomRows = await dataSource.query<{ id: number }[]>(
        `INSERT INTO rooms (name, capacity, cinema_id, created_at, updated_at)
         VALUES ($1, $2, $3, now(), now())
         RETURNING id`,
        [roomLayout.name, totalCapacity, cinemaId]
      );

      const roomId = roomRows[0].id;
      console.log(
        `  Room ensured: ${cinemaLayout.cinemaName} → ${roomLayout.name} (${totalCapacity} seats)`
      );

      for (const block of roomLayout.blocks) {
        const blockRows = await dataSource.query<{ id: number }[]>(
          `INSERT INTO room_blocks (name, row_label, room_id, created_at, updated_at)
           VALUES ($1, $2, $3, now(), now())
           RETURNING id`,
          [block.name, block.rowLabel, roomId]
        );

        const blockId = blockRows[0].id;

        const seatValues = Array.from(
          { length: block.seatCount },
          (_, i) => `('${i + 1}', ${blockId}, now(), now())`
        ).join(', ');

        await dataSource.query(
          `INSERT INTO room_seats (seat_number, room_block_id, created_at, updated_at)
           VALUES ${seatValues}`
        );

        console.log(
          `    Block ${block.rowLabel} - ${block.name}: ${block.seatCount} seats inserted`
        );
      }
    }
  }
}
