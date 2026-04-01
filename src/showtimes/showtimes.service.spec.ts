import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException
} from '@nestjs/common';
import { ShowtimesService } from './showtimes.service';
import { Showtime } from './entities/showtime.entity';
import { MoviesService } from '../movies/movies.service';
import { RoomsService } from '../rooms/rooms.service';
import { CinemasService } from '../cinemas/cinemas.service';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/enums/user-role.enum';

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
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
  createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder)
};

const mockMoviesService = { findOne: jest.fn() };
const mockRoomsService = { findOne: jest.fn() };
const mockCinemasService = { assertCinemaOwnerOrAdmin: jest.fn() };

const mockRoom = { id: 1, cinemaId: 1 };
const mockAdminUser = {
  id: 1,
  role: UserRole.ADMIN
} as User;

describe('ShowtimesService', () => {
  let service: ShowtimesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShowtimesService,
        {
          provide: getRepositoryToken(Showtime),
          useValue: mockShowtimesRepository
        },
        { provide: MoviesService, useValue: mockMoviesService },
        { provide: RoomsService, useValue: mockRoomsService },
        { provide: CinemasService, useValue: mockCinemasService }
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

  describe('create', () => {
    const createDto = {
      movieId: 1,
      roomId: 1,
      startTime: '2026-04-01T20:00:00Z',
      ticketPrice: 9.99
    };

    it('should create and return a showtime when ADMIN', async () => {
      mockMoviesService.findOne.mockResolvedValue({ id: 1 });
      mockRoomsService.findOne.mockResolvedValue(mockRoom);
      mockCinemasService.assertCinemaOwnerOrAdmin.mockResolvedValue(undefined);
      mockShowtimesRepository.create.mockReturnValue(mockShowtime);
      mockShowtimesRepository.save.mockResolvedValue(mockShowtime);

      const result = await service.create(createDto, mockAdminUser);

      expect(result).toEqual(mockShowtime);
      expect(mockMoviesService.findOne).toHaveBeenCalledWith(1);
      expect(mockRoomsService.findOne).toHaveBeenCalledWith(1);
      expect(mockCinemasService.assertCinemaOwnerOrAdmin).toHaveBeenCalledWith(
        1,
        mockAdminUser
      );
    });

    it('should throw NotFoundException when movie does not exist', async () => {
      mockMoviesService.findOne.mockRejectedValue(new NotFoundException());
      await expect(service.create(createDto, mockAdminUser)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw NotFoundException when room does not exist', async () => {
      mockMoviesService.findOne.mockResolvedValue({ id: 1 });
      mockRoomsService.findOne.mockRejectedValue(new NotFoundException());
      await expect(service.create(createDto, mockAdminUser)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw ForbiddenException when user is not ADMIN or cinema owner', async () => {
      mockMoviesService.findOne.mockResolvedValue({ id: 1 });
      mockRoomsService.findOne.mockResolvedValue(mockRoom);
      mockCinemasService.assertCinemaOwnerOrAdmin.mockRejectedValue(
        new ForbiddenException()
      );
      await expect(service.create(createDto, mockAdminUser)).rejects.toThrow(
        ForbiddenException
      );
    });
  });

  describe('update', () => {
    const updateDto = { ticketPrice: 12.5 };

    it('should update and return the showtime when ADMIN', async () => {
      mockShowtimesRepository.findOne.mockResolvedValue(mockShowtime);
      mockRoomsService.findOne.mockResolvedValue(mockRoom);
      mockCinemasService.assertCinemaOwnerOrAdmin.mockResolvedValue(undefined);
      mockShowtimesRepository.save.mockResolvedValue({
        ...mockShowtime,
        ...updateDto
      });

      const result = await service.update(1, updateDto, mockAdminUser);

      expect(result.ticketPrice).toBe(12.5);
      expect(mockRoomsService.findOne).toHaveBeenCalledWith(
        mockShowtime.roomId
      );
      expect(mockCinemasService.assertCinemaOwnerOrAdmin).toHaveBeenCalledWith(
        mockRoom.cinemaId,
        mockAdminUser
      );
    });

    it('should throw BadRequestException when body is empty', async () => {
      await expect(service.update(1, {}, mockAdminUser)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw NotFoundException when showtime does not exist', async () => {
      mockShowtimesRepository.findOne.mockResolvedValue(null);
      await expect(
        service.update(99, updateDto, mockAdminUser)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user is not ADMIN or cinema owner', async () => {
      mockShowtimesRepository.findOne.mockResolvedValue(mockShowtime);
      mockRoomsService.findOne.mockResolvedValue(mockRoom);
      mockCinemasService.assertCinemaOwnerOrAdmin.mockRejectedValue(
        new ForbiddenException()
      );
      await expect(service.update(1, updateDto, mockAdminUser)).rejects.toThrow(
        ForbiddenException
      );
    });

    it('should throw NotFoundException when new movieId does not exist', async () => {
      mockShowtimesRepository.findOne.mockResolvedValue(mockShowtime);
      mockMoviesService.findOne.mockRejectedValue(new NotFoundException());
      await expect(
        service.update(1, { movieId: 99 }, mockAdminUser)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when new roomId does not exist', async () => {
      mockShowtimesRepository.findOne.mockResolvedValue(mockShowtime);
      mockRoomsService.findOne.mockRejectedValue(new NotFoundException());
      await expect(
        service.update(1, { roomId: 99 }, mockAdminUser)
      ).rejects.toThrow(NotFoundException);
    });

    it('should use new roomId for ownership check when roomId changes', async () => {
      const newRoom = { id: 2, cinemaId: 2 };
      mockShowtimesRepository.findOne.mockResolvedValue(mockShowtime);
      mockRoomsService.findOne.mockResolvedValue(newRoom);
      mockCinemasService.assertCinemaOwnerOrAdmin.mockResolvedValue(undefined);
      mockShowtimesRepository.save.mockResolvedValue({
        ...mockShowtime,
        roomId: 2
      });

      await service.update(1, { roomId: 2 }, mockAdminUser);

      expect(mockRoomsService.findOne).toHaveBeenCalledWith(2);
      expect(mockCinemasService.assertCinemaOwnerOrAdmin).toHaveBeenCalledWith(
        newRoom.cinemaId,
        mockAdminUser
      );
    });
  });

  describe('remove', () => {
    it('should delete the showtime when ADMIN', async () => {
      mockShowtimesRepository.findOne.mockResolvedValue(mockShowtime);
      mockRoomsService.findOne.mockResolvedValue(mockRoom);
      mockCinemasService.assertCinemaOwnerOrAdmin.mockResolvedValue(undefined);
      mockShowtimesRepository.remove.mockResolvedValue(undefined);

      await expect(service.remove(1, mockAdminUser)).resolves.toBeUndefined();

      expect(mockShowtimesRepository.remove).toHaveBeenCalledWith(mockShowtime);
    });

    it('should throw NotFoundException when showtime does not exist', async () => {
      mockShowtimesRepository.findOne.mockResolvedValue(null);
      await expect(service.remove(99, mockAdminUser)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw ForbiddenException when user is not ADMIN or cinema owner', async () => {
      mockShowtimesRepository.findOne.mockResolvedValue(mockShowtime);
      mockRoomsService.findOne.mockResolvedValue(mockRoom);
      mockCinemasService.assertCinemaOwnerOrAdmin.mockRejectedValue(
        new ForbiddenException()
      );
      await expect(service.remove(1, mockAdminUser)).rejects.toThrow(
        ForbiddenException
      );
    });
  });
});
