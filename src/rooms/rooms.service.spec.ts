import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { Room } from './entities/room.entity';

describe('RoomsService (unit)', () => {
  let service: RoomsService;

  const mockRoom: Room = {
    id: 1,
    name: 'Sala Estandar',
    rowsBlocks: 2,
    columnsBlocks: 2,
    details: null,
    cinemaId: 10,
    cinema: null,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockRepository: { findOne: jest.Mock } = {
    findOne: jest.fn()
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomsService,
        {
          provide: getRepositoryToken(Room),
          useValue: mockRepository
        }
      ]
    }).compile();

    service = module.get<RoomsService>(RoomsService);
    jest.clearAllMocks();
  });

  describe('findOne', () => {
    it('should return the room when it exists', async () => {
      mockRepository.findOne.mockResolvedValue(mockRoom);

      const result = await service.findOne(1);

      expect(result).toEqual(mockRoom);
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should throw NotFoundException when room does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(99)).rejects.toThrow(
        new NotFoundException('Room with ID 99 not found')
      );
    });
  });
});
