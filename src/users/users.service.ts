import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryFailedError } from 'typeorm';
import { User } from './entities/user.entity';

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

  async create(userData: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }): Promise<User> {
    // Verificar si el email ya existe
    const existingUser = await this.findByEmail(userData.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    try {
      const user = this.userRepository.create(userData);
      return await this.userRepository.save(user);
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
}
