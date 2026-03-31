import { DataSource } from 'typeorm';

export async function seedShowtimes(dataSource: DataSource): Promise<void> {
  const movies = await dataSource.query<{ id: number; title: string }[]>(
    `SELECT id, title FROM movies LIMIT 5`
  );

  if (movies.length === 0) {
    console.log('  No movies found, skipping showtimes seeder');
    return;
  }

  const rooms = await dataSource.query<{ id: number; name: string }[]>(
    `SELECT id, name FROM rooms LIMIT 5`
  );

  if (rooms.length === 0) {
    console.log('  No rooms found, skipping showtimes seeder');
    return;
  }

  const baseDate = new Date('2026-04-01T00:00:00Z');
  const prices = [7.5, 9.99, 12.5, 15.0];
  const showtimesInserted: number[] = [];

  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    for (const movie of movies) {
      const room = rooms[dayOffset % rooms.length];
      const hour = 16 + (dayOffset % 4) * 2;

      const startTime = new Date(baseDate);
      startTime.setDate(baseDate.getDate() + dayOffset);
      startTime.setUTCHours(hour, 0, 0, 0);

      const ticketPrice = prices[(movie.id + dayOffset) % prices.length];

      const rows = await dataSource.query<{ id: number }[]>(
        `INSERT INTO showtimes (movie_id, room_id, start_time, ticket_price, created_at, updated_at)
         VALUES ($1, $2, $3, $4, now(), now())
         RETURNING id`,
        [movie.id, room.id, startTime.toISOString(), ticketPrice]
      );

      showtimesInserted.push(rows[0].id);
      console.log(
        `  Showtime: ${movie.title} @ ${room.name} — ${startTime.toISOString()} ($${ticketPrice})`
      );
    }
  }

  console.log(`  Total showtimes inserted: ${showtimesInserted.length}`);
}
