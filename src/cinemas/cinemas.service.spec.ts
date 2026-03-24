import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { CinemasService } from './cinemas.service';
import { Cinema } from './entities/cinema.entity';
import { CinemaUser } from './entities/cinema-user.entity';
import { UpdateCinemaDto } from './dto/update-cinema.dto';
import { LinkCinemaUserDto } from './dto/link-cinema-user.dto';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/enums/user-role.enum';

describe('CinemasService (unit)', () => {
  let service: CinemasService;

  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn()
  };

  const cinema1: Cinema = {
    id: 1,
    name: 'Cinema One',
    address: 'Old address',
    city: null,
    country: null,
    phoneNumber: null,
    countryCode: null,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockRepository: {
    findOne: jest.Mock;
    save: jest.Mock;
    createQueryBuilder: jest.Mock;
    delete: jest.Mock;
  } = {
    findOne: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    delete: jest.fn()
  };

  const mockCinemaUserRepository: { findOne: jest.Mock } = {
    findOne: jest.fn()
  };

  const mockDataSource: { query: jest.Mock } = {
    query: jest.fn()
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CinemasService,
        {
          provide: getRepositoryToken(Cinema),
          useValue: mockRepository as Partial<Repository<Cinema>>
        },
        {
          provide: getRepositoryToken(CinemaUser),
          useValue: mockCinemaUserRepository as Partial<Repository<CinemaUser>>
        },
        {
          provide: DataSource,
          useValue: mockDataSource
        }
      ]
    }).compile();

    service = module.get<CinemasService>(CinemasService);
  });

  describe('findOne', () => {
    it('should return cinema when it exists', async () => {
      mockRepository.findOne.mockResolvedValue(cinema1);

      await expect(service.findOne(1)).resolves.toEqual(cinema1);
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should throw NotFoundException when cinema does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(123)).rejects.toBeInstanceOf(
        NotFoundException
      );
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 123 }
      });
    });
  });

  describe('search', () => {
    it('should return all cinemas paginated when q is empty/whitespace', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[{ id: 1 }], 1]);

      const result = await service.search('   ', 1, 10);

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('cinema');
      expect(mockQueryBuilder.where).not.toHaveBeenCalled();
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
      expect(result).toEqual({
        data: [{ id: 1 }],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1
      });
    });

    it('should apply ILIKE filter when q has value', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[{ id: 2 }], 1]);

      const result = await service.search('Plaza', 2, 5);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        expect.stringContaining('cinema.name ILIKE'),
        { q: '%Plaza%' }
      );
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(5);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(5);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(5);
      expect(result.totalPages).toBe(1);
    });

    it('should throw BadRequestException when page is < 1', async () => {
      await expect(
        service.search('x', 0 as unknown as number, 10)
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when page is not a number', async () => {
      await expect(
        service.search('x', 'abc' as unknown as number, 10)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('should throw BadRequestException when body is empty', async () => {
      const dto = {} as UpdateCinemaDto;
      await expect(service.update(1, dto)).rejects.toBeInstanceOf(
        BadRequestException
      );
    });

    it('should update only provided fields', async () => {
      const dto: UpdateCinemaDto = { address: 'New address' };

      mockRepository.findOne.mockResolvedValue({ ...cinema1 });
      mockRepository.save.mockResolvedValue({
        ...cinema1,
        address: 'New address'
      });

      const res = await service.update(1, dto);

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
      expect(res.address).toBe('New address');
    });

    it('should throw BadRequestException on unique name constraint violation', async () => {
      const dto: UpdateCinemaDto = { name: 'Duplicate name' };

      mockRepository.findOne.mockResolvedValue({ ...cinema1 });
      mockRepository.save.mockRejectedValue({ code: '23505' });

      await expect(service.update(1, dto)).rejects.toThrow(
        'Cinema name must be unique'
      );
    });

    it('should throw NotFoundException when cinema does not exist', async () => {
      const dto: UpdateCinemaDto = { address: 'New address' };

      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.update(999, dto)).rejects.toBeInstanceOf(
        NotFoundException
      );
    });
  });

  describe('linkUserToCinema', () => {
    const cinemaId = 10;
    const userId = 20;

    const cinema: Cinema = {
      id: cinemaId,
      name: 'Cinema Link',
      address: null,
      city: null,
      country: null,
      phoneNumber: null,
      countryCode: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should throw NotFoundException when cinema does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const dto: LinkCinemaUserDto = { userId };

      await expect(
        service.linkUserToCinema(cinemaId, dto)
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: cinemaId }
      });
      expect(mockDataSource.query).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(cinema);
      mockDataSource.query.mockResolvedValueOnce([]);

      const dto: LinkCinemaUserDto = { userId };

      await expect(
        service.linkUserToCinema(cinemaId, dto)
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(mockDataSource.query).toHaveBeenCalledTimes(1);
    });

    it('should create cinema-user link when user and cinema exist', async () => {
      mockRepository.findOne.mockResolvedValue(cinema);
      mockDataSource.query.mockResolvedValueOnce([{ id: userId }]);
      mockDataSource.query.mockResolvedValueOnce([{ cinemaId, userId }]);

      const dto: LinkCinemaUserDto = { userId };

      const res = await service.linkUserToCinema(cinemaId, dto);

      expect(res).toEqual({ cinemaId, userId });
    });

    it('should throw BadRequestException when user already linked to cinema', async () => {
      mockRepository.findOne.mockResolvedValue(cinema);
      mockDataSource.query.mockResolvedValueOnce([{ id: userId }]);
      mockDataSource.query.mockRejectedValueOnce({ code: '23505' });

      const dto: LinkCinemaUserDto = { userId };

      await expect(service.linkUserToCinema(cinemaId, dto)).rejects.toThrow(
        'User is already linked to this cinema'
      );
    });
  });

  describe('deleteCinema', () => {
    const cinemaId = 1;

    const adminUser: User = {
      id: 10,
      email: 'admin@test.com',
      password: 'password',
      role: UserRole.ADMIN,
      firstName: null,
      lastName: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const regularUser: User = {
      id: 11,
      email: 'user@test.com',
      password: 'password',
      role: UserRole.USER,
      firstName: null,
      lastName: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should throw NotFoundException when cinema does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.deleteCinema(cinemaId, adminUser)
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should delete cinema when called by ADMIN', async () => {
      mockRepository.findOne.mockResolvedValue(cinema1);
      mockRepository.delete.mockResolvedValue({} as never);

      await expect(
        service.deleteCinema(cinemaId, adminUser)
      ).resolves.toBeUndefined();

      expect(mockCinemaUserRepository.findOne).not.toHaveBeenCalled();
      expect(mockRepository.delete).toHaveBeenCalledWith(cinemaId);
    });

    it('should throw ForbiddenException when called by non-owner non-ADMIN', async () => {
      mockRepository.findOne.mockResolvedValue(cinema1);
      mockCinemaUserRepository.findOne.mockResolvedValue(null);

      await expect(
        service.deleteCinema(cinemaId, regularUser)
      ).rejects.toBeInstanceOf(ForbiddenException);

      expect(mockRepository.delete).not.toHaveBeenCalled();
    });

    it('should delete cinema when called by owner (linked user)', async () => {
      mockRepository.findOne.mockResolvedValue(cinema1);
      mockCinemaUserRepository.findOne.mockResolvedValue({
        id: 1,
        cinemaId,
        userId: regularUser.id,
        createdAt: new Date()
      } as CinemaUser);
      mockRepository.delete.mockResolvedValue({} as never);

      await expect(
        service.deleteCinema(cinemaId, regularUser)
      ).resolves.toBeUndefined();

      expect(mockRepository.delete).toHaveBeenCalledWith(cinemaId);
    });
  });
});
