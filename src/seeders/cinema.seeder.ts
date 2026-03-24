import { DataSource } from 'typeorm';

export async function seedCinemas(dataSource: DataSource): Promise<void> {
  const cinemas = [
    { name: 'Cinema Aurora' },
    { name: 'Cinema Central' },
    { name: 'Cinema Plaza' },
    { name: 'Cinema River' },
    { name: 'Cinema Grand' }
  ];

  // Insert using raw SQL to avoid relying on the Cinema entity being present yet
  // (this seed runs as part of the cinema migrations/seeders phase).
  const valuesSql = cinemas
    .map((c) => `('${c.name.replace(/'/g, "''")}')`)
    .join(', ');

  await dataSource.query(`
    INSERT INTO "cinemas" ("name")
    VALUES ${valuesSql}
    ON CONFLICT ("name") DO NOTHING
  `);

  for (const c of cinemas) {
    console.log(`  Cinema ensured: ${c.name}`);
  }
}
