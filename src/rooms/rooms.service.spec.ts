import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException
} from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { Room } from './entities/room.entity';
import { CinemaUser } from '../cinemas/entities/cinema-user.entity';
import { UserRole } from '../users/enums/user-role.enum';
import { User } from '../users/entities/user.entity';

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

  const mockRoomsRepository: { findOne: jest.Mock; save: jest.Mock } = {
    findOne: jest.fn(),
    save: jest.fn()
  };

  const mockCinemaUsersRepository: { findOne: jest.Mock } = {
    findOne: jest.fn()
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomsService,
        {
          provide: getRepositoryToken(Room),
          useValue: mockRoomsRepository
        },
        {
          provide: getRepositoryToken(CinemaUser),
          useValue: mockCinemaUsersRepository
        }
      ]
    }).compile();

    service = module.get<RoomsService>(RoomsService);
    jest.clearAllMocks();
  });

  describe('findOne', () => {
    it('should return the room when it exists', async () => {
      mockRoomsRepository.findOne.mockResolvedValue(mockRoom);

      const result = await service.findOne(1);

      expect(result).toEqual(mockRoom);
      expect(mockRoomsRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 }
      });
    });

    it('should throw NotFoundException when room does not exist', async () => {
      mockRoomsRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(99)).rejects.toThrow(
        new NotFoundException('Room with ID 99 not found')
      );
    });
  });

  describe('update', () => {
    const adminUser = { id: 1, role: UserRole.ADMIN } as User;
    const ownerUser = { id: 2, role: UserRole.VENDOR } as User;
    const otherUser = { id: 3, role: UserRole.USER } as User;

    it('should update and return the room when called by ADMIN', async () => {
      const updated = { ...mockRoom, name: 'Sala VIP' };
      mockRoomsRepository.findOne.mockResolvedValue({ ...mockRoom });
      mockRoomsRepository.save.mockResolvedValue(updated);

      const result = await service.update(1, { name: 'Sala VIP' }, adminUser);

      expect(result.name).toBe('Sala VIP');
      expect(mockCinemaUsersRepository.findOne).not.toHaveBeenCalled();
    });

    it('should update and return the room when called by cinema owner', async () => {
      const updated = { ...mockRoom, name: 'Sala VIP' };
      mockRoomsRepository.findOne.mockResolvedValue({ ...mockRoom });
      mockCinemaUsersRepository.findOne.mockResolvedValue({
        id: 5,
        cinemaId: 10,
        userId: 2
      });
      mockRoomsRepository.save.mockResolvedValue(updated);

      const result = await service.update(1, { name: 'Sala VIP' }, ownerUser);

      expect(result.name).toBe('Sala VIP');
      expect(mockCinemaUsersRepository.findOne).toHaveBeenCalledWith({
        where: { cinemaId: mockRoom.cinemaId, userId: ownerUser.id }
      });
    });

    it('should throw ForbiddenException when user is not owner nor ADMIN', async () => {
      mockRoomsRepository.findOne.mockResolvedValue({ ...mockRoom });
      mockCinemaUsersRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update(1, { name: 'Sala VIP' }, otherUser)
      ).rejects.toThrow(
        new ForbiddenException('Not allowed to update this room')
      );
    });

    it('should throw NotFoundException when room does not exist', async () => {
      mockRoomsRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update(99, { name: 'Sala VIP' }, adminUser)
      ).rejects.toThrow(new NotFoundException('Room with ID 99 not found'));
    });

    it('should throw BadRequestException when body is empty', async () => {
      await expect(service.update(1, {}, adminUser)).rejects.toThrow(
        new BadRequestException('Request body cannot be empty')
      );
      expect(mockRoomsRepository.findOne).not.toHaveBeenCalled();
    });
  });
});
