import { DataSource } from 'typeorm';
import { Cinema } from '../cinemas/entities/cinema.entity';

export async function seedCinemas(dataSource: DataSource): Promise<void> {
  const cinemaRepository = dataSource.getRepository(Cinema);

  const cinemas = [
    { name: 'Cinema Aurora' },
    { name: 'Cinema Central' },
    { name: 'Cinema Plaza' },
    { name: 'Cinema River' },
    { name: 'Cinema Grand' }
  ];

  for (const c of cinemas) {
    const existing = await cinemaRepository.findOne({
      where: { name: c.name }
    });

    if (!existing) {
      await cinemaRepository.save(cinemaRepository.create(c));
      console.log(`  Cinema created: ${c.name}`);
    }
  }
}

