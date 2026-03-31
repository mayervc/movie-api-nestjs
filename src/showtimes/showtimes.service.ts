import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Showtime } from './entities/showtime.entity';
import { SearchShowtimesDto } from './dto/search-showtimes.dto';

@Injectable()
export class ShowtimesService {
  constructor(
    @InjectRepository(Showtime)
    private readonly showtimesRepository: Repository<Showtime>
  ) {}

  async findOne(id: number): Promise<Showtime> {
    const showtime = await this.showtimesRepository.findOne({
      where: { id },
      relations: ['movie', 'room']
    });
    if (!showtime) {
      throw new NotFoundException(`Showtime with ID ${id} not found`);
    }
    return showtime;
  }

  async search(dto: SearchShowtimesDto): Promise<Showtime[]> {
    const qb = this.showtimesRepository.createQueryBuilder('showtime');

    if (dto.movieId !== undefined) {
      qb.andWhere('showtime.movieId = :movieId', { movieId: dto.movieId });
    }
    if (dto.roomId !== undefined) {
      qb.andWhere('showtime.roomId = :roomId', { roomId: dto.roomId });
    }
    if (dto.dateFrom !== undefined) {
      qb.andWhere('showtime.startTime >= :dateFrom', {
        dateFrom: dto.dateFrom
      });
    }
    if (dto.dateTo !== undefined) {
      qb.andWhere('showtime.startTime <= :dateTo', { dateTo: dto.dateTo });
    }

    qb.orderBy('showtime.startTime', 'ASC');

    return qb.getMany();
  }
}
