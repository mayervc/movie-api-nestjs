import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Showtime } from './entities/showtime.entity';
import { SearchShowtimesDto } from './dto/search-showtimes.dto';
import { CreateShowtimeDto } from './dto/create-showtime.dto';
import { MoviesService } from '../movies/movies.service';
import { RoomsService } from '../rooms/rooms.service';
import { CinemasService } from '../cinemas/cinemas.service';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ShowtimesService {
  constructor(
    @InjectRepository(Showtime)
    private readonly showtimesRepository: Repository<Showtime>,
    private readonly moviesService: MoviesService,
    private readonly roomsService: RoomsService,
    private readonly cinemasService: CinemasService
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

  async create(dto: CreateShowtimeDto, currentUser: User): Promise<Showtime> {
    await this.moviesService.findOne(dto.movieId);
    const room = await this.roomsService.findOne(dto.roomId);

    await this.cinemasService.assertCinemaOwnerOrAdmin(
      room.cinemaId,
      currentUser
    );

    const showtime = this.showtimesRepository.create(dto);
    return this.showtimesRepository.save(showtime);
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
