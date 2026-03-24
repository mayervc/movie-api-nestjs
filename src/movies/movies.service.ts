import {
  Injectable,
  NotFoundException,
  BadRequestException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Movie } from './entities/movie.entity';
import { Cast } from '../cast/entities/cast.entity';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { SearchMovieDto } from './dto/search-movie.dto';
import { AddCastDto } from './dto/add-cast.dto';
import { BulkRemoveCastDto } from './dto/bulk-remove-cast.dto';
import * as PDFDocument from 'pdfkit';

@Injectable()
export class MoviesService {
  constructor(
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
    @InjectRepository(Cast)
    private readonly castRepository: Repository<Cast>
  ) {}

  async create(createMovieDto: CreateMovieDto): Promise<Movie> {
    try {
      const movie = this.movieRepository.create({
        ...createMovieDto,
        releaseDate: new Date(createMovieDto.releaseDate)
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
      order: { createdAt: 'DESC' }
    });
  }

  async findOne(id: number): Promise<Movie> {
    const movie = await this.movieRepository.findOne({
      where: { id },
      relations: { cast: true }
    });
    if (!movie) {
      throw new NotFoundException(`Movie with ID ${id} not found`);
    }
    return movie;
  }

  async update(id: number, updateMovieDto: UpdateMovieDto): Promise<Movie> {
    await this.findOne(id);

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
        { query: `%${query}%` }
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
      totalPages: Math.ceil(total / limit)
    };
  }

  async findTrending(page: number = 1, limit: number = 10) {
    if (page < 1) {
      throw new BadRequestException('Page must be greater than or equal to 1');
    }
    if (limit < 1) {
      throw new BadRequestException('Limit must be greater than or equal to 1');
    }

    const skip = (page - 1) * limit;
    const queryBuilder = this.movieRepository.createQueryBuilder('movie');
    queryBuilder.where('movie.trending = :trending', { trending: true });
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
      totalPages: Math.ceil(total / limit)
    };
  }

  async findTopRated(page: number = 1, limit: number = 10) {
    if (page < 1) {
      throw new BadRequestException('Page must be greater than or equal to 1');
    }
    if (limit < 1) {
      throw new BadRequestException('Limit must be greater than or equal to 1');
    }

    const skip = (page - 1) * limit;
    const [movies, total] = await this.movieRepository
      .createQueryBuilder('movie')
      .orderBy('movie.rating', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data: movies,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async addToCast(movieId: number, dto: AddCastDto): Promise<Cast> {
    await this.findOne(movieId);

    const existing = await this.castRepository.findOne({
      where: { movieId, actorId: dto.actorId }
    });
    if (existing) {
      throw new BadRequestException(
        'Actor is already in the cast of this movie'
      );
    }

    const cast = this.castRepository.create({
      movieId,
      actorId: dto.actorId,
      role: dto.role,
      characters: dto.characters
    });
    return this.castRepository.save(cast);
  }

  async removeFromCast(movieId: number, actorId: number): Promise<void> {
    await this.findOne(movieId);

    const cast = await this.castRepository.findOne({
      where: { movieId, actorId }
    });
    if (!cast) {
      throw new NotFoundException('Actor is not in the cast of this movie');
    }
    await this.castRepository.remove(cast);
  }

  async bulkRemoveFromCast(
    movieId: number,
    dto: BulkRemoveCastDto
  ): Promise<void> {
    await this.findOne(movieId);
    await this.castRepository.delete({ movieId, actorId: In(dto.actorIds) });
  }

  async generateTrendingPdf(): Promise<Buffer> {
    const { data: movies } = await this.findTrending(1, 100);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc
        .fontSize(24)
        .font('Helvetica-Bold')
        .text('Trending Movies', { align: 'center' });
      doc.moveDown(0.5);
      doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor('#666666')
        .text(
          `Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
          { align: 'center' }
        );
      doc.fillColor('#000000');
      doc.moveDown(1);

      // Divider
      doc
        .moveTo(50, doc.y)
        .lineTo(545, doc.y)
        .strokeColor('#cccccc')
        .lineWidth(1)
        .stroke();
      doc.moveDown(1);

      if (movies.length === 0) {
        doc.fontSize(12).text('No trending movies found.', { align: 'center' });
      } else {
        movies.forEach((movie, index) => {
          // Movie number + title
          doc
            .fontSize(13)
            .font('Helvetica-Bold')
            .fillColor('#1a1a1a')
            .text(`${index + 1}. ${movie.title}`);

          // Genres
          if (movie.genres?.length) {
            doc
              .fontSize(9)
              .font('Helvetica')
              .fillColor('#555555')
              .text(movie.genres.join(' · '));
          }

          // Meta row: rating, duration, release date
          const meta: string[] = [];
          if (movie.rating) meta.push(`Rating: ${movie.rating}/10`);
          if (movie.duration) meta.push(`Duration: ${movie.duration} min`);
          if (movie.releaseDate) {
            const date = new Date(movie.releaseDate);
            meta.push(`Released: ${date.getFullYear()}`);
          }
          if (meta.length) {
            doc
              .fontSize(9)
              .font('Helvetica')
              .fillColor('#333333')
              .text(meta.join('   |   '));
          }

          // Description
          if (movie.description) {
            doc
              .moveDown(0.3)
              .fontSize(9)
              .font('Helvetica')
              .fillColor('#444444')
              .text(movie.description, { width: 495 });
          }

          doc.fillColor('#000000');
          doc.moveDown(0.8);

          // Separator between movies (skip last)
          if (index < movies.length - 1) {
            doc
              .moveTo(50, doc.y)
              .lineTo(545, doc.y)
              .strokeColor('#eeeeee')
              .lineWidth(0.5)
              .stroke();
            doc.moveDown(0.8);
          }

          // Page break safety
          if (doc.y > 700 && index < movies.length - 1) {
            doc.addPage();
          }
        });
      }

      doc.end();
    });
  }
}
