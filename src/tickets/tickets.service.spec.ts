import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { ShowtimeTicket } from './entities/showtime-ticket.entity';
import { ShowtimesService } from '../showtimes/showtimes.service';
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
  find: jest.fn()
};

const mockShowtimesService = {
  findOne: jest.fn()
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
          provide: ShowtimesService,
          useValue: mockShowtimesService
        }
      ]
    }).compile();

    service = module.get<TicketsService>(TicketsService);
    jest.clearAllMocks();
  });

  describe('findByShowtime', () => {
    it('should return tickets for the authenticated user', async () => {
      mockShowtimesService.findOne.mockResolvedValue({ id: 1 });
      mockTicketsRepository.find.mockResolvedValue([mockTicket]);

      const result = await service.findByShowtime(1, 1);

      expect(result).toEqual([mockTicket]);
      expect(mockShowtimesService.findOne).toHaveBeenCalledWith(1);
      expect(mockTicketsRepository.find).toHaveBeenCalledWith({
        where: { showtimeId: 1, userId: 1 },
        relations: ['roomSeat']
      });
    });

    it('should return empty array when user has no tickets for the showtime', async () => {
      mockShowtimesService.findOne.mockResolvedValue({ id: 1 });
      mockTicketsRepository.find.mockResolvedValue([]);

      const result = await service.findByShowtime(1, 1);

      expect(result).toEqual([]);
    });

    it('should throw NotFoundException when showtime does not exist', async () => {
      mockShowtimesService.findOne.mockRejectedValue(new NotFoundException());

      await expect(service.findByShowtime(99, 1)).rejects.toThrow(
        NotFoundException
      );
      expect(mockTicketsRepository.find).not.toHaveBeenCalled();
    });
  });
});
