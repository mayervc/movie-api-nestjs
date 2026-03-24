import { DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/enums/user-role.enum';
import { hashPassword } from '../common/utils/password.util';

export async function seedUsers(dataSource: DataSource): Promise<void> {
  const userRepository = dataSource.getRepository(User);

  const adminPassword = await hashPassword('admin123');
  const userPassword = await hashPassword('user123');

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
    const existing = await userRepository.findOne({
      where: { email: u.email }
    });
    if (!existing) {
      await userRepository.save(userRepository.create(u));
      console.log(`  User created: ${u.email} (role: ${u.role})`);
    }
  }
}
