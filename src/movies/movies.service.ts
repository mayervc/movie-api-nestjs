import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, ILike } from 'typeorm';
import { Movie } from './entities/movie.entity';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { SearchMovieDto } from './dto/search-movie.dto';

@Injectable()
export class MoviesService {
  constructor(
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
  ) {}

  async create(createMovieDto: CreateMovieDto): Promise<Movie> {
    try {
      const movie = this.movieRepository.create({
        ...createMovieDto,
        releaseDate: new Date(createMovieDto.releaseDate),
      });
      return await this.movieRepository.save(movie);
    } catch (error) {
      if (error.code === '23505') {
        // PostgreSQL unique constraint violation
        throw new BadRequestException('Title must be unique');
      }
      throw error;
    }
  }

  async findAll(): Promise<Movie[]> {
    return await this.movieRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Movie> {
    const movie = await this.movieRepository.findOne({ where: { id } });
    if (!movie) {
      throw new NotFoundException(`Movie with ID ${id} not found`);
    }
    return movie;
  }

  async update(id: number, updateMovieDto: UpdateMovieDto): Promise<Movie> {
    const movie = await this.findOne(id);

    if (Object.keys(updateMovieDto).length === 0) {
      throw new BadRequestException('Request body cannot be empty');
    }

    try {
      const updateData: any = { ...updateMovieDto };
      if (updateMovieDto.releaseDate) {
        updateData.releaseDate = new Date(updateMovieDto.releaseDate);
      }

      await this.movieRepository.update(id, updateData);
      return await this.findOne(id);
    } catch (error) {
      if (error.code === '23505') {
        throw new BadRequestException('Title must be unique');
      }
      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    const movie = await this.findOne(id);
    await this.movieRepository.remove(movie);
  }

  async search(searchDto: SearchMovieDto) {
    const { query, page = 1, limit = 10 } = searchDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.movieRepository.createQueryBuilder('movie');

    if (query) {
      queryBuilder.where(
        '(movie.title ILIKE :query OR movie.description ILIKE :query)',
        { query: `%${query}%` },
      );
    }

    const [movies, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .orderBy('movie.createdAt', 'DESC')
      .getManyAndCount();

    return {
      data: movies,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}


