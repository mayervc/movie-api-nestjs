import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { StripeService, ticketPriceToCents } from './stripe.service';

describe('ticketPriceToCents', () => {
  it('should convert decimal prices to cents', () => {
    expect(ticketPriceToCents(9.99)).toBe(999);
    expect(ticketPriceToCents(10)).toBe(1000);
    expect(ticketPriceToCents('12.50')).toBe(1250);
  });
});

describe('StripeService', () => {
  let service: StripeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StripeService,
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue(undefined) }
        }
      ]
    }).compile();

    service = module.get<StripeService>(StripeService);
  });

  it('should report not configured when STRIPE_SECRET_KEY is missing', () => {
    expect(service.isConfigured()).toBe(false);
  });
});
