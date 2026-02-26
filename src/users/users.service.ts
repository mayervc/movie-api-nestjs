import {
  Injectable,
  ConflictException,
  NotFoundException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryFailedError } from 'typeorm';
import { User } from './entities/user.entity';

export type CreateUserInput = Pick<
  User,
  'email' | 'password' | 'firstName' | 'lastName' | 'role'
>;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { email }
    });
  }

  async findById(id: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async create(userData: CreateUserInput): Promise<User> {
    // Verificar si el email ya existe
    const existingUser = await this.findByEmail(userData.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    try {
      return await this.userRepository.save(userData);
    } catch (error) {
      // Manejar error de constraint único en caso de race condition
      if (
        error instanceof QueryFailedError &&
        error.message.includes('unique')
      ) {
        throw new ConflictException('Email already exists');
      }
      throw error;
    }
  }

  async update(
    id: number,
    updates: Partial<Pick<User, 'firstName' | 'lastName' | 'email'>>
  ): Promise<User> {
    const user = await this.findById(id);
    if (updates.email && updates.email !== user.email) {
      const existing = await this.findByEmail(updates.email);
      if (existing) {
        throw new ConflictException('Email already exists');
      }
    }
    Object.assign(user, updates);
    return await this.userRepository.save(user);
  }
}
