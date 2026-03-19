import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cinema } from './entities/cinema.entity';
import { CreateCinemaDto } from './dto/create-cinema.dto';

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

  async create(createCinemaDto: CreateCinemaDto): Promise<Cinema> {
    try {
      const cinema = this.cinemasRepository.create({
        name: createCinemaDto.name,
        address: createCinemaDto.address ?? null,
        city: createCinemaDto.city ?? null,
        country: createCinemaDto.country ?? null,
        phoneNumber: createCinemaDto.phoneNumber ?? null,
        countryCode: createCinemaDto.countryCode ?? null
      });
      return await this.cinemasRepository.save(cinema);
    } catch (error) {
      // PostgreSQL unique constraint violation
      if (error?.code === '23505') {
        throw new BadRequestException('Cinema name must be unique');
      }
      throw error;
    }
  }
}

