import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CinemasService } from './cinemas.service';
import { Cinema } from './entities/cinema.entity';

describe('CinemasService', () => {
  let service: CinemasService;

  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn()
  };

  const mockRepository = {
    findOne: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder)
  };

  beforeEach(async () => {
    jest.clearAllMocks();
  

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CinemasService,
        {
          provide: getRepositoryToken(Cinema),
          useValue: mockRepository as Partial<Repository<Cinema>>
        }
      ]
    }).compile();

    service = module.get<CinemasService>(CinemasService);
  });

  describe('findOne', () => {
    it('should return cinema when it exists', async () => {
      const cinema: Cinema = {
        id: 1,
        name: 'Cinema One',
        address: null,
        city: null,
        country: null,
        phoneNumber: null,
        countryCode: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockRepository.findOne.mockResolvedValue(cinema);

      await expect(service.findOne(1)).resolves.toEqual(cinema);
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should throw NotFoundException when cinema does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(123)).rejects.toBeInstanceOf(
        NotFoundException
      );
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: 123 } });
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
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
      await expect(service.search('x', 0 as unknown as number, 10)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw BadRequestException when page is not a number', async () => {
      await expect(
        service.search('x', 'abc' as unknown as number, 10)
      ).rejects.toThrow(BadRequestException);
    });
  });
});
