import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cinema } from './entities/cinema.entity';

@Injectable()
export class CinemasService {
  constructor(
    @InjectRepository(Cinema)
    private readonly cinemasRepository: Repository<Cinema>
  ) {}

  async findAll(page = 1, limit = 10) {
    if (page < 1 || limit < 1) {
      throw new BadRequestException('Page and limit must be >= 1');
    }

    const skip = (page - 1) * limit;
    const queryBuilder = this.cinemasRepository.createQueryBuilder('cinema');
    queryBuilder.orderBy('cinema.createdAt', 'DESC').skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }
}

