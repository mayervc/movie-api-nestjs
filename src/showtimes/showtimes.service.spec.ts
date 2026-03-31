import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { ShowtimesService } from './showtimes.service';
import { Showtime } from './entities/showtime.entity';

const mockShowtime: Showtime = {
  id: 1,
  movieId: 1,
  roomId: 1,
  startTime: new Date('2026-04-01T20:00:00Z'),
  ticketPrice: 9.99,
  createdAt: new Date(),
  updatedAt: new Date(),
  movie: null as never,
  room: null as never
};

const mockQueryBuilder = {
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  getMany: jest.fn()
};

const mockShowtimesRepository = {
  findOne: jest.fn(),
  createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder)
};

describe('ShowtimesService', () => {
  let service: ShowtimesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShowtimesService,
        {
          provide: getRepositoryToken(Showtime),
          useValue: mockShowtimesRepository
        }
      ]
    }).compile();

    service = module.get<ShowtimesService>(ShowtimesService);
    jest.clearAllMocks();
    mockShowtimesRepository.createQueryBuilder.mockReturnValue(
      mockQueryBuilder
    );
  });

  describe('findOne', () => {
    it('should return a showtime when found', async () => {
      mockShowtimesRepository.findOne.mockResolvedValue(mockShowtime);
      const result = await service.findOne(1);
      expect(result).toEqual(mockShowtime);
      expect(mockShowtimesRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['movie', 'room']
      });
    });

    it('should throw NotFoundException when showtime does not exist', async () => {
      mockShowtimesRepository.findOne.mockResolvedValue(null);
      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('search', () => {
    it('should return all showtimes when no filters are provided', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([mockShowtime]);
      const result = await service.search({});
      expect(result).toEqual([mockShowtime]);
      expect(mockQueryBuilder.andWhere).not.toHaveBeenCalled();
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'showtime.startTime',
        'ASC'
      );
    });

    it('should apply movieId filter when provided', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([mockShowtime]);
      await service.search({ movieId: 1 });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'showtime.movieId = :movieId',
        { movieId: 1 }
      );
    });

    it('should apply roomId filter when provided', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([mockShowtime]);
      await service.search({ roomId: 1 });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'showtime.roomId = :roomId',
        { roomId: 1 }
      );
    });

    it('should apply dateFrom filter when provided', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([mockShowtime]);
      await service.search({ dateFrom: '2026-04-01T00:00:00Z' });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'showtime.startTime >= :dateFrom',
        { dateFrom: '2026-04-01T00:00:00Z' }
      );
    });

    it('should apply dateTo filter when provided', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([mockShowtime]);
      await service.search({ dateTo: '2026-04-30T23:59:59Z' });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'showtime.startTime <= :dateTo',
        { dateTo: '2026-04-30T23:59:59Z' }
      );
    });

    it('should apply all filters when all are provided', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([mockShowtime]);
      await service.search({
        movieId: 1,
        roomId: 1,
        dateFrom: '2026-04-01T00:00:00Z',
        dateTo: '2026-04-30T23:59:59Z'
      });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledTimes(4);
    });

    it('should return empty array when no showtimes match', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([]);
      const result = await service.search({ movieId: 99999 });
      expect(result).toEqual([]);
    });
  });
});
