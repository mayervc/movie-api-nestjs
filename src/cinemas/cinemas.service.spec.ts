import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CinemasService } from './cinemas.service';
import { Cinema } from './entities/cinema.entity';

describe('CinemasService', () => {
  let service: CinemasService;

  const mockRepository = {
    findOne: jest.fn()
  };

  beforeEach(async () => {
    mockRepository.findOne = jest.fn();

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
});

