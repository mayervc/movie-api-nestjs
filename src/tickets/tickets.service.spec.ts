import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { ShowtimeTicket } from './entities/showtime-ticket.entity';
import { Showtime } from '../showtimes/entities/showtime.entity';
import { RoomsService } from '../rooms/rooms.service';
import { TicketStatus } from './enums/ticket-status.enum';

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
});
