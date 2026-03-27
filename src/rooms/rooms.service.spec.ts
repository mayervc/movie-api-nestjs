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
import { RoomSeat } from './entities/room-seat.entity';
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

  const mockRoomBlocksRepository: {
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
    delete: jest.Mock;
  } = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn()
  };

  const mockRoomSeatsRepository: {
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
  } = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn()
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
          provide: getRepositoryToken(RoomSeat),
          useValue: mockRoomSeatsRepository
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

  describe('findOneBlock', () => {
    const mockBlock = {
      id: 1,
      rowSeats: 5,
      columnsSeats: 8,
      blockRow: 1,
      blockColumn: 1,
      roomId: 1
    } as RoomBlock;

    it('should return the block when it exists', async () => {
      mockRoomBlocksRepository.findOne.mockResolvedValue(mockBlock);

      const result = await service.findOneBlock(1);

      expect(result).toEqual(mockBlock);
      expect(mockRoomBlocksRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 }
      });
    });

    it('should throw NotFoundException when block does not exist', async () => {
      mockRoomBlocksRepository.findOne.mockResolvedValue(null);

      await expect(service.findOneBlock(99)).rejects.toThrow(
        new NotFoundException('RoomBlock with ID 99 not found')
      );
    });
  });

  describe('updateBlock', () => {
    const adminUser = { id: 1, role: UserRole.ADMIN } as User;
    const ownerUser = { id: 2, role: UserRole.VENDOR } as User;
    const otherUser = { id: 3, role: UserRole.USER } as User;
    const mockBlock = {
      id: 1,
      rowSeats: 5,
      columnsSeats: 8,
      blockRow: 1,
      blockColumn: 1,
      roomId: 1
    } as RoomBlock;

    it('should update and return the block when called by ADMIN', async () => {
      const updated = { ...mockBlock, rowSeats: 10 };
      mockRoomBlocksRepository.findOne.mockResolvedValue({ ...mockBlock });
      mockRoomsRepository.findOne.mockResolvedValue(mockRoom);
      mockCinemasService.assertCinemaOwnerOrAdmin.mockResolvedValue(undefined);
      mockRoomBlocksRepository.save.mockResolvedValue(updated);

      const result = await service.updateBlock(1, { rowSeats: 10 }, adminUser);

      expect(result.rowSeats).toBe(10);
      expect(mockCinemasService.assertCinemaOwnerOrAdmin).toHaveBeenCalledWith(
        mockRoom.cinemaId,
        adminUser
      );
    });

    it('should update and return the block when called by cinema owner', async () => {
      const updated = { ...mockBlock, rowSeats: 10 };
      mockRoomBlocksRepository.findOne.mockResolvedValue({ ...mockBlock });
      mockRoomsRepository.findOne.mockResolvedValue(mockRoom);
      mockCinemasService.assertCinemaOwnerOrAdmin.mockResolvedValue(undefined);
      mockRoomBlocksRepository.save.mockResolvedValue(updated);

      const result = await service.updateBlock(1, { rowSeats: 10 }, ownerUser);

      expect(result.rowSeats).toBe(10);
      expect(mockCinemasService.assertCinemaOwnerOrAdmin).toHaveBeenCalledWith(
        mockRoom.cinemaId,
        ownerUser
      );
    });

    it('should throw ForbiddenException when user is not owner nor ADMIN', async () => {
      mockRoomBlocksRepository.findOne.mockResolvedValue({ ...mockBlock });
      mockRoomsRepository.findOne.mockResolvedValue(mockRoom);
      mockCinemasService.assertCinemaOwnerOrAdmin.mockRejectedValue(
        new ForbiddenException(
          'Not allowed to perform this action on this cinema'
        )
      );

      await expect(
        service.updateBlock(1, { rowSeats: 10 }, otherUser)
      ).rejects.toThrow(ForbiddenException);
      expect(mockRoomBlocksRepository.save).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when block does not exist', async () => {
      mockRoomBlocksRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateBlock(99, { rowSeats: 10 }, adminUser)
      ).rejects.toThrow(
        new NotFoundException('RoomBlock with ID 99 not found')
      );
    });

    it('should throw BadRequestException when body is empty', async () => {
      await expect(service.updateBlock(1, {}, adminUser)).rejects.toThrow(
        new BadRequestException('Request body cannot be empty')
      );
      expect(mockRoomBlocksRepository.findOne).not.toHaveBeenCalled();
    });
  });

  describe('deleteBlock', () => {
    const adminUser = { id: 1, role: UserRole.ADMIN } as User;
    const ownerUser = { id: 2, role: UserRole.VENDOR } as User;
    const otherUser = { id: 3, role: UserRole.USER } as User;
    const mockBlock = {
      id: 1,
      rowSeats: 5,
      columnsSeats: 8,
      blockRow: 1,
      blockColumn: 1,
      roomId: 1
    } as RoomBlock;

    it('should delete the block when called by ADMIN', async () => {
      mockRoomBlocksRepository.findOne.mockResolvedValue(mockBlock);
      mockRoomsRepository.findOne.mockResolvedValue(mockRoom);
      mockCinemasService.assertCinemaOwnerOrAdmin.mockResolvedValue(undefined);
      mockRoomBlocksRepository.delete.mockResolvedValue({ affected: 1 });

      await service.deleteBlock(1, adminUser);

      expect(mockRoomBlocksRepository.delete).toHaveBeenCalledWith(1);
      expect(mockCinemasService.assertCinemaOwnerOrAdmin).toHaveBeenCalledWith(
        mockRoom.cinemaId,
        adminUser
      );
    });

    it('should delete the block when called by cinema owner', async () => {
      mockRoomBlocksRepository.findOne.mockResolvedValue(mockBlock);
      mockRoomsRepository.findOne.mockResolvedValue(mockRoom);
      mockCinemasService.assertCinemaOwnerOrAdmin.mockResolvedValue(undefined);
      mockRoomBlocksRepository.delete.mockResolvedValue({ affected: 1 });

      await service.deleteBlock(1, ownerUser);

      expect(mockRoomBlocksRepository.delete).toHaveBeenCalledWith(1);
      expect(mockCinemasService.assertCinemaOwnerOrAdmin).toHaveBeenCalledWith(
        mockRoom.cinemaId,
        ownerUser
      );
    });

    it('should throw ForbiddenException when user is not owner nor ADMIN', async () => {
      mockRoomBlocksRepository.findOne.mockResolvedValue(mockBlock);
      mockRoomsRepository.findOne.mockResolvedValue(mockRoom);
      mockCinemasService.assertCinemaOwnerOrAdmin.mockRejectedValue(
        new ForbiddenException(
          'Not allowed to perform this action on this cinema'
        )
      );

      await expect(service.deleteBlock(1, otherUser)).rejects.toThrow(
        ForbiddenException
      );
      expect(mockRoomBlocksRepository.delete).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when block does not exist', async () => {
      mockRoomBlocksRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteBlock(99, adminUser)).rejects.toThrow(
        new NotFoundException('RoomBlock with ID 99 not found')
      );
    });
  });

  describe('findOneSeat', () => {
    const mockSeat = {
      id: 1,
      seatRowLabel: 'A',
      seatRow: 1,
      seatColumnLabel: 1,
      seatColumn: 1,
      roomId: 1,
      roomBlockId: 1
    } as RoomSeat;

    it('should return the seat when it exists', async () => {
      mockRoomSeatsRepository.findOne.mockResolvedValue(mockSeat);

      const result = await service.findOneSeat(1);

      expect(result).toEqual(mockSeat);
      expect(mockRoomSeatsRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 }
      });
    });

    it('should throw NotFoundException when seat does not exist', async () => {
      mockRoomSeatsRepository.findOne.mockResolvedValue(null);

      await expect(service.findOneSeat(99)).rejects.toThrow(
        new NotFoundException('RoomSeat with ID 99 not found')
      );
    });
  });

  describe('updateSeat', () => {
    const adminUser = { id: 1, role: UserRole.ADMIN } as User;
    const ownerUser = { id: 2, role: UserRole.VENDOR } as User;
    const otherUser = { id: 3, role: UserRole.USER } as User;
    const mockBlock = {
      id: 1,
      rowSeats: 5,
      columnsSeats: 8,
      blockRow: 1,
      blockColumn: 1,
      roomId: 1
    } as RoomBlock;
    const mockSeat = {
      id: 1,
      seatRowLabel: 'A',
      seatRow: 1,
      seatColumnLabel: 1,
      seatColumn: 1,
      roomId: 1,
      roomBlockId: 1
    } as RoomSeat;

    it('should update and return the seat when called by ADMIN', async () => {
      const updated = { ...mockSeat, seatRowLabel: 'B' };
      mockRoomSeatsRepository.findOne.mockResolvedValue({ ...mockSeat });
      mockRoomBlocksRepository.findOne.mockResolvedValue(mockBlock);
      mockRoomsRepository.findOne.mockResolvedValue(mockRoom);
      mockCinemasService.assertCinemaOwnerOrAdmin.mockResolvedValue(undefined);
      mockRoomSeatsRepository.save.mockResolvedValue(updated);

      const result = await service.updateSeat(
        1,
        { seatRowLabel: 'B' },
        adminUser
      );

      expect(result.seatRowLabel).toBe('B');
      expect(mockCinemasService.assertCinemaOwnerOrAdmin).toHaveBeenCalledWith(
        mockRoom.cinemaId,
        adminUser
      );
    });

    it('should update and return the seat when called by cinema owner', async () => {
      const updated = { ...mockSeat, seatRowLabel: 'B' };
      mockRoomSeatsRepository.findOne.mockResolvedValue({ ...mockSeat });
      mockRoomBlocksRepository.findOne.mockResolvedValue(mockBlock);
      mockRoomsRepository.findOne.mockResolvedValue(mockRoom);
      mockCinemasService.assertCinemaOwnerOrAdmin.mockResolvedValue(undefined);
      mockRoomSeatsRepository.save.mockResolvedValue(updated);

      const result = await service.updateSeat(
        1,
        { seatRowLabel: 'B' },
        ownerUser
      );

      expect(result.seatRowLabel).toBe('B');
      expect(mockCinemasService.assertCinemaOwnerOrAdmin).toHaveBeenCalledWith(
        mockRoom.cinemaId,
        ownerUser
      );
    });

    it('should throw ForbiddenException when user is not owner nor ADMIN', async () => {
      mockRoomSeatsRepository.findOne.mockResolvedValue({ ...mockSeat });
      mockRoomBlocksRepository.findOne.mockResolvedValue(mockBlock);
      mockRoomsRepository.findOne.mockResolvedValue(mockRoom);
      mockCinemasService.assertCinemaOwnerOrAdmin.mockRejectedValue(
        new ForbiddenException(
          'Not allowed to perform this action on this cinema'
        )
      );

      await expect(
        service.updateSeat(1, { seatRowLabel: 'B' }, otherUser)
      ).rejects.toThrow(ForbiddenException);
      expect(mockRoomSeatsRepository.save).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when seat does not exist', async () => {
      mockRoomSeatsRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateSeat(99, { seatRowLabel: 'B' }, adminUser)
      ).rejects.toThrow(new NotFoundException('RoomSeat with ID 99 not found'));
    });

    it('should throw BadRequestException when body is empty', async () => {
      await expect(service.updateSeat(1, {}, adminUser)).rejects.toThrow(
        new BadRequestException('Request body cannot be empty')
      );
      expect(mockRoomSeatsRepository.findOne).not.toHaveBeenCalled();
    });
  });

  describe('createSeat', () => {
    const adminUser = { id: 1, role: UserRole.ADMIN } as User;
    const ownerUser = { id: 2, role: UserRole.VENDOR } as User;
    const otherUser = { id: 3, role: UserRole.USER } as User;
    const mockBlock = {
      id: 1,
      rowSeats: 5,
      columnsSeats: 8,
      blockRow: 1,
      blockColumn: 1,
      roomId: 1
    } as RoomBlock;
    const validDto = {
      seatRowLabel: 'A',
      seatRow: 1,
      seatColumnLabel: 1,
      seatColumn: 1,
      roomId: 1
    };
    const mockSeat = { id: 1, ...validDto, roomBlockId: 1 } as RoomSeat;

    it('should create and return the seat when called by ADMIN', async () => {
      mockRoomBlocksRepository.findOne.mockResolvedValue(mockBlock);
      mockRoomsRepository.findOne.mockResolvedValue(mockRoom);
      mockCinemasService.assertCinemaOwnerOrAdmin.mockResolvedValue(undefined);
      mockRoomSeatsRepository.create.mockReturnValue(mockSeat);
      mockRoomSeatsRepository.save.mockResolvedValue(mockSeat);

      const result = await service.createSeat(1, validDto, adminUser);

      expect(result).toEqual(mockSeat);
      expect(mockCinemasService.assertCinemaOwnerOrAdmin).toHaveBeenCalledWith(
        mockRoom.cinemaId,
        adminUser
      );
      expect(mockRoomSeatsRepository.create).toHaveBeenCalledWith({
        ...validDto,
        roomBlockId: 1
      });
    });

    it('should create and return the seat when called by cinema owner', async () => {
      mockRoomBlocksRepository.findOne.mockResolvedValue(mockBlock);
      mockRoomsRepository.findOne.mockResolvedValue(mockRoom);
      mockCinemasService.assertCinemaOwnerOrAdmin.mockResolvedValue(undefined);
      mockRoomSeatsRepository.create.mockReturnValue(mockSeat);
      mockRoomSeatsRepository.save.mockResolvedValue(mockSeat);

      const result = await service.createSeat(1, validDto, ownerUser);

      expect(result).toEqual(mockSeat);
      expect(mockCinemasService.assertCinemaOwnerOrAdmin).toHaveBeenCalledWith(
        mockRoom.cinemaId,
        ownerUser
      );
    });

    it('should throw ForbiddenException when user is not owner nor ADMIN', async () => {
      mockRoomBlocksRepository.findOne.mockResolvedValue(mockBlock);
      mockRoomsRepository.findOne.mockResolvedValue(mockRoom);
      mockCinemasService.assertCinemaOwnerOrAdmin.mockRejectedValue(
        new ForbiddenException(
          'Not allowed to perform this action on this cinema'
        )
      );

      await expect(service.createSeat(1, validDto, otherUser)).rejects.toThrow(
        ForbiddenException
      );
      expect(mockRoomSeatsRepository.save).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when block does not exist', async () => {
      mockRoomBlocksRepository.findOne.mockResolvedValue(null);

      await expect(service.createSeat(99, validDto, adminUser)).rejects.toThrow(
        new NotFoundException('RoomBlock with ID 99 not found')
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
