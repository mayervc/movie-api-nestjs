import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { Order } from './entities/order.entity';
import { Showtime } from '../showtimes/entities/showtime.entity';
import { StripeService } from '../stripe/stripe.service';
import { OrderStatus } from './enums/order-status.enum';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/enums/user-role.enum';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';

const TICKET_PRICE = 9.99;
const TOTAL_CENTS = 999;
const STRIPE_SESSION_ID = 'cs_test_abc123';
const STRIPE_SESSION_URL = 'https://checkout.stripe.com/pay/cs_test_abc123';

const mockShowtime = {
  id: 1,
  ticketPrice: TICKET_PRICE
};

const mockUser: User = {
  id: 1,
  email: 'user@example.com',
  role: UserRole.USER
} as User;

const mockOrdersRepository = {
  create: jest.fn(),
  save: jest.fn()
};

const mockShowtimesRepository = {
  findOne: jest.fn()
};

const mockStripeService = {
  createCheckoutSession: jest.fn()
};

describe('PaymentsService', () => {
  let service: PaymentsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: getRepositoryToken(Order),
          useValue: mockOrdersRepository
        },
        {
          provide: getRepositoryToken(Showtime),
          useValue: mockShowtimesRepository
        },
        {
          provide: StripeService,
          useValue: mockStripeService
        }
      ]
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  describe('createCheckoutSession', () => {
    const dto: CreateCheckoutSessionDto = {
      showtimeId: 1,
      seatIds: [1],
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel'
    };

    it('should create a Stripe session and a pending Order', async () => {
      mockShowtimesRepository.findOne.mockResolvedValue(mockShowtime);
      mockStripeService.createCheckoutSession.mockResolvedValue({
        sessionId: STRIPE_SESSION_ID,
        url: STRIPE_SESSION_URL
      });
      const savedOrder = { id: 42 };
      mockOrdersRepository.create.mockReturnValue(savedOrder);
      mockOrdersRepository.save.mockResolvedValue(savedOrder);

      const result = await service.createCheckoutSession(dto, mockUser);

      expect(mockStripeService.createCheckoutSession).toHaveBeenCalledWith({
        totalCents: TOTAL_CENTS,
        seatCount: 1,
        showtimeId: 1,
        successUrl: dto.successUrl,
        cancelUrl: dto.cancelUrl
      });
      expect(mockOrdersRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUser.id,
          showtimeId: 1,
          stripeSessionId: STRIPE_SESSION_ID,
          status: OrderStatus.PENDING,
          totalCents: TOTAL_CENTS,
          seatIds: [1]
        })
      );
      expect(result).toEqual({
        sessionId: STRIPE_SESSION_ID,
        url: STRIPE_SESSION_URL,
        orderId: 42
      });
    });

    it('should calculate totalCents correctly for multiple seats', async () => {
      const multiSeatDto = { ...dto, seatIds: [1, 2, 3] };
      mockShowtimesRepository.findOne.mockResolvedValue(mockShowtime);
      mockStripeService.createCheckoutSession.mockResolvedValue({
        sessionId: STRIPE_SESSION_ID,
        url: STRIPE_SESSION_URL
      });
      mockOrdersRepository.create.mockReturnValue({ id: 1 });
      mockOrdersRepository.save.mockResolvedValue({ id: 1 });

      await service.createCheckoutSession(multiSeatDto, mockUser);

      expect(mockStripeService.createCheckoutSession).toHaveBeenCalledWith(
        expect.objectContaining({ totalCents: TOTAL_CENTS * 3, seatCount: 3 })
      );
    });

    it('should throw NotFoundException when showtime does not exist', async () => {
      mockShowtimesRepository.findOne.mockResolvedValue(null);

      await expect(
        service.createCheckoutSession(dto, mockUser)
      ).rejects.toThrow(NotFoundException);
    });
  });
});
