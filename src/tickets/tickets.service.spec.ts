import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException
} from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { ShowtimeTicket } from './entities/showtime-ticket.entity';
import { Showtime } from '../showtimes/entities/showtime.entity';
import { RoomsService } from '../rooms/rooms.service';
import { TicketStatus } from './enums/ticket-status.enum';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/enums/user-role.enum';

const mockTicket: ShowtimeTicket = {
  id: 1,
  userId: 1,
  showtimeId: 1,
  roomSeatId: 1,
  status: TicketStatus.RESERVED,
  createdAt: new Date(),
  updatedAt: new Date(),
  user: null as never,
  showtime: null as never,
  roomSeat: null as never
};

const mockTicketsRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn()
};

const mockShowtimesRepository = {
  findOne: jest.fn()
};

const mockRoomsService = {
  findOneSeat: jest.fn()
};

const mockAdminUser = { id: 1, role: UserRole.ADMIN } as User;
const mockRegularUser = { id: 2, role: UserRole.USER } as User;

describe('TicketsService', () => {
  let service: TicketsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketsService,
        {
          provide: getRepositoryToken(ShowtimeTicket),
          useValue: mockTicketsRepository
        },
        {
          provide: getRepositoryToken(Showtime),
          useValue: mockShowtimesRepository
        },
        {
          provide: RoomsService,
          useValue: mockRoomsService
        }
      ]
    }).compile();

    service = module.get<TicketsService>(TicketsService);
    jest.clearAllMocks();
  });

  describe('findOne', () => {
    it('should return the ticket when the owner requests it', async () => {
      const ownerTicket = { ...mockTicket, userId: mockRegularUser.id };
      mockTicketsRepository.findOne.mockResolvedValue(ownerTicket);

      const result = await service.findOne(1, mockRegularUser);

      expect(result).toEqual(ownerTicket);
    });

    it('should return the ticket when an ADMIN requests it', async () => {
      mockTicketsRepository.findOne.mockResolvedValue(mockTicket);

      const result = await service.findOne(1, mockAdminUser);

      expect(result).toEqual(mockTicket);
    });

    it('should throw NotFoundException when ticket does not exist', async () => {
      mockTicketsRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(99, mockAdminUser)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw ForbiddenException when user is not the owner', async () => {
      mockTicketsRepository.findOne.mockResolvedValue(mockTicket); // userId: 1

      await expect(service.findOne(1, mockRegularUser)).rejects.toThrow(
        ForbiddenException
      );
    });
  });

  describe('findByUser', () => {
    it('should return all tickets for the user', async () => {
      mockTicketsRepository.find.mockResolvedValue([mockTicket]);

      const result = await service.findByUser(1);

      expect(result).toEqual([mockTicket]);
      expect(mockTicketsRepository.find).toHaveBeenCalledWith({
        where: { userId: 1 },
        relations: ['roomSeat', 'showtime']
      });
    });

    it('should return empty array when user has no tickets', async () => {
      mockTicketsRepository.find.mockResolvedValue([]);

      const result = await service.findByUser(1);

      expect(result).toEqual([]);
    });
  });

  describe('findByShowtime', () => {
    it('should return tickets for the authenticated user', async () => {
      mockShowtimesRepository.findOne.mockResolvedValue({ id: 1 });
      mockTicketsRepository.find.mockResolvedValue([mockTicket]);

      const result = await service.findByShowtime(1, 1);

      expect(result).toEqual([mockTicket]);
      expect(mockTicketsRepository.find).toHaveBeenCalledWith({
        where: { showtimeId: 1, userId: 1 },
        relations: ['roomSeat']
      });
    });

    it('should return empty array when user has no tickets for the showtime', async () => {
      mockShowtimesRepository.findOne.mockResolvedValue({ id: 1 });
      mockTicketsRepository.find.mockResolvedValue([]);

      const result = await service.findByShowtime(1, 1);

      expect(result).toEqual([]);
    });

    it('should throw NotFoundException when showtime does not exist', async () => {
      mockShowtimesRepository.findOne.mockResolvedValue(null);

      await expect(service.findByShowtime(99, 1)).rejects.toThrow(
        NotFoundException
      );
      expect(mockTicketsRepository.find).not.toHaveBeenCalled();
    });
  });

  describe('purchase', () => {
    const dto = { showtimeId: 1, roomSeatIds: [1, 2] };

    it('should create and return tickets for valid seats', async () => {
      mockShowtimesRepository.findOne.mockResolvedValue({ id: 1 });
      mockRoomsService.findOneSeat.mockResolvedValue({ id: 1 });
      mockTicketsRepository.findOne.mockResolvedValue(null);
      mockTicketsRepository.create.mockImplementation((data) => data);
      mockTicketsRepository.save.mockResolvedValue([
        { ...mockTicket, roomSeatId: 1 },
        { ...mockTicket, roomSeatId: 2 }
      ]);

      const result = await service.purchase(dto, 1);

      expect(result).toHaveLength(2);
      expect(mockRoomsService.findOneSeat).toHaveBeenCalledTimes(2);
      expect(mockTicketsRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when showtime does not exist', async () => {
      mockShowtimesRepository.findOne.mockResolvedValue(null);

      await expect(service.purchase(dto, 1)).rejects.toThrow(NotFoundException);
      expect(mockRoomsService.findOneSeat).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when seat does not exist', async () => {
      mockShowtimesRepository.findOne.mockResolvedValue({ id: 1 });
      mockRoomsService.findOneSeat.mockRejectedValue(new NotFoundException());

      await expect(service.purchase(dto, 1)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when seat is already taken', async () => {
      mockShowtimesRepository.findOne.mockResolvedValue({ id: 1 });
      mockRoomsService.findOneSeat.mockResolvedValue({ id: 1 });
      mockTicketsRepository.findOne.mockResolvedValue({
        ...mockTicket,
        status: TicketStatus.RESERVED
      });

      await expect(service.purchase(dto, 1)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should allow purchase when existing ticket is cancelled', async () => {
      mockShowtimesRepository.findOne.mockResolvedValue({ id: 1 });
      mockRoomsService.findOneSeat.mockResolvedValue({ id: 1 });
      mockTicketsRepository.findOne.mockResolvedValue({
        ...mockTicket,
        status: TicketStatus.CANCELLED
      });
      mockTicketsRepository.create.mockImplementation((data) => data);
      mockTicketsRepository.save.mockResolvedValue([
        { ...mockTicket, roomSeatId: 1 },
        { ...mockTicket, roomSeatId: 2 }
      ]);

      const result = await service.purchase(dto, 1);

      expect(result).toHaveLength(2);
    });
  });

  describe('cancel', () => {
    const futureShowtime = { startTime: new Date(Date.now() + 86400000) };
    const pastShowtime = { startTime: new Date(Date.now() - 86400000) };

    it('should cancel the ticket when the owner requests it', async () => {
      const ownerTicket = {
        ...mockTicket,
        userId: mockRegularUser.id,
        showtime: futureShowtime
      };
      mockTicketsRepository.findOne.mockResolvedValue(ownerTicket);
      mockTicketsRepository.save.mockResolvedValue({
        ...ownerTicket,
        status: TicketStatus.CANCELLED
      });

      await service.cancel(1, mockRegularUser);

      expect(mockTicketsRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: TicketStatus.CANCELLED })
      );
    });

    it('should cancel the ticket when an ADMIN requests it', async () => {
      const ticketWithShowtime = { ...mockTicket, showtime: futureShowtime };
      mockTicketsRepository.findOne.mockResolvedValue(ticketWithShowtime);
      mockTicketsRepository.save.mockResolvedValue({
        ...ticketWithShowtime,
        status: TicketStatus.CANCELLED
      });

      await service.cancel(1, mockAdminUser);

      expect(mockTicketsRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: TicketStatus.CANCELLED })
      );
    });

    it('should throw NotFoundException when ticket does not exist', async () => {
      mockTicketsRepository.findOne.mockResolvedValue(null);

      await expect(service.cancel(99, mockRegularUser)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw ForbiddenException when user is not the owner', async () => {
      mockTicketsRepository.findOne.mockResolvedValue({
        ...mockTicket,
        showtime: futureShowtime
      }); // userId: 1, mockRegularUser.id: 2

      await expect(service.cancel(1, mockRegularUser)).rejects.toThrow(
        ForbiddenException
      );
    });

    it('should throw BadRequestException when showtime has already started', async () => {
      const ownerTicket = {
        ...mockTicket,
        userId: mockRegularUser.id,
        showtime: pastShowtime
      };
      mockTicketsRepository.findOne.mockResolvedValue(ownerTicket);

      await expect(service.cancel(1, mockRegularUser)).rejects.toThrow(
        BadRequestException
      );
    });
  });
});
