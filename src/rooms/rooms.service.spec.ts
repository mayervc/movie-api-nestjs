import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException
} from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { Room } from './entities/room.entity';
import { RoomBlock } from './entities/room-block.entity';
import { CinemasService } from '../cinemas/cinemas.service';
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

  const mockRoomsRepository: {
    findOne: jest.Mock;
    save: jest.Mock;
    delete: jest.Mock;
  } = {
    findOne: jest.fn(),
    save: jest.fn(),
    delete: jest.fn()
  };

  const mockRoomBlocksRepository: { create: jest.Mock; save: jest.Mock } = {
    create: jest.fn(),
    save: jest.fn()
  };

  const mockCinemasService: { assertCinemaOwnerOrAdmin: jest.Mock } = {
    assertCinemaOwnerOrAdmin: jest.fn()
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
          provide: getRepositoryToken(RoomBlock),
          useValue: mockRoomBlocksRepository
        },
        {
          provide: CinemasService,
          useValue: mockCinemasService
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
      mockCinemasService.assertCinemaOwnerOrAdmin.mockResolvedValue(undefined);
      mockRoomsRepository.save.mockResolvedValue(updated);

      const result = await service.update(1, { name: 'Sala VIP' }, adminUser);

      expect(result.name).toBe('Sala VIP');
      expect(mockCinemasService.assertCinemaOwnerOrAdmin).toHaveBeenCalledWith(
        mockRoom.cinemaId,
        adminUser
      );
    });

    it('should update and return the room when called by cinema owner', async () => {
      const updated = { ...mockRoom, name: 'Sala VIP' };
      mockRoomsRepository.findOne.mockResolvedValue({ ...mockRoom });
      mockCinemasService.assertCinemaOwnerOrAdmin.mockResolvedValue(undefined);
      mockRoomsRepository.save.mockResolvedValue(updated);

      const result = await service.update(1, { name: 'Sala VIP' }, ownerUser);

      expect(result.name).toBe('Sala VIP');
      expect(mockCinemasService.assertCinemaOwnerOrAdmin).toHaveBeenCalledWith(
        mockRoom.cinemaId,
        ownerUser
      );
    });

    it('should throw ForbiddenException when user is not owner nor ADMIN', async () => {
      mockRoomsRepository.findOne.mockResolvedValue({ ...mockRoom });
      mockCinemasService.assertCinemaOwnerOrAdmin.mockRejectedValue(
        new ForbiddenException(
          'Not allowed to perform this action on this cinema'
        )
      );

      await expect(
        service.update(1, { name: 'Sala VIP' }, otherUser)
      ).rejects.toThrow(ForbiddenException);
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

  describe('delete', () => {
    const adminUser = { id: 1, role: UserRole.ADMIN } as User;
    const ownerUser = { id: 2, role: UserRole.VENDOR } as User;
    const otherUser = { id: 3, role: UserRole.USER } as User;

    it('should delete the room when called by ADMIN', async () => {
      mockRoomsRepository.findOne.mockResolvedValue(mockRoom);
      mockCinemasService.assertCinemaOwnerOrAdmin.mockResolvedValue(undefined);
      mockRoomsRepository.delete.mockResolvedValue({ affected: 1 });

      await service.delete(1, adminUser);

      expect(mockRoomsRepository.delete).toHaveBeenCalledWith(1);
      expect(mockCinemasService.assertCinemaOwnerOrAdmin).toHaveBeenCalledWith(
        mockRoom.cinemaId,
        adminUser
      );
    });

    it('should delete the room when called by cinema owner', async () => {
      mockRoomsRepository.findOne.mockResolvedValue(mockRoom);
      mockCinemasService.assertCinemaOwnerOrAdmin.mockResolvedValue(undefined);
      mockRoomsRepository.delete.mockResolvedValue({ affected: 1 });

      await service.delete(1, ownerUser);

      expect(mockRoomsRepository.delete).toHaveBeenCalledWith(1);
      expect(mockCinemasService.assertCinemaOwnerOrAdmin).toHaveBeenCalledWith(
        mockRoom.cinemaId,
        ownerUser
      );
    });

    it('should throw ForbiddenException when user is not owner nor ADMIN', async () => {
      mockRoomsRepository.findOne.mockResolvedValue(mockRoom);
      mockCinemasService.assertCinemaOwnerOrAdmin.mockRejectedValue(
        new ForbiddenException(
          'Not allowed to perform this action on this cinema'
        )
      );

      await expect(service.delete(1, otherUser)).rejects.toThrow(
        ForbiddenException
      );
      expect(mockRoomsRepository.delete).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when room does not exist', async () => {
      mockRoomsRepository.findOne.mockResolvedValue(null);

      await expect(service.delete(99, adminUser)).rejects.toThrow(
        new NotFoundException('Room with ID 99 not found')
      );
    });
  });

  describe('createBlock', () => {
    const adminUser = { id: 1, role: UserRole.ADMIN } as User;
    const ownerUser = { id: 2, role: UserRole.VENDOR } as User;
    const otherUser = { id: 3, role: UserRole.USER } as User;
    const validDto = {
      rowSeats: 5,
      columnsSeats: 8,
      blockRow: 1,
      blockColumn: 1
    };
    const mockBlock = { id: 1, ...validDto, roomId: 1 } as RoomBlock;

    it('should create and return the block when called by ADMIN', async () => {
      mockRoomsRepository.findOne.mockResolvedValue(mockRoom);
      mockCinemasService.assertCinemaOwnerOrAdmin.mockResolvedValue(undefined);
      mockRoomBlocksRepository.create.mockReturnValue(mockBlock);
      mockRoomBlocksRepository.save.mockResolvedValue(mockBlock);

      const result = await service.createBlock(1, validDto, adminUser);

      expect(result).toEqual(mockBlock);
      expect(mockCinemasService.assertCinemaOwnerOrAdmin).toHaveBeenCalledWith(
        mockRoom.cinemaId,
        adminUser
      );
      expect(mockRoomBlocksRepository.create).toHaveBeenCalledWith({
        ...validDto,
        roomId: 1
      });
    });

    it('should create and return the block when called by cinema owner', async () => {
      mockRoomsRepository.findOne.mockResolvedValue(mockRoom);
      mockCinemasService.assertCinemaOwnerOrAdmin.mockResolvedValue(undefined);
      mockRoomBlocksRepository.create.mockReturnValue(mockBlock);
      mockRoomBlocksRepository.save.mockResolvedValue(mockBlock);

      const result = await service.createBlock(1, validDto, ownerUser);

      expect(result).toEqual(mockBlock);
      expect(mockCinemasService.assertCinemaOwnerOrAdmin).toHaveBeenCalledWith(
        mockRoom.cinemaId,
        ownerUser
      );
    });

    it('should throw ForbiddenException when user is not owner nor ADMIN', async () => {
      mockRoomsRepository.findOne.mockResolvedValue(mockRoom);
      mockCinemasService.assertCinemaOwnerOrAdmin.mockRejectedValue(
        new ForbiddenException(
          'Not allowed to perform this action on this cinema'
        )
      );

      await expect(service.createBlock(1, validDto, otherUser)).rejects.toThrow(
        ForbiddenException
      );
      expect(mockRoomBlocksRepository.save).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when room does not exist', async () => {
      mockRoomsRepository.findOne.mockResolvedValue(null);

      await expect(
        service.createBlock(99, validDto, adminUser)
      ).rejects.toThrow(new NotFoundException('Room with ID 99 not found'));
    });
  });
});
