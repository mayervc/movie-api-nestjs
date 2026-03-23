import {
  BadRequestException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Cinema } from './entities/cinema.entity';
import { CreateCinemaDto } from './dto/create-cinema.dto';
import { UpdateCinemaDto } from './dto/update-cinema.dto';
import { LinkCinemaUserDto } from './dto/link-cinema-user.dto';

@Injectable()
export class CinemasService {
  constructor(
    @InjectRepository(Cinema)
    private readonly cinemasRepository: Repository<Cinema>,
    private readonly dataSource: DataSource
  ) {}

  async findOne(id: number): Promise<Cinema> {
    const cinema = await this.cinemasRepository.findOne({ where: { id } });
    if (!cinema) {
      throw new NotFoundException(`Cinema with ID ${id} not found`);
    }
    return cinema;
  }

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

  /**
   * Search cinemas by optional text across name, address, city, country, phone, country code.
   * Empty / whitespace `q` returns all cinemas (same shape as findAll).
   */
  async search(q: string, page = 1, limit = 10) {
    const pageNum = Number(page);
    const limitNum = Number(limit);

    if (
      !Number.isInteger(pageNum) ||
      !Number.isInteger(limitNum) ||
      pageNum < 1 ||
      limitNum < 1
    ) {
      throw new BadRequestException('Page and limit must be >= 1');
    }

    const skip = (pageNum - 1) * limitNum;
    const trimmed = (q ?? '').trim();

    const queryBuilder =
      this.cinemasRepository.createQueryBuilder('cinema');

    if (trimmed) {
      queryBuilder.where(
        `(
          cinema.name ILIKE :q OR
          cinema.address ILIKE :q OR
          cinema.city ILIKE :q OR
          cinema.country ILIKE :q OR
          cinema.phoneNumber ILIKE :q OR
          cinema.countryCode ILIKE :q
        )`,
        { q: `%${trimmed}%` }
      );
    }

    queryBuilder
      .orderBy('cinema.createdAt', 'DESC')
      .skip(skip)
      .take(limitNum);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
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

  async update(id: number, updateCinemaDto: UpdateCinemaDto): Promise<Cinema> {
    if (Object.keys(updateCinemaDto).length === 0) {
      throw new BadRequestException('Request body cannot be empty');
    }

    const cinema = await this.findOne(id);

    // Merge only provided fields (undefined means "do not change")
    const updates = Object.fromEntries(
      Object.entries(updateCinemaDto).filter(([, v]) => v !== undefined)
    );
    Object.assign(cinema, updates);

    try {
      return await this.cinemasRepository.save(cinema);
    } catch (error) {
      if (error?.code === '23505') {
        throw new BadRequestException('Cinema name must be unique');
      }
      throw error;
    }
  }

  async linkUserToCinema(
    cinemaId: number,
    linkCinemaUserDto: LinkCinemaUserDto
  ): Promise<{ cinemaId: number; userId: number }> {
    await this.findOne(cinemaId); // ensure cinema exists

    const userRows: Array<{ id: number }> = await this.dataSource.query(
      `SELECT id FROM "users" WHERE id = $1`,
      [linkCinemaUserDto.userId]
    );

    if (!userRows?.length) {
      throw new NotFoundException(
        `User with ID ${linkCinemaUserDto.userId} not found`
      );
    }

    try {
      const result: Array<{
        cinemaId: number;
        userId: number;
      }> = await this.dataSource.query(
        `
          INSERT INTO "cinema_users" ("cinema_id", "user_id")
          VALUES ($1, $2)
          RETURNING "cinema_id" as "cinemaId", "user_id" as "userId"
        `,
        [cinemaId, linkCinemaUserDto.userId]
      );

      const row = result?.[0];
      return {
        cinemaId: row?.cinemaId ?? cinemaId,
        userId: row?.userId ?? linkCinemaUserDto.userId
      };
    } catch (error) {
      const err = error as { code?: string };
      // PostgreSQL unique constraint violation (cinema_id + user_id)
      if (err?.code === '23505') {
        throw new BadRequestException('User is already linked to this cinema');
      }
      throw error;
    }
  }
}

