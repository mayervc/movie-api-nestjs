import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/enums/user-role.enum';

const SALT_ROUNDS = 10;

export async function seedUsers(dataSource: DataSource): Promise<void> {
  const userRepository = dataSource.getRepository(User);

  const adminPassword = await bcrypt.hash('admin123', SALT_ROUNDS);
  const userPassword = await bcrypt.hash('user123', SALT_ROUNDS);

  const users = [
    {
      email: 'admin@example.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN
    },
    {
      email: 'user@example.com',
      password: userPassword,
      firstName: 'Normal',
      lastName: 'User',
      role: UserRole.USER
    }
  ];

  for (const u of users) {
    const existing = await userRepository.findOne({ where: { email: u.email } });
    if (!existing) {
      await userRepository.save(userRepository.create(u));
      console.log(`  User created: ${u.email} (role: ${u.role})`);
    }
  }
}
