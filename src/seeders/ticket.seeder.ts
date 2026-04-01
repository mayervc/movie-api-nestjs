import { DataSource } from 'typeorm';

export async function seedTickets(dataSource: DataSource): Promise<void> {
  const users = await dataSource.query<{ id: number; email: string }[]>(
    `SELECT id, email FROM users LIMIT 2`
  );

  if (users.length === 0) {
    console.log('  No users found, skipping tickets seeder');
    return;
  }

  const showtimes = await dataSource.query<{ id: number }[]>(
    `SELECT id FROM showtimes ORDER BY start_time ASC LIMIT 5`
  );

  if (showtimes.length === 0) {
    console.log('  No showtimes found, skipping tickets seeder');
    return;
  }

  const statuses = ['reserved', 'confirmed', 'cancelled'];
  let count = 0;

  for (let i = 0; i < showtimes.length; i++) {
    const showtime = showtimes[i];

    const seats = await dataSource.query<{ id: number }[]>(
      `SELECT rs.id FROM room_seats rs
       INNER JOIN showtimes s ON s.room_id = rs.room_id
       WHERE s.id = $1
       LIMIT 3`,
      [showtime.id]
    );

    if (seats.length === 0) continue;

    for (let j = 0; j < seats.length; j++) {
      const user = users[j % users.length];
      const seat = seats[j];
      const status = statuses[(i + j) % statuses.length];

      await dataSource.query(
        `INSERT INTO showtime_tickets (user_id, showtime_id, room_seat_id, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, now(), now())`,
        [user.id, showtime.id, seat.id, status]
      );

      console.log(
        `  Ticket: user=${user.email} showtime=${showtime.id} seat=${seat.id} status=${status}`
      );
      count++;
    }
  }

  console.log(`  Total tickets inserted: ${count}`);
}
